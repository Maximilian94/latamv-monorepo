import { Injectable } from '@nestjs/common';
import { FlightRepository } from '../repository/flight.repository';
import { RouteSegment } from 'src/modules/flightDuty/model/flightSegment';
import { RouteRepository } from 'src/modules/route/repository/route.repository';
import { Prisma, Route } from '@prisma/client';
import { sample } from 'lodash';
import * as dayjs from 'dayjs';
import { EventService } from '../../event/services/event.service';
import { AircraftRepository } from '../../aircraft/repositories/aircraft.repository';
import { RegisterFlightEventDto } from '../dto/register-flight-events.dto';

// Fallback scoring config used when a flight has no procedure version and no
// PUBLISHED version exists for its aircraft model.
const DEFAULT_SCORING_CONFIG = {
  baseScore: 100,
  passingScore: 70,
  weightStd: 0,
  weightExc: 1,
  weightDev: -5,
  weightCmp: -15,
};

@Injectable()
export class FlightService {
  constructor(
    private flightRepository: FlightRepository,
    private routeRepository: RouteRepository,
    private eventsService: EventService,
    private aircraftRepository: AircraftRepository,
  ) {}

  async createFlightsFromRoutesSegment(
    routes: RouteSegment[],
    flightDutyId: number,
    userId: number,
    aircraftRegistration: string,
    userSubsidiaryIcaoCode?: string,
  ) {
    const routesRequests = [];

    routes.forEach(({ departure, arrival }) => {
      // Build the where clause for route filtering
      const whereClause: any = {
        departure_icao: departure,
        arrival_icao: arrival,
        available: true,
      };

      // Add subsidiary filter if user has a subsidiary
      if (userSubsidiaryIcaoCode) {
        whereClause.ident_icao = {
          startsWith: userSubsidiaryIcaoCode,
        };
      }

      const request = this.routeRepository.getRoutes({
        where: whereClause,
      });
      routesRequests.push(request);
    });

    const routesResponses: Route[] = await Promise.all(routesRequests);

    const routesSampled = routesResponses.map((possibleRoutes) => {
      return sample<Route>(possibleRoutes);
    });

    // Get aircraft model from registration
    const aircraft =
      await this.aircraftRepository.getAircraftByRegistration(
        aircraftRegistration,
      );
    const aircraftModel = aircraft?.aircraftModel?.model || 'Unknown';

    const flightsToCreate: Prisma.FlightCreateManyInput[] = routesSampled.map(
      (route, index) => ({
        flightDutyId,
        userId,
        aircraftRegistration,
        aircraftModel,
        index,
        flightNumber: route.ident_icao,
        departureIcao: route.departure_icao,
        arrivalIcao: route.arrival_icao,
        eet: route.eet,
        OFF: null,
        OUT: null,
        IN: null,
        ON: null,
        endAcarsTime: null,
        startAcarsTime: null,
      }),
    );

    return this.flightRepository.createFlights(flightsToCreate);
  }

  async sampleRoutesFromRoutesSegments(
    routes: RouteSegment[],
    aircraft_model_codes: string[],
    userSubsidiaryIcaoCode?: string,
  ) {
    const routesRequests = [];
    console.log('sampleRoutesFromRoutesSegments', routes);

    routes.forEach(({ departure, arrival }) => {
      // Build the where clause for route filtering
      const whereClause: any = {
        departure_icao: departure,
        arrival_icao: arrival,
        available: true,
        ...(aircraft_model_codes.length > 0
          ? { aircraft_model_code: { in: aircraft_model_codes } }
          : {}),
      };

      // Add subsidiary filter if user has a subsidiary
      if (userSubsidiaryIcaoCode) {
        whereClause.ident_icao = {
          startsWith: userSubsidiaryIcaoCode,
        };
      }

      const request = this.routeRepository.getRoutes({
        where: whereClause,
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

  async registerFlightEvents({
    flightId,
    events,
  }: {
    flightId: number;
    events: RegisterFlightEventDto[];
  }) {
    const data = events.map((event) => ({
      flightId,
      eventId: event.eventId,
      timestamp: new Date(event.timestamp),
      ...(event.details !== undefined ? { details: event.details } : {}),
    }));

    return this.eventsService.registerManyFlightEvents(data as any);
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

    // Resolve scoring config (flight's version -> published version -> defaults)
    const config =
      (await this.flightRepository.getScoringConfigForFlight(flightId)) ??
      DEFAULT_SCORING_CONFIG;

    // score = base 100 - penalties, clamped to [0, 100]
    const rawScore =
      config.baseScore +
      amountOfStandardCompliance * config.weightStd +
      amountOfProactiveExcellence * config.weightExc +
      amountOfProceduralDeviation * config.weightDev +
      amountOfSafetyCompromise * config.weightCmp;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return await this.flightRepository.reviewFlight({
      flightId,
      amountOfProactiveExcellence,
      amountOfProceduralDeviation,
      amountOfSafetyCompromise,
      amountOfStandardCompliance,
      score,
    });
  }
}
