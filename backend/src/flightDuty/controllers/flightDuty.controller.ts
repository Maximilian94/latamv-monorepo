import { Controller, Get, Query } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';

type GenerateFlightDuty = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @Get()
  async generateFlightDuty(@Query() query: GenerateFlightDuty) {
    return await this.flightDutyService.generateFlightDuty(query);
  }
}
