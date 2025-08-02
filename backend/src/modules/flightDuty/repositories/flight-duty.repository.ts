import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { FlightService } from 'src/modules/flight/services/flight.service';
import { RouteService } from 'src/modules/route/services/route.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlightDutyRepository {
  constructor(
    private prisma: PrismaService,
    private routeService: RouteService,
    private flightService: FlightService,
  ) {}

  async createFlightDuty(
    data: Prisma.FlightDutyCreateArgs['data'],
    routeIds: string[],
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

      const flightsToCreate: Prisma.FlightCreateManyInput[] = routes.map(
        (route, index) => ({
          flightDutyId: flightDuty.id,
          userId,
          aircraftRegistration: flightDuty.aircraftRegistration,
          index,
          flightNumber: route.flight_number,
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
