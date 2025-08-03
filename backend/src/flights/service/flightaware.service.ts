import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

export interface FlightAwareScheduledFlight {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  flight_number: string;
  aircraft_type: string;
  origin: {
    code_icao: string;
    code_iata: string;
  };
  destination: {
    code_icao: string;
    code_iata: string;
  };
  filed_ete: number;
  scheduled_out: string;
  scheduled_in: string;
}

export interface FlightAwareResponse {
  links: {
    next: string;
  };
  num_pages: number;
  scheduled: FlightAwareScheduledFlight[];
}

export interface RouteData {
  id: number;
  ident_icao: string;
  ident_iata: string;
  aircraft_model_code: string;
  departure_icao: string;
  arrival_icao: string;
  eet: string;
  aircraftTypes: string[];
}

@Injectable()
export class FlightAwareService {
  private readonly logger = new Logger(FlightAwareService.name);
  private readonly baseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private readonly operators = ['TAM', 'LAN', 'LPE', 'LNE', 'LAI', 'LAP'];
  private readonly rateLimitDelay = 60000; // 1 minute in milliseconds

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async generateRoutesFromFlightAware(): Promise<{
    routesCreated: number;
    routesUpdated: number;
    errors: string[];
  }> {
    const result = {
      routesCreated: 0,
      routesUpdated: 0,
      errors: [] as string[],
    };

    const routeMap = new Map<string, RouteData>();

    for (const operator of this.operators) {
      try {
        this.logger.log(`Processing operator: ${operator}`);
        const operatorRoutes = await this.fetchAllScheduledFlights(operator);

        // Process routes for this operator
        for (const flight of operatorRoutes) {
          const routeKey = `${flight.flight_number}_${flight.origin.code_icao}_${flight.destination.code_icao}`;

          if (!routeMap.has(routeKey)) {
            // Create new route entry
            routeMap.set(routeKey, {
              id: parseInt(flight.flight_number),
              ident_icao: flight.ident_icao,
              ident_iata: flight.ident_iata,
              aircraft_model_code: this.mapAircraftTypeToModel(
                flight.aircraft_type,
              ),
              departure_icao: flight.origin.code_icao,
              arrival_icao: flight.destination.code_icao,
              eet: this.formatEET(flight.filed_ete),
              aircraftTypes: [flight.aircraft_type],
            });
          } else {
            // Add aircraft type to existing route
            const existingRoute = routeMap.get(routeKey)!;
            if (!existingRoute.aircraftTypes.includes(flight.aircraft_type)) {
              existingRoute.aircraftTypes.push(flight.aircraft_type);
            }
          }
        }

        // Rate limiting between operators
        if (operator !== this.operators[this.operators.length - 1]) {
          this.logger.log(
            `Waiting ${this.rateLimitDelay / 1000} seconds before next operator...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.rateLimitDelay),
          );
        }
      } catch (error) {
        const errorMsg = `Error processing operator ${operator}: ${error.message}`;
        this.logger.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // Save routes to database
    await this.saveRoutesToDatabase(routeMap, result);

    return result;
  }

  private async fetchAllScheduledFlights(
    operator: string,
  ): Promise<FlightAwareScheduledFlight[]> {
    const allFlights: FlightAwareScheduledFlight[] = [];
    let nextPage = '';
    let pageCount = 0;

    do {
      try {
        const url = `${this.baseUrl}/operators/${operator}/flights/scheduled`;
        const params = nextPage ? { next: nextPage } : {};

        this.logger.log(
          `Fetching page ${pageCount + 1} for operator ${operator}`,
        );

        const response = await firstValueFrom(
          this.httpService.get<FlightAwareResponse>(url, {
            params,
            headers: {
              'x-apikey': process.env.FLIGHTAWARE_API_KEY,
            },
          }),
        );

        allFlights.push(...response.data.scheduled);
        nextPage = response.data.links.next;
        pageCount++;

        // Rate limiting between pages
        if (nextPage) {
          this.logger.log(
            `Waiting ${this.rateLimitDelay / 1000} seconds before next page...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.rateLimitDelay),
          );
        }
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limit exceeded, wait longer
          this.logger.warn('Rate limit exceeded, waiting 2 minutes...');
          await new Promise((resolve) => setTimeout(resolve, 120000));
          continue;
        }
        throw error;
      }
    } while (nextPage);

    this.logger.log(
      `Fetched ${allFlights.length} flights for operator ${operator}`,
    );
    return allFlights;
  }

  private async saveRoutesToDatabase(
    routeMap: Map<string, RouteData>,
    result: {
      routesCreated: number;
      routesUpdated: number;
      errors: string[];
    },
  ): Promise<void> {
    for (const [routeKey, routeData] of routeMap) {
      try {
        // Check if route already exists
        const existingRoute = await this.prisma.route.findUnique({
          where: { id: routeData.id },
          include: { routeAircraft: true },
        });

        if (existingRoute) {
          // Update existing route
          await this.prisma.route.update({
            where: { id: routeData.id },
            data: {
              ident_icao: routeData.ident_icao,
              ident_iata: routeData.ident_iata,
              aircraft_model_code: routeData.aircraft_model_code,
              departure_icao: routeData.departure_icao,
              arrival_icao: routeData.arrival_icao,
              eet: routeData.eet,
              updated_at: new Date(),
            },
          });

          // Update aircraft types
          await this.updateRouteAircraft(routeData.id, routeData.aircraftTypes);
          result.routesUpdated++;
        } else {
          // Create new route
          await this.prisma.route.create({
            data: {
              id: routeData.id,
              ident_icao: routeData.ident_icao,
              ident_iata: routeData.ident_iata,
              aircraft_model_code: routeData.aircraft_model_code,
              departure_icao: routeData.departure_icao,
              arrival_icao: routeData.arrival_icao,
              eet: routeData.eet,
            },
          });

          // Create aircraft type associations
          await this.createRouteAircraft(routeData.id, routeData.aircraftTypes);
          result.routesCreated++;
        }
      } catch (error) {
        const errorMsg = `Error saving route ${routeKey}: ${error.message}`;
        this.logger.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }
  }

  private async updateRouteAircraft(
    routeId: number,
    aircraftTypes: string[],
  ): Promise<void> {
    // Delete existing associations
    await this.prisma.routeAircraft.deleteMany({
      where: { routeId },
    });

    // Create new associations
    await this.createRouteAircraft(routeId, aircraftTypes);
  }

  private async createRouteAircraft(
    routeId: number,
    aircraftTypes: string[],
  ): Promise<void> {
    const routeAircraftData = aircraftTypes.map((aircraftType) => ({
      routeId,
      aircraftType,
    }));

    await this.prisma.routeAircraft.createMany({
      data: routeAircraftData,
      skipDuplicates: true,
    });
  }

  private mapAircraftTypeToModel(aircraftType: string): string {
    // Map FlightAware aircraft types to our aircraft model codes
    const aircraftTypeMap: Record<string, string> = {
      A318: 'A318',
      A319: 'A319',
      A320: 'A320',
      A321: 'A321',
      A350: 'A350',
      'A350-900': 'A350',
      'A350-1000': 'A350',
      B767: 'B767',
      B777: 'B777',
      B787: 'B787',
      'B787-8': 'B787',
      'B787-9': 'B787',
      'B787-10': 'B787',
    };

    return aircraftTypeMap[aircraftType] || 'A320'; // Default to A320 if unknown
  }

  private formatEET(filedEte: number): string {
    if (!filedEte) return '00:00';

    const hours = Math.floor(filedEte / 60);
    const minutes = filedEte % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
