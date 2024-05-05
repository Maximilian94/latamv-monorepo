import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { UserResponseDto } from '../dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  createUser(data: Prisma.UserCreateArgs['data']): Promise<UserResponseDto> {
    return this.prisma.user.create({
      data,
      select: { id: true, name: true, email: true, username: true },
    });
  }

  findOne(emailOrUsername: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
  }
}
