import { Controller, Get, Query } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @Get()
  async generateFlightDuty(@Query() query) {
    return await this.flightDutyService.generateFlightDuty(query);
  }
}
