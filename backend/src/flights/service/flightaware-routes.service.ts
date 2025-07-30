import { Injectable } from '@nestjs/common';
import { FlightAwareService } from './flightaware.service';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class FlightAwareRoutesService {
  constructor(
    private readonly flightAwareService: FlightAwareService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Update routes in database using FlightAware - Page by page approach
   */
  async updateRoutesDatabase(): Promise<{
    routesUpdated: any[];
    routesAdded: any[];
    pagesProcessed: number;
    totalRoutesProcessed: number;
  }> {
    const response = {
      routesUpdated: [],
      routesAdded: [],
      pagesProcessed: 0,
      totalRoutesProcessed: 0,
    };

    try {
      console.log('Starting FlightAware routes update - Page by page...');

      // Get existing routes from database (once)
      const existingRoutes = await this.prisma.route.findMany({
        include: {
          routeAircraft: {
            include: {
              aircraftModel: true,
            },
          },
        },
      });

      console.log(`Found ${existingRoutes.length} existing routes in database`);

      // Get ALL routes from FlightAware with pagination
      console.log('Fetching ALL routes from FlightAware...');
      const allFlightAwareRoutes =
        await this.flightAwareService.getScheduledFlightsWithPagination(
          'TAM',
          undefined,
          undefined,
          undefined, // No page limit - get ALL pages
        );

      console.log(
        `Found ${allFlightAwareRoutes.length} total routes from FlightAware`,
      );

      // Process each route
      for (const flightAwareFlight of allFlightAwareRoutes) {
        try {
          // Convert to internal format
          const flightAwareRoute =
            this.flightAwareService.convertToInternalFormat(flightAwareFlight);

          // Find existing route
          const existingRoute = existingRoutes.find(
            (route) => route.flight_number === flightAwareRoute.flight_number,
          );

          // Use upsert to handle both create and update
          const upsertedRoute = await this.prisma.route.upsert({
            where: { flight_number: flightAwareRoute.flight_number },
            update: {
              ident_icao: flightAwareRoute.ident_icao,
              ident_iata: flightAwareRoute.ident_iata,
              departure_icao: flightAwareRoute.departure_icao,
              arrival_icao: flightAwareRoute.arrival_icao,
              eet_seconds: flightAwareRoute.eet,
              updated_at: new Date(),
            },
            create: {
              flight_number: flightAwareRoute.flight_number,
              ident_icao: flightAwareRoute.ident_icao,
              ident_iata: flightAwareRoute.ident_iata,
              departure_icao: flightAwareRoute.departure_icao,
              arrival_icao: flightAwareRoute.arrival_icao,
              eet_seconds: flightAwareRoute.eet,
            },
          });

          // Update aircraft associations
          await this.updateRouteAircraft(
            flightAwareRoute.flight_number,
            flightAwareRoute.aircraft_types,
          );

          // Track if it was created or updated
          if (existingRoute) {
            response.routesUpdated.push(upsertedRoute);
          } else {
            response.routesAdded.push(upsertedRoute);
          }

          response.totalRoutesProcessed++;
        } catch (routeError) {
          console.error(
            `Error processing route ${flightAwareFlight.flight_number}:`,
            routeError,
          );
          // Continue with next route
        }
      }

      response.pagesProcessed = 1; // We processed all pages in one go

      console.log(
        `\n=== Database update completed ===`,
        `\nPages processed: ${response.pagesProcessed}`,
        `\nRoutes added: ${response.routesAdded.length}`,
        `\nRoutes updated: ${response.routesUpdated.length}`,
        `\nTotal routes processed: ${response.totalRoutesProcessed}`,
      );

      return response;
    } catch (error) {
      console.error('Error updating routes database:', error);
      throw error;
    }
  }

  /**
   * Create aircraft associations for a route
   */
  private async createRouteAircraft(
    flightNumber: number,
    aircraftTypes: string[],
  ) {
    // Delete existing associations
    await this.prisma.routeAircraft.deleteMany({
      where: { flight_number: flightNumber },
    });

    // Create new associations
    for (const aircraftType of aircraftTypes) {
      const aircraftCode = await this.ensureAircraftModelExists(aircraftType);

      if (aircraftCode) {
        await this.prisma.routeAircraft.create({
          data: {
            flight_number: flightNumber,
            aircraft_code: aircraftCode,
          },
        });
      }
    }
  }

  /**
   * Update aircraft associations for a route
   */
  private async updateRouteAircraft(
    flightNumber: number,
    aircraftTypes: string[],
  ) {
    // Delete existing associations
    await this.prisma.routeAircraft.deleteMany({
      where: { flight_number: flightNumber },
    });

    // Create new associations
    for (const aircraftType of aircraftTypes) {
      const aircraftCode = await this.ensureAircraftModelExists(aircraftType);

      if (aircraftCode) {
        await this.prisma.routeAircraft.create({
          data: {
            flight_number: flightNumber,
            aircraft_code: aircraftCode,
          },
        });
      }
    }
  }

  /**
   * Map FlightAware aircraft codes to our database codes
   */
  private mapAircraftCode(flightAwareCode: string): string | null {
    const aircraftCodeMap: { [key: string]: string } = {
      A319: 'A319',
      A320: 'A320',
      A321: 'A321',
      A320neo: 'A20N',
      A321neo: 'A21N',
      // Add more mappings as needed
    };

    return aircraftCodeMap[flightAwareCode] || null;
  }

  /**
   * Ensure aircraft model exists in database, create if it doesn't
   */
  private async ensureAircraftModelExists(
    flightAwareCode: string,
  ): Promise<string | null> {
    // First try to map to known codes
    let aircraftCode = this.mapAircraftCode(flightAwareCode);

    if (!aircraftCode) {
      // If not mapped, use the original code
      aircraftCode = flightAwareCode;
    }

    // Check if aircraft model exists in database
    const existingModel = await this.prisma.aircraftModel.findUnique({
      where: { code: aircraftCode },
    });

    if (existingModel) {
      return aircraftCode;
    }

    // If doesn't exist, create it with default values
    try {
      console.log(
        `Creating new aircraft model: ${aircraftCode} (from FlightAware: ${flightAwareCode})`,
      );

      await this.prisma.aircraftModel.create({
        data: {
          code: aircraftCode,
          manufacturer: this.guessManufacturer(aircraftCode),
          model: aircraftCode,
        },
      });

      return aircraftCode;
    } catch (error) {
      console.error(`Failed to create aircraft model ${aircraftCode}:`, error);
      return null;
    }
  }

  /**
   * Guess manufacturer based on aircraft code
   */
  private guessManufacturer(aircraftCode: string): string {
    // Common manufacturer patterns
    if (
      aircraftCode.startsWith('A3') ||
      aircraftCode.startsWith('A20') ||
      aircraftCode.startsWith('A21')
    ) {
      return 'Airbus';
    }
    if (aircraftCode.startsWith('B7')) {
      return 'Boeing';
    }
    if (aircraftCode.startsWith('E1') || aircraftCode.startsWith('E2')) {
      return 'Embraer';
    }
    if (aircraftCode.startsWith('AT')) {
      return 'Aerospatiale';
    }

    // Default to Airbus for LATAM (most common)
    return 'Airbus';
  }

  /**
   * Get all routes from database with aircraft information
   */
  async getAllRoutes() {
    return this.prisma.route.findMany({
      include: {
        routeAircraft: {
          include: {
            aircraftModel: true,
          },
        },
        flights: true,
      },
    });
  }

  /**
   * Get route by flight number
   */
  async getRouteByFlightNumber(flightNumber: number) {
    return this.prisma.route.findUnique({
      where: { flight_number: flightNumber },
      include: {
        routeAircraft: {
          include: {
            aircraftModel: true,
          },
        },
        flights: true,
      },
    });
  }
}
