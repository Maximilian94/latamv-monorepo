import { Module } from '@nestjs/common';
import { AirportRepository } from './repositories/airport.repository';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { AirportController } from './controllers/airport.controller';
import { AirportService } from './services/airport.service';

@Module({
  controllers: [AirportController],
  exports: [AirportService],
  imports: [PrismaModule],
  providers: [AirportRepository, AirportService],
})
export class AirportModule {}
