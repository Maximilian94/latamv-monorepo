import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { FlightService } from 'src/modules/flight/services/flight.service';
import { RouteService } from 'src/modules/route/services/route.service';
import { Prisma } from '@prisma/client';
import { AircraftRepository } from '../../aircraft/repositories/aircraft.repository';

@Injectable()
export class FlightDutyRepository {
  constructor(
    private prisma: PrismaService,
    private routeService: RouteService,
    private flightService: FlightService,
    private aircraftRepository: AircraftRepository,
  ) {}

  async createFlightDuty(
    data: Prisma.FlightDutyCreateArgs['data'],
    routeIds: number[],
    userId: number,
  ) {
    console.log('RoutesID', routeIds);
    return this.prisma.$transaction(async () => {
      const flightDuty = await this.prisma.flightDuty.create({
        data,
      });

      const updateRoutes =
        await this.routeService.updateRoutesAvailabilityToFalse(routeIds);

      // Get route data to extract flight information
      const routes = await this.routeService.getRoutes({
        where: { id: { in: routeIds } },
      });

      // Get aircraft model from registration
      const aircraft = await this.aircraftRepository.getAircraftByRegistration(
        flightDuty.aircraftRegistration,
      );
      const aircraftModel = aircraft?.aircraftModel?.model || 'Unknown';

      const flightsToCreate: Prisma.FlightCreateManyInput[] = routes.map(
        (route, index) => ({
          flightDutyId: flightDuty.id,
          userId,
          aircraftRegistration: flightDuty.aircraftRegistration,
          aircraftModel,
          index,
          flightNumber: `${route.departure_icao}${route.arrival_icao}${index + 1}`,
          departureIcao: route.departure_icao,
          arrivalIcao: route.arrival_icao,
          eet: route.eet,
        }),
      );

      const createFlights =
        await this.flightService.createFlights(flightsToCreate);

      return { flightDuty, updateRoutes, createFlights };
    });
  }

  async getFlightDuties(data: Prisma.FlightDutyFindManyArgs) {
    return this.prisma.flightDuty.findMany(data);
  }

  async getUnfinishedFlightDutyByUserId(userId: number) {
    return this.prisma.flightDuty.findFirst({
      where: { userId, isClosed: false },
      include: {
        flights: { orderBy: { index: 'asc' } },
      },
    });
  }

  async getFlightDutyById(id: number) {
    return this.prisma.flightDuty.findUnique({
      where: { id },
      include: {
        flights: { orderBy: { index: 'asc' } },
      },
    });
  }

  async closeFlightDuty(id: number) {
    return this.prisma.flightDuty.update({
      where: { id },
      data: { isClosed: true },
      include: {
        flights: { orderBy: { index: 'asc' } },
      },
    });
  }
}
