import { Module } from '@nestjs/common';
import { AwardsController } from './controllers/awards.controller';
import { AwardsService } from './services/awards.service';
import { AwardsRepository } from './repositories/awards.repository';
import { UserAwardsRepository } from './repositories/user-awards.repository';

@Module({
  controllers: [AwardsController],
  providers: [AwardsService, AwardsRepository, UserAwardsRepository],
  exports: [AwardsService],
})
export class AwardsModule {}
