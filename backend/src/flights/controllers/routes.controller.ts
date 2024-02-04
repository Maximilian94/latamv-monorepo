import { Controller, Get, Query } from '@nestjs/common';
import { CGNAService } from '../service/cgna.service';
import { FlightDutyService } from '../service/flightDuty.service';
import { CGNARoutes } from '../service/interfaces/cgna.interface';

@Controller('routes')
export class RoutesController {
  constructor(
    private cgnaService: CGNAService,
    private flightDutyService: FlightDutyService,
  ) {}

  @Get('cgna')
  async getAll() {
    return this.cgnaService.getCGNARoutes();
  }

  @Get('allAirports')
  async getAllAirports() {
    return this.cgnaService.getAirportsDataRoute();
  }

  @Get('generateFlightDuty')
  async generateFlightDuty(@Query() query) {
    return this.flightDutyService.flightDutyGenerator({
      hub: query.hub,
      numberOfFlights: query.numberOfFlights,
    });
    // .then((res) => {
    //   return (res as CGNARoutes).map((r) => {
    //     return `${r.departure} -- ${r.arrival}`;
    //     return { departure: r.departure, arrival: r.arrival };
    //   });
    // });
  }

  @Get('addFlightOnDataBase')
  async addFlightOnDataBase() {
    const routes = await this.cgnaService.getCGNARoutes();
  }
}
