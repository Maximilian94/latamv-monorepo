import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  createUser(data: Prisma.UserCreateArgs['data']) {
    return this.prisma.user.create({
      data,
      select: { email: true, password: true },
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
      },
    });
  }

  findMany() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, username: true },
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
}
