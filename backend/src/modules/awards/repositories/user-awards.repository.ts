import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UserAward, AwardWithUserAward } from '../interfaces/user-award.interface';

@Injectable()
export class UserAwardsRepository {
  constructor(private prisma: PrismaService) {}

  async findUserAwards(userId: number): Promise<UserAward[]> {
    return this.prisma.userAward.findMany({
      where: { userId },
      include: { award: true },
      orderBy: { obtainedAt: 'desc' },
    });
  }

  async findUserAward(userId: number, awardId: number): Promise<UserAward | null> {
    return this.prisma.userAward.findUnique({
      where: {
        userId_awardId: {
          userId,
          awardId,
        },
      },
      include: { award: true },
    });
  }

  async createUserAward(userId: number, awardId: number): Promise<UserAward> {
    const award = await this.prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!award) {
      throw new Error('Award not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + award.validityDuration);

    return this.prisma.userAward.create({
      data: {
        userId,
        awardId,
        expiresAt,
      },
      include: { award: true },
    });
  }

  async updateUserAward(userId: number, awardId: number): Promise<UserAward> {
    const award = await this.prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!award) {
      throw new Error('Award not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + award.validityDuration);

    return this.prisma.userAward.update({
      where: {
        userId_awardId: {
          userId,
          awardId,
        },
      },
      data: {
        expiresAt,
        updatedAt: new Date(),
      },
      include: { award: true },
    });
  }

  async deleteUserAward(userId: number, awardId: number): Promise<UserAward> {
    return this.prisma.userAward.delete({
      where: {
        userId_awardId: {
          userId,
          awardId,
        },
      },
      include: { award: true },
    });
  }

  async getAllAwardsWithUserStatus(userId: number): Promise<AwardWithUserAward[]> {
    const awards = await this.prisma.award.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const userAwards = await this.prisma.userAward.findMany({
      where: { userId },
      include: { award: true },
    });

    const userAwardsMap = new Map(
      userAwards.map(ua => [ua.awardId, ua])
    );

    return awards.map(award => {
      const userAward = userAwardsMap.get(award.id);
      const now = new Date();
      
      return {
        ...award,
        userAward,
        isExpired: userAward ? userAward.expiresAt < now : false,
        daysUntilExpiration: userAward 
          ? Math.ceil((userAward.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });
  }
}
