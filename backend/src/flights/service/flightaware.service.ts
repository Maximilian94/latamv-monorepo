import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

// FlightAware API Response Interfaces
export interface FlightAwareAirport {
  code: string;
  code_icao: string;
  code_iata: string;
  code_lid: string | null;
  timezone: string;
  name: string;
  city: string;
  airport_info_url: string;
}

export interface FlightAwareScheduledFlight {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  actual_runway_off: string | null;
  actual_runway_on: string | null;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string | null;
  atc_ident: string | null;
  inbound_fa_flight_id: string | null;
  codeshares: string[];
  codeshares_iata: string[];
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: FlightAwareAirport;
  destination: FlightAwareAirport;
  departure_delay: number;
  arrival_delay: number;
  filed_ete: number;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  scheduled_off: string;
  estimated_off: string;
  actual_off: string | null;
  scheduled_on: string;
  estimated_on: string;
  actual_on: string | null;
  scheduled_in: string;
  estimated_in: string;
  actual_in: string | null;
  progress_percent: number;
  status: string;
  aircraft_type: string;
  route_distance: number;
  filed_airspeed: number;
  filed_altitude: number | null;
  route: string | null;
  baggage_claim: string | null;
  seats_cabin_business: number | null;
  seats_cabin_coach: number | null;
  seats_cabin_first: number | null;
  gate_origin: string | null;
  gate_destination: string | null;
  terminal_origin: string | null;
  terminal_destination: string | null;
  type: string;
}

export interface FlightAwareResponse {
  scheduled: FlightAwareScheduledFlight[];
  links?: {
    next?: string;
  };
}

// Our internal flight interface (new simplified structure)
export interface FlightAwareFlight {
  flight_number: string;
  ident_icao: string;
  ident_iata: string;
  departure_icao: string;
  arrival_icao: string;
  eet: number; // Estimated elapsed time in minutes
  aircraft_types: string[]; // Array of aircraft type codes
}

@Injectable()
export class FlightAwareService {
  private readonly baseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private readonly apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey =
      this.configService.get<string>('FLIGHTAWARE_API_KEY') ||
      'GnSEck1SueNLzp9AVbHb8CKAxDr5vHPy';
  }

  /**
   * Get scheduled flights for a specific operator
   * @param operatorId - ICAO or IATA operator code (e.g., 'TAM', 'JJ')
   * @param start - Start date in ISO8601 format (optional)
   * @param end - End date in ISO8601 format (optional)
   * @param maxPages - Maximum number of pages to fetch (default: 1)
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequestWithRetry(
    url: string,
    maxRetries: number = 3,
    baseDelay: number = 60000, // 1 minute base delay
  ): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log('Making request to', url);
        const response = await firstValueFrom(
          this.httpService.get<FlightAwareResponse>(url, {
            headers: {
              'x-apikey': this.apiKey,
            },
          }),
        );
        return response;
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;

          // If rate limited (429), wait 1 minute minimum
          if (status === 429) {
            const waitTime = baseDelay * Math.pow(2, attempt); // 1min, 2min, 4min
            console.log(
              `Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries + 1}`,
            );
            await this.delay(waitTime);
            continue;
          }

          // If other error and not last attempt, wait 1 minute
          if (attempt < maxRetries) {
            const waitTime = baseDelay * Math.pow(2, attempt);
            console.log(
              `Request failed. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries + 1}`,
            );
            await this.delay(waitTime);
            continue;
          }
        }

        // If we get here, either it's not an AxiosError or we've exhausted retries
        throw error;
      }
    }
  }

  async getScheduledFlights(
    operatorId: string,
    start?: string,
    end?: string,
    maxPages: number = 1,
  ): Promise<FlightAwareScheduledFlight[]> {
    // Check cache first
    const cacheKey = `${operatorId}-${start}-${end}-${maxPages}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached FlightAware data');
      return cached.data;
    }

    const allFlights: FlightAwareScheduledFlight[] = [];
    let currentPage = 1;
    let cursor: string | undefined;

    try {
      while (currentPage <= maxPages) {
        let url: string;

        if (cursor) {
          // If we have a cursor, check if it's a complete URL or just a path
          if (cursor.startsWith('http')) {
            url = cursor; // Complete URL
          } else {
            url = `${this.baseUrl}${cursor}`; // Add base URL to path
          }
        } else {
          // First request - build URL with parameters
          const params = new URLSearchParams();
          if (start) params.append('start', start);
          if (end) params.append('end', end);
          url = `${this.baseUrl}/operators/${operatorId}/flights/scheduled?${params.toString()}`;
        }

        console.log(`Fetching page ${currentPage} from FlightAware...`);

        const response = await this.makeRequestWithRetry(url);
        const { scheduled, links } = response.data;

        console.log(
          `Received ${scheduled.length} flights from page ${currentPage}`,
        );
        allFlights.push(...scheduled);

        // Add delay between pages to respect rate limits
        if (currentPage < maxPages && links?.next) {
          console.log('Waiting 2 seconds before next page...');
          await this.delay(2000);
          cursor = links.next;
          currentPage++;
        } else {
          break;
        }
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: allFlights,
        timestamp: Date.now(),
      });

      return allFlights;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          'FlightAware API Error:',
          error.response?.data || error.message,
        );
        throw new Error(
          `FlightAware API Error: ${error.response?.status} - ${error.response?.statusText}`,
        );
      }
      throw error;
    }
  }

  /**
   * Convert FlightAware flight data to our internal format
   */
  convertToInternalFormat(
    flightAwareFlight: FlightAwareScheduledFlight,
  ): FlightAwareFlight {
    return {
      flight_number: flightAwareFlight.flight_number,
      ident_icao: flightAwareFlight.ident_icao,
      ident_iata: flightAwareFlight.ident_iata,
      departure_icao: flightAwareFlight.origin.code_icao,
      arrival_icao: flightAwareFlight.destination.code_icao,
      eet: flightAwareFlight.filed_ete, // Already in minutes
      aircraft_types: [flightAwareFlight.aircraft_type], // Single aircraft type for now
    };
  }

  /**
   * Get scheduled flights with pagination support
   * @param operatorId - ICAO or IATA operator code
   * @param start - Start date in ISO8601 format (optional)
   * @param end - End date in ISO8601 format (optional)
   * @param maxPages - Maximum number of pages to fetch (default: unlimited)
   */
  async getScheduledFlightsWithPagination(
    operatorId: string,
    start?: string,
    end?: string,
    maxPages?: number,
  ): Promise<FlightAwareScheduledFlight[]> {
    const allFlights: FlightAwareScheduledFlight[] = [];
    let currentPage = 1;
    let cursor: string | undefined;
    let hasMorePages = true;

    try {
      while (hasMorePages && (!maxPages || currentPage <= maxPages)) {
        let url: string;

        if (cursor) {
          // If we have a cursor, check if it's a complete URL or just a path
          if (cursor.startsWith('http')) {
            url = cursor; // Complete URL
          } else {
            url = `${this.baseUrl}${cursor}`; // Add base URL to path
          }
        } else {
          // First request - build URL with parameters
          const params = new URLSearchParams();
          if (start) params.append('start', start);
          if (end) params.append('end', end);
          url = `${this.baseUrl}/operators/${operatorId}/flights/scheduled?${params.toString()}`;
        }

        console.log(`Fetching page ${currentPage} from FlightAware...`);

        const response = await this.makeRequestWithRetry(url);
        const { scheduled, links } = response.data;

        console.log(
          `Received ${scheduled.length} flights from page ${currentPage}`,
        );

        if (scheduled.length === 0) {
          console.log(
            `No flights found on page ${currentPage}. Stopping pagination.`,
          );
          hasMorePages = false;
          break;
        }

        allFlights.push(...scheduled);

        // Check if there are more pages
        if (links?.next) {
          cursor = links.next;
          currentPage++;

          // Add delay between pages to respect rate limits
          console.log('Waiting 2 seconds before next page...');
          await this.delay(2000);
        } else {
          console.log(
            `No more pages available. Total pages processed: ${currentPage}`,
          );
          hasMorePages = false;
        }
      }

      return allFlights;
    } catch (error) {
      console.error('Error in pagination:', error);
      throw error;
    }
  }

  /**
   * Get flights for LATAM (TAM/JJ) operator and group by flight number
   * This will aggregate multiple aircraft types for the same flight number
   */
  async getLATAMFlights(
    start?: string,
    end?: string,
  ): Promise<FlightAwareFlight[]> {
    try {
      const scheduledFlights = await this.getScheduledFlights(
        'TAM',
        start,
        end,
        5, // Get up to 5 pages to get more routes
      );

      // Filter out cancelled/diverted flights
      const validFlights = scheduledFlights.filter(
        (flight) => !flight.cancelled && !flight.diverted,
      );

      // Group by flight number and aggregate aircraft types
      const flightMap = new Map<string, FlightAwareFlight>();

      validFlights.forEach((flight) => {
        const flightNumber = flight.flight_number;

        if (flightMap.has(flightNumber)) {
          // Add aircraft type to existing flight if not already present
          const existingFlight = flightMap.get(flightNumber)!;
          if (!existingFlight.aircraft_types.includes(flight.aircraft_type)) {
            existingFlight.aircraft_types.push(flight.aircraft_type);
          }
        } else {
          // Create new flight entry
          flightMap.set(flightNumber, this.convertToInternalFormat(flight));
        }
      });

      return Array.from(flightMap.values());
    } catch (error) {
      console.error('Error getting LATAM flights:', error);
      return [];
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('FlightAware cache cleared');
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const flights = await this.getScheduledFlights(
        'TAM',
        undefined,
        undefined,
        1,
      );
      return flights.length > 0;
    } catch (error) {
      console.error('FlightAware connection test failed:', error);
      return false;
    }
  }
}
