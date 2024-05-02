import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class FlightRepository {
  constructor(private prisma: PrismaService) {}

  async getFlights() {
    return this.prisma.flight.findMany({});
  }

  async createFlights(data: Prisma.FlightCreateManyArgs['data']) {
    return this.prisma.flight.createMany({ data });
  }
}
