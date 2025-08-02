import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateArgs['data']) {
    // Primeiro, vamos encontrar a role "Pilot"
    const pilotRole = await this.prisma.role.findFirst({
      where: { name: 'Pilot' },
    });

    if (!pilotRole) {
      throw new Error('Pilot role not found');
    }

    return this.prisma.user.create({
      data: {
        ...data,
        roles: {
          connect: { id: pilotRole.id },
        },
      },
      select: {
        email: true,
        id: true,
        name: true,
        username: true,
        password: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updateAt: true,
      },
    });
  }

  findOne(params: { where: Prisma.UserWhereInput }) {
    return this.prisma.user.findFirst({
      where: params.where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        password: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        updateAt: true,
        createdAt: true,
      },
    });
  }

  findMany() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        createdAt: true,
        updateAt: true,
      },
    });
  }

  findByUsernameOrEmail(usernameOrEmail: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      select: { id: true },
    });
  }

  login(params: { where: Prisma.UserWhereInput }) {
    return this.prisma.user.findFirst({
      where: params.where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        password: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        updateAt: true,
        createdAt: true,
      },
    });
  }

  updateUserPlan(userId: number, plan: 'FREE' | 'GOLD') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        updateAt: true,
        createdAt: true,
      },
    });
  }

  updateUserBase(userId: number, baseId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { baseId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        plan: true,
        baseId: true,
        base: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        updateAt: true,
        createdAt: true,
      },
    });
  }
}
