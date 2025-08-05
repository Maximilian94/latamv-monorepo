import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  BaseWithAirportsResponseDto,
  SubsidiaryResponseDto,
  SubsidiaryWithBasesResponseDto,
} from '../dto/subsidiary.dto';

@Injectable()
export class SubsidiaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SubsidiaryResponseDto[]> {
    return this.prisma.subsidiary.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAllWithBases(): Promise<SubsidiaryWithBasesResponseDto[]> {
    return this.prisma.subsidiary.findMany({
      include: {
        bases: {
          include: {
            baseAirports: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number): Promise<SubsidiaryResponseDto | null> {
    return this.prisma.subsidiary.findUnique({
      where: { id },
    });
  }

  async findByIdWithBases(
    id: number,
  ): Promise<SubsidiaryWithBasesResponseDto | null> {
    return this.prisma.subsidiary.findUnique({
      where: { id },
      include: {
        bases: {
          include: {
            baseAirports: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async findByCode(code: string): Promise<SubsidiaryResponseDto | null> {
    return this.prisma.subsidiary.findUnique({
      where: { code },
    });
  }

  async findBasesBySubsidiaryId(
    subsidiaryId: number,
  ): Promise<BaseWithAirportsResponseDto[]> {
    return this.prisma.base.findMany({
      where: { subsidiaryId },
      include: {
        baseAirports: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
