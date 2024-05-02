import { Injectable } from '@nestjs/common';
import { RouteRepository } from '../repository/route.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class RouteService {
  constructor(private routeRepository: RouteRepository) {}

  getRoutes(data: Prisma.RouteFindManyArgs) {
    return this.routeRepository.getRoutes(data);
  }

  updateRoutesAvailabilityToFalse(routeIds: string[]) {
    return this.routeRepository.updateRoutes({
      where: { id: { in: routeIds } },
      data: { available: false },
    });
  }
}
