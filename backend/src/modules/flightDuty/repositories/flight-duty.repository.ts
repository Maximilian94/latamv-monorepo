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

      const flightsToCreate: Prisma.FlightCreateManyInput[] = routeIds.map(
        (routeId, index) => ({
          flightDutyId: flightDuty.id,
          routeId,
          userId,
          aircraftRegistration: flightDuty.aircraftRegistration,
          index,
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
        flights: { include: { route: true }, orderBy: { index: 'asc' } },
      },
    });
  }

  async getFlightDutyById(id: number) {
    return this.prisma.flightDuty.findUnique({
      where: { id },
      include: {
        flights: { include: { route: true }, orderBy: { index: 'asc' } },
      },
    });
  }

  async closeFlightDuty(id: number) {
    return this.prisma.flightDuty.update({
      where: { id },
      data: { isClosed: true },
      include: {
        flights: { include: { route: true }, orderBy: { index: 'asc' } },
      },
    });
  }

  async pushFlightData(flightData: Prisma.FlightDataUncheckedCreateInput) {
    return this.prisma.flightData.create({ data: flightData });
  }
}
