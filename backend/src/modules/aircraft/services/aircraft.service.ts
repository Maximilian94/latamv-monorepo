import { Injectable } from '@nestjs/common';
import { AircraftRepository } from '../repositories/aircraft.repository';
import { Prisma } from '@prisma/client';
import { sample } from 'lodash';
import { CreateAircraftDto } from '../dto/aircraft.dto';

@Injectable()
export class AircraftService {
  constructor(private aircraftRepository: AircraftRepository) {}

  createAircraft(data: CreateAircraftDto) {
    return this.aircraftRepository.createAircraft({
      registration: data.registration,
      type: data.type,
      engine: data.engine ?? '',
      active: data.active ?? true,
      available: data.available ?? true,
      aircraftModel: { connect: { code: data.aircraftModelCode } },
    });
  }

  async getRandomAircraft(args: Prisma.AircraftFindManyArgs) {
    const aircrafts = await this.aircraftRepository.getAircrafts(args);
    return sample(aircrafts);
  }

  listAircrafts() {
    return this.aircraftRepository.getAircrafts({
      include: { aircraftModel: true },
      orderBy: [{ aircraftModelCode: 'asc' }, { registration: 'asc' }],
    });
  }

  getModels() {
    return this.aircraftRepository.getAircraftModels();
  }

  updateAircraft(registration: string, data: Prisma.AircraftUpdateInput) {
    return this.aircraftRepository.updateAircraft(registration, data);
  }
}
