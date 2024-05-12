import { Injectable } from '@nestjs/common';
import { AircraftRepository } from '../repositories/aircraft.repository';
import { Prisma } from '@prisma/client';
import { sample } from 'lodash';

@Injectable()
export class AircraftService {
  constructor(private aircraftRepository: AircraftRepository) {}

  createAircraft(data: Prisma.AircraftCreateArgs['data']) {
    return this.aircraftRepository.createAircraft(data);
  }

  async getRandomAircraft(args: Prisma.AircraftFindManyArgs) {
    const aircrafts = await this.aircraftRepository.getAircrafts(args);
    return sample(aircrafts);
  }
}
