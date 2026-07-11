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
  eet: number;
  aircraftTypes: string[];
}

@Injectable()
export class FlightAwareService {
  private readonly logger = new Logger(FlightAwareService.name);
  private readonly baseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private readonly operators = ['TAM', 'LAN', 'LPE', 'LNE', 'LAI', 'LAP'];

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async generateRoutesFromFlightAware(): Promise<{
    routesCreated: number;
    routesUpdated: number;
    errors: string[];
  }> {
    // Validate API key
    if (!process.env.FLIGHTAWARE_API_KEY) {
      const errorMsg = 'FLIGHTAWARE_API_KEY environment variable is not set';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.logger.log('Starting FlightAware route generation...');

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

        // Continue to next operator without delay
        this.logger.log(`Completed processing operator: ${operator}`);
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
        const url = nextPage
          ? `${this.baseUrl}${nextPage}`
          : `${this.baseUrl}/operators/${operator}/flights/scheduled`;

        this.logger.log(
          `Fetching page ${pageCount + 1} for operator ${operator}`,
        );

        if (nextPage) {
          this.logger.log(`Using next page URL: ${this.baseUrl}${nextPage}`);
        }

        const response = await firstValueFrom(
          this.httpService.get<FlightAwareResponse>(url, {
            headers: {
              'x-apikey': process.env.FLIGHTAWARE_API_KEY,
            },
          }),
        );

        this.logger.log(
          `Received ${response.data.scheduled.length} flights for operator ${operator} on page ${pageCount + 1}`,
        );

        // Check if we received any data
        if (!response.data.scheduled || response.data.scheduled.length === 0) {
          this.logger.warn(
            `No flights received for operator ${operator} on page ${pageCount + 1}`,
          );
          break;
        }

        allFlights.push(...response.data.scheduled);
        nextPage = response.data.links?.next || '';
        pageCount++;

        // Log pagination info
        this.logger.log(
          `Page ${pageCount} complete. Next page: ${nextPage || 'none'}. Total pages: ${response.data.num_pages}`,
        );

        // Only wait if there's a next page and we're not at the last page
        if (nextPage && pageCount < response.data.num_pages) {
          this.logger.log('Continuing to next page...');
        }
      } catch (error) {
        this.logger.error(
          `Error fetching page ${pageCount + 1} for operator ${operator}:`,
          error.response?.data || error.message,
        );

        if (error.response?.status === 429) {
          // Rate limit exceeded, wait longer
          this.logger.warn('Rate limit exceeded, waiting 2 minutes...');
          await new Promise((resolve) => setTimeout(resolve, 120000));
          continue;
        }

        if (error.response?.status === 400) {
          // Bad request - might be invalid pagination token
          this.logger.warn(
            `Bad request (400) for operator ${operator} on page ${pageCount + 1}. This might be the end of available data.`,
          );
          // Break the loop instead of throwing error
          break;
        }

        // For other errors, throw to be handled by the caller
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

  private formatEET(filedEte: number): number {
    if (!filedEte) return 0;

    // FlightAware AeroAPI's filed_ete is the filed estimated time enroute
    // already expressed in SECONDS — store it as-is. (It used to be multiplied
    // by 60 on the wrong assumption it was minutes, which inflated every EET
    // 60x, e.g. a 41-min hop became 41h.)
    return filedEte;
  }
}
