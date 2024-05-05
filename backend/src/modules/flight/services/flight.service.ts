import { Injectable } from '@nestjs/common';
import { FlightRepository } from '../repository/flight.repository';
import { RouteSegment } from 'src/modules/flightDuty/model/flightSegment';
import { RouteRepository } from 'src/modules/route/repository/route.repository';
import { Prisma, Route } from '@prisma/client';
import { sample } from 'lodash';

const TEST_USER_ID = 1000;

@Injectable()
export class FlightService {
  constructor(
    private flightRepository: FlightRepository,
    private routeRepository: RouteRepository,
  ) {}

  async createFlightsFromRoutesSegment(
    routes: RouteSegment[],
    flightDutyId: number,
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
      routesSampled.map(({ id }) => ({
        flightDutyId,
        routeId: id,
        userId: TEST_USER_ID,
      }));

    return this.flightRepository.createFlights(flightsToCreate);
  }

  async sampleRoutesFromRoutesSegments(routes: RouteSegment[]) {
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

    return routesSampled;
  }

  createFlights(flights: Prisma.FlightCreateManyInput[]) {
    return this.flightRepository.createFlights(flights);
  }
}
