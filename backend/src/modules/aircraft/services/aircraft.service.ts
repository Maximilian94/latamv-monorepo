import { Injectable } from '@nestjs/common';
import { AircraftRepository } from '../repositories/aircraft.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class AircraftService {
  constructor(private aircraftRepository: AircraftRepository) {}

  createAircraft(data: Prisma.AircraftCreateArgs['data']) {
    return this.aircraftRepository.createAircraft(data);
  }
}
