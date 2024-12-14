import { Controller, Get } from '@nestjs/common';
import { MetarService } from '../services/metar.service';

@Controller('routes')
export class FlightDutiesController {
  constructor(private readonly routeService: MetarService) {}

  @Get()
  findAll() {
    return this.routeService.getRoutes({});
  }

  @Get('airports')
  findAllAirports() {
    return this.routeService.getAllAirportsFromRoutes();
  }
}
