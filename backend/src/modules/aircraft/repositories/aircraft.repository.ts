import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class AircraftRepository {
  constructor(private prisma: PrismaService) {}

  createAircraft(data: Prisma.AircraftCreateArgs['data']) {
    return this.prisma.aircraft.create({ data });
  }
}
