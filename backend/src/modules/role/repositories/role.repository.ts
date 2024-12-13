import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class RoleRepository {
  constructor(private prisma: PrismaService) {}

  async getRolesByUserId(id: number) {
    return this.prisma.role.findMany({
      where: { UserRole: { some: { userId: id } } },
    });
  }
}
