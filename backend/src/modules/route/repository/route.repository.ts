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
}
