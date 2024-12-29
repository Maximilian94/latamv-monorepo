import { Injectable } from '@nestjs/common';
import { FlightRepository } from '../repository/flight.repository';
import { RouteSegment } from 'src/modules/flightDuty/model/flightSegment';
import { RouteRepository } from 'src/modules/route/repository/route.repository';
import { Prisma, Route } from '@prisma/client';
import { sample } from 'lodash';

@Injectable()
export class FlightService {
  constructor(
    private flightRepository: FlightRepository,
    private routeRepository: RouteRepository,
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
      routesSampled.map(({ id }, index) => ({
        flightDutyId,
        routeId: id,
        userId,
        aircraftRegistration,
        index,
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

  async closeFlightById(flightId: number) {
    return this.flightRepository.closeFlightById(flightId);
  }
}
