import { Injectable } from '@nestjs/common';
import { RouteRepository } from '../repository/route.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class RouteService {
  constructor(private routeRepository: RouteRepository) {}

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
}
