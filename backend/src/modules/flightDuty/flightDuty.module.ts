import { Module } from '@nestjs/common';
import { FlightDutyController } from './controllers/flightDuty.controller';
import { FlightDutyService } from './services/flightDuty.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightDutyRepository } from './repositories/flight-duty.repository';

@Module({
  controllers: [FlightDutyController],
  providers: [FlightDutyService, FlightDutyRepository],
  imports: [PrismaModule],
})
export class FlightDutyModule {}
