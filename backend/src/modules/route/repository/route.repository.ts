import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RouteRepository {
  constructor(private prisma: PrismaService) {}

  async getRoutes(data: Prisma.RouteFindManyArgs) {
    return this.prisma.route.findMany(data);
  }

  async updateRoutes(data: Prisma.RouteUpdateManyArgs) {
    return this.prisma.route.updateMany(data);
  }

  async getAllAirportsFromRoutes() {
    const airports = await this.prisma.route.findMany({
      distinct: ['departure_icao'],
      select: {
        departure_icao: true,
      },
    });
    return airports.map((r) => r.departure_icao);
  }
}
