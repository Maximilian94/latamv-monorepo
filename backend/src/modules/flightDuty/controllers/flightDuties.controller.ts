import { Controller, Get, Query } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';
import { FlightDuty } from '@prisma/client';
import { ParseBoolPipe } from '../../../common/pipes/parse-bool.pipe';

@Controller('flight-duties')
export class FlightDutiesController {
  constructor(private readonly flightDutyService: FlightDutyService) {}

  @Get()
  findAll(
    @Query('includeFlights', ParseBoolPipe) includeFlights: boolean,
  ): Promise<FlightDuty[]> {
    return this.flightDutyService.getFlightDuties({
      include: { flights: { include: { route: includeFlights } } },
    });
  }
}
