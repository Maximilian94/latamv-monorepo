import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class RoleRepository {
  constructor(private prisma: PrismaService) {}

  async getRolesByUserId(id: number) {
    return this.prisma.role.findMany({
      where: { users: { some: { id } } },
    });
  }

  async assignRoleToUser(userId: number, roleId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
      include: {
        roles: true,
      },
    });
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
      include: {
        roles: true,
      },
    });
  }
}
