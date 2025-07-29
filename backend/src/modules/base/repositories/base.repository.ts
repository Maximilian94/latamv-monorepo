import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class BaseRepository {
  constructor(private prisma: PrismaService) {}

  createBase(data: Prisma.BaseCreateArgs['data']) {
    return this.prisma.base.create({
      data,
      include: {
        baseAirports: true,
      },
    });
  }

  findOne(params: { where: Prisma.BaseWhereInput }) {
    return this.prisma.base.findFirst({
      where: params.where,
      include: {
        baseAirports: true,
      },
    });
  }

  findMany(params?: Prisma.BaseFindManyArgs) {
    return this.prisma.base.findMany({
      ...params,
      include: {
        baseAirports: true,
        ...(params?.include || {}),
      },
    });
  }

  updateBase(params: {
    where: Prisma.BaseWhereUniqueInput;
    data: Prisma.BaseUpdateInput;
  }) {
    return this.prisma.base.update({
      ...params,
      include: {
        baseAirports: true,
      },
    });
  }

  deleteBase(params: { where: Prisma.BaseWhereUniqueInput }) {
    return this.prisma.base.delete(params);
  }

  getBasesWithUsers() {
    return this.prisma.base.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        baseAirports: true,
      },
    });
  }

  addAirportToBase(baseId: number, airportCode: string) {
    return this.prisma.baseAirport.create({
      data: {
        baseId,
        airportCode,
      },
    });
  }

  removeAirportFromBase(baseId: number, airportCode: string) {
    return this.prisma.baseAirport.delete({
      where: {
        baseId_airportCode: {
          baseId,
          airportCode,
        },
      },
    });
  }

  getBaseByAirportCode(airportCode: string) {
    return this.prisma.base.findFirst({
      where: {
        baseAirports: {
          some: {
            airportCode,
          },
        },
      },
      include: {
        baseAirports: true,
      },
    });
  }
} 