import { Injectable } from '@nestjs/common';
import { FlightRepository } from '../repository/flight.repository';
import { RouteSegment } from 'src/modules/flightDuty/model/flightSegment';
import { RouteRepository } from 'src/modules/route/repository/route.repository';
import { Prisma, Route } from '@prisma/client';
import { sample } from 'lodash';
import * as dayjs from 'dayjs';
import { EventService } from '../../event/services/event.service';

@Injectable()
export class FlightService {
  constructor(
    private flightRepository: FlightRepository,
    private routeRepository: RouteRepository,
    private eventsService: EventService,
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

    const flightsToCreate: Prisma.FlightCreateManyArgs['data'] =
      routesSampled.map((route, index) => ({
        flightDutyId,
        userId,
        aircraftRegistration,
        index,
        flightNumber: route.flight_number,
        departureIcao: route.departure_icao,
        arrivalIcao: route.arrival_icao,
        eet: route.eet,
        OFF: null,
        OUT: null,
        IN: null,
        ON: null,
        endAcarsTime: null,
        startAcarsTime: null,
      }));

    return this.flightRepository.createFlights(flightsToCreate);
  }

  async sampleRoutesFromRoutesSegments(
    routes: RouteSegment[],
    aircraft_model_codes: string[],
  ) {
    const routesRequests = [];
    console.log('sampleRoutesFromRoutesSegments', routes);

    routes.forEach(({ departure, arrival }) => {
      const request = this.routeRepository.getRoutes({
        where: {
          departure_icao: departure,
          arrival_icao: arrival,
          available: true,
          ...(aircraft_model_codes.length > 0
            ? { aircraft_model_code: { in: aircraft_model_codes } }
            : {}),
        },
      });
      routesRequests.push(request);
    });

    const routesResponses: Route[] = await Promise.all(routesRequests);

    console.log('Possiveis rotas', routesResponses);

    const routesSampled = routesResponses.map((possibleRoutes) => {
      return sample<Route>(possibleRoutes);
    });

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
