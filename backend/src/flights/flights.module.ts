import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RoutesController } from './controllers/routes.controller';
import { CGNAService } from './service/cgna.service';
import { FlightDutyService } from './service/flightDuty.service';

@Module({
  imports: [HttpModule],
  controllers: [RoutesController],
  providers: [CGNAService, FlightDutyService],
})
export class FlightsModule {}
