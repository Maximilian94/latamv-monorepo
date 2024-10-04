import { Module } from '@nestjs/common';
import { AircraftRepository } from './repositories/aircraft.repository';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { AircraftService } from './services/aircraft.service';
import { AuthController } from './controllers/aircraft.controller';

@Module({
  controllers: [AuthController],
  exports: [AircraftService],
  imports: [PrismaModule],
  providers: [AircraftRepository, AircraftService],
})
export class AircraftModule {}
