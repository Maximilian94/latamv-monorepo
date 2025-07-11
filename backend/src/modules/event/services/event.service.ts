import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { FlightEvent, Prisma } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  getEventSeverities() {
    return this.prisma.severity.findMany();
  }

  createEvent(data: Prisma.EventUncheckedCreateInput) {
    return this.prisma.event.create({ data });
  }

  getEvents() {
    return this.prisma.event.findMany({ include: { eventDescription: true } });
  }

  registerManyFlightEvents(data: FlightEvent[]) {
    return this.prisma.flightEvent.createMany({ data });
  }

  getFlightEventByFlightId({ flightId }: { flightId: number }) {
    return this.prisma.flightEvent.findMany({
      where: { flightId },
      include: { event: { include: { severity: true } } },
    });
  }
}
