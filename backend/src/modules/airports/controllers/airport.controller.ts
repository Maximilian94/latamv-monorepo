import { Controller, Get, Param } from '@nestjs/common';
import { AirportService } from '../services/airport.service';

@Controller('airport')
export class AirportController {
  constructor(private aircraftService: AirportService) {}

  @Get(':icao')
  getAirport(@Param('icao') icao: string) {
    return this.aircraftService.getAirportData(icao);
  }
}
