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
    const transaction = this.prisma.$transaction(async () => {
      const flightDuty = await this.prisma.flightDuty.create({
        data,
      });

      const updateRoutes =
        await this.routeService.updateRoutesAvailabilityToFalse(routeIds);

      const flightsToCreate: Prisma.FlightCreateManyInput[] = routeIds.map(
        (routeId) => ({
          flightDutyId: flightDuty.id,
          routeId,
          userId,
          aircraftRegistration: flightDuty.aircraftRegistration,
        }),
      );

      const createFlights =
        await this.flightService.createFlights(flightsToCreate);

      return { flightDuty, updateRoutes, createFlights };
    });

    return transaction;
  }

  async getFlightDuties(data: Prisma.FlightDutyFindManyArgs) {
    return this.prisma.flightDuty.findMany(data);
  }
}
