import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

interface CreateFlightDutyProps {
  createdAt: Date;
  expirationDate: Date;
}

@Injectable()
export class FlightDutyRepository {
  constructor(private prisma: PrismaService) {}

  async createFlightDuty(data: CreateFlightDutyProps) {
    return this.prisma.flightDuty.create({ data });
  }
}
