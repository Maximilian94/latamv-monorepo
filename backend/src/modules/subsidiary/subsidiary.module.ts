import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { SubsidiaryController } from './controllers/subsidiary.controller';
import { SubsidiaryRepository } from './repositories/subsidiary.repository';
import { SubsidiaryService } from './services/subsidiary.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubsidiaryController],
  providers: [SubsidiaryService, SubsidiaryRepository],
  exports: [SubsidiaryService],
})
export class SubsidiaryModule {}
