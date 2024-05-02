import { Module } from '@nestjs/common';
import { FlightDutyController } from './controllers/flightDuty.controller';
import { FlightDutyService } from './services/flightDuty.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightDutyRepository } from './repositories/flight-duty.repository';
import { RouteModule } from '../route/route.module';
import { FlightRepository } from '../flight/repository/flight.repository';
import { FlightModule } from '../flight/flight.module';

@Module({
  controllers: [FlightDutyController],
  providers: [FlightDutyService, FlightDutyRepository, FlightRepository],
  imports: [PrismaModule, RouteModule, FlightModule],
})
export class FlightDutyModule {}
