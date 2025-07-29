import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseRepository } from '../repositories/base.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class BaseService {
  constructor(private baseRepository: BaseRepository) {}

  async createBase(data: Prisma.BaseCreateInput) {
    const existingBase = await this.baseRepository.findOne({
      where: { name: data.name },
    });

    if (existingBase) {
      throw new ConflictException('Base with this name already exists');
    }

    return this.baseRepository.createBase(data);
  }

  async getAllBases() {
    return this.baseRepository.findMany();
  }

  async getBaseById(id: number) {
    const base = await this.baseRepository.findOne({ where: { id } });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    return base;
  }

  async getBasesWithUsers() {
    return this.baseRepository.getBasesWithUsers();
  }

  async updateBase(id: number, data: Prisma.BaseUpdateInput) {
    const existingBase = await this.baseRepository.findOne({ where: { id } });

    if (!existingBase) {
      throw new NotFoundException('Base not found');
    }

    if (data.name && data.name !== existingBase.name) {
      const baseWithSameName = await this.baseRepository.findOne({
        where: { name: data.name as string },
      });

      if (baseWithSameName) {
        throw new ConflictException('Base with this name already exists');
      }
    }

    return this.baseRepository.updateBase({
      where: { id },
      data,
    });
  }

  async deleteBase(id: number) {
    const existingBase = await this.baseRepository.findOne({ where: { id } });

    if (!existingBase) {
      throw new NotFoundException('Base not found');
    }

    return this.baseRepository.deleteBase({ where: { id } });
  }

  async addAirportToBase(baseId: number, airportCode: string) {
    const base = await this.baseRepository.findOne({ where: { id: baseId } });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    return this.baseRepository.addAirportToBase(baseId, airportCode);
  }

  async removeAirportFromBase(baseId: number, airportCode: string) {
    const base = await this.baseRepository.findOne({ where: { id: baseId } });

    if (!base) {
      throw new NotFoundException('Base not found');
    }

    return this.baseRepository.removeAirportFromBase(baseId, airportCode);
  }

  async getBaseByAirportCode(airportCode: string) {
    return this.baseRepository.getBaseByAirportCode(airportCode);
  }

  async getRandomAirportFromBase(baseId: number): Promise<string | null> {
    const base = await this.baseRepository.findOne({ where: { id: baseId } });

    if (!base || !base.baseAirports.length) {
      return null;
    }

    // Return a random airport from the base
    const randomIndex = Math.floor(Math.random() * base.baseAirports.length);
    return base.baseAirports[randomIndex].airportCode;
  }
} 