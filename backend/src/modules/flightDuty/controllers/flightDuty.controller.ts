import { Controller, Get, Query } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';
import { GetUser } from 'src/common/decorator/getUser.decorator';

type GenerateFlightDuty = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @Get()
  async generateFlightDuty(
    @Query() query: GenerateFlightDuty,
    @GetUser() user: any,
  ) {
    return await this.flightDutyService.generateFlightDuty(user, query);
  }
}
