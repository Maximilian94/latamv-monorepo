import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class AircraftRepository {
  constructor(private prisma: PrismaService) {}

  createAircraft(data: Prisma.AircraftCreateArgs['data']) {
    return this.prisma.aircraft.create({ data });
  }

  getAircrafts(args: Prisma.AircraftFindManyArgs) {
    return this.prisma.aircraft.findMany(args);
  }

  getAircraftByRegistration(registration: string) {
    return this.prisma.aircraft.findUnique({
      where: { registration },
      include: { aircraftModel: true },
    });
  }

  updateAircraft(registration: string, data: Prisma.AircraftUpdateInput) {
    return this.prisma.aircraft.update({
      where: { registration },
      data,
      include: { aircraftModel: true },
    });
  }

  getAircraftModels() {
    return this.prisma.aircraftModel.findMany({ orderBy: { code: 'asc' } });
  }
}
