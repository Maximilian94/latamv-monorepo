import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { FlightService } from 'src/modules/flight/services/flight.service';
import { RouteService } from 'src/modules/route/services/route.service';
import { Prisma } from '@prisma/client';

const TEST_USER_ID = 1000;

interface CreateFlightDutyProps {
  createdAt: Date;
  expirationDate: Date;
}

@Injectable()
export class FlightDutyRepository {
  constructor(
    private prisma: PrismaService,
    private routeService: RouteService,
    private flightService: FlightService,
  ) {}

  async createFlightDuty(data: CreateFlightDutyProps, routeIds: string[]) {
    const transaction = this.prisma.$transaction(async () => {
      const flightDuty = await this.prisma.flightDuty.create({
        data: { ...data, userId: TEST_USER_ID },
      });

      const updateRoutes =
        await this.routeService.updateRoutesAvailabilityToFalse(routeIds);

      const flightsToCreate: Prisma.FlightCreateManyInput[] = routeIds.map(
        (routeId) => ({
          flightDutyId: flightDuty.id,
          routeId,
          userId: TEST_USER_ID,
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
