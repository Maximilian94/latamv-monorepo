import { Controller, Get, Post, Query } from '@nestjs/common';
import { FlightDutyService } from '../service/flightDuty.service';
import { FlightAwareService } from '../service/flightaware.service';
import { FlightAwareRoutesService } from '../service/flightaware-routes.service';
import { RoutesService } from '../service/routes.service';

@Controller('routes')
export class RoutesController {
  constructor(
    private flightDutyService: FlightDutyService,
    private flightAwareService: FlightAwareService,
    private flightAwareRoutesService: FlightAwareRoutesService,
    private routesService: RoutesService,
  ) {}

  @Get('generateFlightDuty')
  async generateFlightDuty(@Query() query) {
    return this.flightDutyService.flightDutyGenerator({
      hub: query.hub,
      numberOfFlights: query.numberOfFlights,
    });
  }

  @Post('update')
  async updateRoutesDataBase() {
    return this.routesService.updateRoutesDataBase();
  }

  // FlightAware endpoints
  @Get('flightaware/test')
  async testFlightAware() {
    return this.flightAwareService.testConnection();
  }

  @Get('flightaware/flights')
  async getFlightAwareFlights(@Query() query) {
    const { start, end } = query;
    return this.flightAwareService.getLATAMFlights(start, end);
  }

  @Post('flightaware/update')
  async updateFlightAwareRoutes() {
    return this.flightAwareRoutesService.updateRoutesDatabase();
  }

  @Get('flightaware/all')
  async getAllFlightAwareRoutes() {
    return this.flightAwareRoutesService.getAllRoutes();
  }

  @Get('flightaware/:flightNumber')
  async getFlightAwareRoute(@Query('flightNumber') flightNumber: string) {
    return this.flightAwareRoutesService.getRouteByFlightNumber(flightNumber);
  }

  @Post('flightaware/clear-cache')
  async clearFlightAwareCache() {
    this.flightAwareService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}
