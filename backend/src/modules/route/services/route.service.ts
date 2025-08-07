import { Injectable } from '@nestjs/common';
import { RouteRepository } from '../repository/route.repository';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RouteService {
  constructor(
    private routeRepository: RouteRepository,
    private prisma: PrismaService,
  ) {}

  getRoutes(data: Prisma.RouteFindManyArgs) {
    return this.routeRepository.getRoutes(data);
  }

  updateRoutesAvailabilityToFalse(routeIds: number[]) {
    return this.routeRepository.updateRoutes({
      where: { id: { in: routeIds } },
      data: { available: false },
    });
  }

  async getAllAirportsFromRoutes() {
    return this.routeRepository.getAllAirportsFromRoutes();
  }

  async getUserSubsidiary(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subsidiary: {
          select: {
            id: true,
            name: true,
            code: true,
            icaoCode: true,
          },
        },
      },
    });

    return user?.subsidiary;
  }
}
