import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Award, CreateAwardDto, UpdateAwardDto } from '../interfaces/award.interface';

@Injectable()
export class AwardsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Award[]> {
    return this.prisma.award.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Award | null> {
    return this.prisma.award.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Award | null> {
    return this.prisma.award.findUnique({
      where: { name },
    });
  }

  async create(data: CreateAwardDto): Promise<Award> {
    return this.prisma.award.create({
      data,
    });
  }

  async update(id: number, data: UpdateAwardDto): Promise<Award> {
    return this.prisma.award.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Award> {
    return this.prisma.award.delete({
      where: { id },
    });
  }
}
