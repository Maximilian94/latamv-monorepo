import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';
import { GetUser } from 'src/common/decorator/getUser.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';

type GenerateFlightDuty = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @UseGuards(AuthGuard)
  @Get()
  async generateFlightDuty(
    @Query() query: GenerateFlightDuty,
    @GetUser() user: any,
  ) {
    return await this.flightDutyService.generateFlightDuty(user, query);
  }
}
