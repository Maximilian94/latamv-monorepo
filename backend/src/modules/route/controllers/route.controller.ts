import { Controller, Get } from '@nestjs/common';
import { RouteService } from '../services/route.service';

@Controller('routes')
export class FlightDutiesController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  findAll() {
    return this.routeService.getRoutes({});
  }

  @Get('airports')
  findAllAirports() {
    return this.routeService.getAllAirportsFromRoutes();
  }
}
