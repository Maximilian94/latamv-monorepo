import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class FlightRepository {
  constructor(private prisma: PrismaService) {}

  async getFlightsHoursByUserId({ userId }: { userId: number }) {
    return this.prisma.flight.findMany({
      where: { userId },
      select: { IN: true, OUT: true },
    });
  }

  async createFlights(data: Prisma.FlightCreateManyArgs['data']) {
    return this.prisma.flight.createMany({ data });
  }

  async closeFlightById(flightId: number) {
    return this.prisma.flight.update({
      where: { id: flightId },
      data: { isClosed: true },
    });
  }

  async updateFlightById({
    flightId,
    data,
  }: {
    flightId: number;
    data: Prisma.FlightUpdateArgs['data'];
  }) {
    return this.prisma.flight.update({ where: { id: flightId }, data });
  }

  async getFlightsByUser({ userId }: { userId: number }) {
    return this.prisma.flight.findMany({
      where: { userId, isClosed: true },
      orderBy: {
        endAcarsTime: 'desc',
      },
    });
  }

  async getFlightById({
    flightId,
    userId,
  }: {
    flightId: number;
    userId: number;
  }) {
    return this.prisma.flight.findFirst({
      where: { id: flightId, userId },
      include: {
        flightEvents: {
          include: {
            event: {
              include: {
                severity: true,
                eventDescription: true,
              },
            },
          },
        },
      },
    });
  }

  async reviewFlight({
    flightId,
    amountOfProactiveExcellence,
    amountOfStandardCompliance,
    amountOfProceduralDeviation,
    amountOfSafetyCompromise,
  }: {
    flightId: number;
    amountOfProactiveExcellence: number;
    amountOfStandardCompliance: number;
    amountOfProceduralDeviation: number;
    amountOfSafetyCompromise: number;
  }) {
    return this.prisma.flight.update({
      where: { id: flightId },
      data: {
        isReviewed: true,
        amountOfProactiveExcellence,
        amountOfStandardCompliance,
        amountOfProceduralDeviation,
        amountOfSafetyCompromise,
      },
    });
  }
}
