import { Injectable } from '@nestjs/common';
import { FlightRepository } from '../repository/flight.repository';
import { RouteSegment } from 'src/modules/flightDuty/model/flightSegment';
import { RouteRepository } from 'src/modules/route/repository/route.repository';
import { Prisma, Route } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { sample } from 'lodash';
import * as dayjs from 'dayjs';
import { EventService } from '../../event/services/event.service';

@Injectable()
export class FlightService {
  constructor(
    private flightRepository: FlightRepository,
    private routeRepository: RouteRepository,
    private eventsService: EventService,
    private prisma: PrismaService,
  ) {}

  async createFlightsFromRoutesSegment(
    routes: RouteSegment[],
    flightDutyId: number,
    userId: number,
    aircraftRegistration: string,
  ) {
    const routesRequests = [];

    routes.forEach(({ departure, arrival }) => {
      const request = this.routeRepository.getRoutes({
        where: {
          departure_icao: departure,
          arrival_icao: arrival,
          available: true,
        },
      });
      routesRequests.push(request);
    });

    const routesResponses: Route[] = await Promise.all(routesRequests);

    const routesSampled = routesResponses.map((possibleRoutes) => {
      return sample<Route>(possibleRoutes);
    });

    // Get aircraft for each route and select a random one
    const flightsToCreate: Prisma.FlightCreateManyArgs['data'] = [];

    for (let index = 0; index < routesSampled.length; index++) {
      const route = routesSampled[index];

      // Get available aircraft for this route
      const routeAircraft = await this.prisma.routeAircraft.findMany({
        where: {
          flight_number: route.flight_number,
        },
        include: {
          aircraftModel: {
            include: {
              aircrafts: {
                where: {
                  active: true,
                },
              },
            },
          },
        },
      });

      // Select a random aircraft from the available ones
      let selectedAircraft = null;
      for (const ra of routeAircraft) {
        if (ra.aircraftModel.aircrafts.length > 0) {
          selectedAircraft = sample(ra.aircraftModel.aircrafts);
          break;
        }
      }

      // Use the provided aircraftRegistration as fallback
      const finalAircraftRegistration =
        selectedAircraft?.registration || aircraftRegistration;

      flightsToCreate.push({
        flightDutyId,
        routeId: route.flight_number,
        userId,
        aircraftRegistration: finalAircraftRegistration,
        index,
        OFF: null,
        OUT: null,
        IN: null,
        ON: null,
        endAcarsTime: null,
        startAcarsTime: null,
      });
    }

    return this.flightRepository.createFlights(flightsToCreate);
  }

  async sampleRoutesFromRoutesSegments(
    routes: RouteSegment[],
    aircraft_model_codes: string[],
  ) {
    const routesRequests = [];
    console.log('sampleRoutesFromRoutesSegments', routes);

    routes.forEach(({ departure, arrival }) => {
      // Use Prisma directly to handle aircraft filtering with RouteAircraft
      const request =
        aircraft_model_codes.length > 0
          ? this.prisma.route.findMany({
              where: {
                departure_icao: departure,
                arrival_icao: arrival,
                available: true,
                routeAircraft: {
                  some: {
                    aircraft_code: {
                      in: aircraft_model_codes,
                    },
                  },
                },
              },
            })
          : this.routeRepository.getRoutes({
              where: {
                departure_icao: departure,
                arrival_icao: arrival,
                available: true,
              },
            });
      routesRequests.push(request);
    });

    const routesResponses: Route[][] = await Promise.all(routesRequests);

    console.log('Possiveis rotas', routesResponses);

    const routesSampled = routesResponses
      .map((possibleRoutes) => {
        const sampled = sample<Route>(possibleRoutes);
        if (!sampled) {
          console.warn(
            `No routes found for segment with ${possibleRoutes.length} possible routes`,
          );
        }
        return sampled;
      })
      .filter(Boolean); // Remove undefined values

    return routesSampled;
  }

  createFlights(flights: Prisma.FlightCreateManyInput[]) {
    return this.flightRepository.createFlights(flights);
  }

  async finishFlightById({
    flightId,
    startAcarsTime,
    endAcarsTime,
    OUT,
    IN,
    ON,
    OFF,
  }: {
    flightId: number;
    startAcarsTime: Date;
    endAcarsTime: Date;
    OUT: Date;
    IN: Date;
    ON: Date;
    OFF: Date;
  }) {
    return this.flightRepository.updateFlightById({
      flightId,
      data: {
        isClosed: true,
        startAcarsTime,
        endAcarsTime,
        OUT,
        IN,
        ON,
        OFF,
      },
    });
  }

  async getFlightHoursByUser({ userId }: { userId: number }) {
    try {
      const listOfFlights = await this.flightRepository.getFlightsHoursByUserId(
        {
          userId,
        },
      );

      return listOfFlights.reduce((sum, flight) => {
        if (flight.OUT && flight.IN) {
          const outTime = dayjs(flight.OUT);
          const inTime = dayjs(flight.IN);
          const durationMinutes = inTime.diff(outTime, 'minute', true);
          return sum + durationMinutes;
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error('Erro ao calcular horas de voo:', error);
      throw error;
    }
  }

  async getAllUserFlights({ userId }: { userId: number }) {
    return this.flightRepository.getFlightsByUser({ userId });
  }

  async getFlightById({
    flightId,
    userId,
  }: {
    flightId: number;
    userId: number;
  }) {
    return this.flightRepository.getFlightById({ flightId, userId });
  }

  async reviewFlightById({ flightId }: { flightId: number }) {
    const flightEvents = await this.eventsService.getFlightEventByFlightId({
      flightId,
    });

    // Initialize counters for each severity
    let amountOfProactiveExcellence = 0;
    let amountOfStandardCompliance = 0;
    let amountOfProceduralDeviation = 0;
    let amountOfSafetyCompromise = 0;

    // Count events by severity.name
    flightEvents.forEach((flightEvent) => {
      const severityName = flightEvent.event.severity.name;
      if (severityName === 'ProactiveExcellence') {
        amountOfProactiveExcellence++;
      } else if (severityName === 'StandardCompliance') {
        amountOfStandardCompliance++;
      } else if (severityName === 'ProceduralDeviation') {
        amountOfProceduralDeviation++;
      } else if (severityName === 'SafetyCompromise') {
        amountOfSafetyCompromise++;
      }
    });

    return await this.flightRepository.reviewFlight({
      flightId,
      amountOfProactiveExcellence,
      amountOfProceduralDeviation,
      amountOfSafetyCompromise,
      amountOfStandardCompliance,
    });
  }
}
