import { Module } from '@nestjs/common';
import { AwardsController } from './controllers/awards.controller';
import { AwardsService } from './services/awards.service';
import { AwardsRepository } from './repositories/awards.repository';
import { UserAwardsRepository } from './repositories/user-awards.repository';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [AwardsController],
  providers: [AwardsService, AwardsRepository, UserAwardsRepository],
  exports: [AwardsService],
})
export class AwardsModule {}
