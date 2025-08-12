import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AwardsRepository } from '../repositories/awards.repository';
import { UserAwardsRepository } from '../repositories/user-awards.repository';
import { Award, CreateAwardDto, UpdateAwardDto } from '../interfaces/award.interface';
import { UserAward, AwardWithUserAward } from '../interfaces/user-award.interface';

@Injectable()
export class AwardsService {
  constructor(
    private awardsRepository: AwardsRepository,
    private userAwardsRepository: UserAwardsRepository,
  ) {}

  async findAll(): Promise<Award[]> {
    return this.awardsRepository.findAll();
  }

  async findById(id: number): Promise<Award> {
    const award = await this.awardsRepository.findById(id);
    if (!award) {
      throw new NotFoundException('Award not found');
    }
    return award;
  }

  async create(data: CreateAwardDto): Promise<Award> {
    const existingAward = await this.awardsRepository.findByName(data.name);
    if (existingAward) {
      throw new ConflictException('Award with this name already exists');
    }
    return this.awardsRepository.create(data);
  }

  async update(id: number, data: UpdateAwardDto): Promise<Award> {
    const award = await this.awardsRepository.findById(id);
    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (data.name && data.name !== award.name) {
      const existingAward = await this.awardsRepository.findByName(data.name);
      if (existingAward) {
        throw new ConflictException('Award with this name already exists');
      }
    }

    return this.awardsRepository.update(id, data);
  }

  async delete(id: number): Promise<Award> {
    const award = await this.awardsRepository.findById(id);
    if (!award) {
      throw new NotFoundException('Award not found');
    }
    return this.awardsRepository.delete(id);
  }

  async getUserAwards(userId: number): Promise<UserAward[]> {
    return this.userAwardsRepository.findUserAwards(userId);
  }

  async getUserAward(userId: number, awardId: number): Promise<UserAward> {
    const userAward = await this.userAwardsRepository.findUserAward(userId, awardId);
    if (!userAward) {
      throw new NotFoundException('User award not found');
    }
    return userAward;
  }

  async obtainAward(userId: number, awardId: number): Promise<UserAward> {
    // Check if award exists
    await this.findById(awardId);

    // Check if user already has this award
    const existingUserAward = await this.userAwardsRepository.findUserAward(userId, awardId);
    
    if (existingUserAward) {
      // If user already has the award, update the expiration date
      return this.userAwardsRepository.updateUserAward(userId, awardId);
    } else {
      // If user doesn't have the award, create a new user award
      return this.userAwardsRepository.createUserAward(userId, awardId);
    }
  }

  async removeUserAward(userId: number, awardId: number): Promise<UserAward> {
    const userAward = await this.userAwardsRepository.findUserAward(userId, awardId);
    if (!userAward) {
      throw new NotFoundException('User award not found');
    }
    return this.userAwardsRepository.deleteUserAward(userId, awardId);
  }

  async getAllAwardsWithUserStatus(userId: number): Promise<AwardWithUserAward[]> {
    return this.userAwardsRepository.getAllAwardsWithUserStatus(userId);
  }
}
