import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class PermissionRepository {
  constructor(private prisma: PrismaService) {}

  async getPermissionsByRolesId(roleId: Array<number>) {
    return this.prisma.permission.findMany({
      where: {
        RolePermission: {
          some: {
            roleId: { in: roleId },
          },
        },
      },
    });
  }
}
