import { Controller, Get, Post, Query } from '@nestjs/common';
import { CGNAService } from '../service/cgna.service';
import { FlightDutyService } from '../service/flightDuty.service';
import { Prisma } from '@prisma/client';
import { RoutesService } from '../service/routes.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FlightAwareService } from '../service/flightaware.service';

@Controller('routes')
export class RoutesController {
  constructor(
    private cgnaService: CGNAService,
    private flightDutyService: FlightDutyService,
    private prisma: PrismaService,
    private routesService: RoutesService,
    private flightAwareService: FlightAwareService,
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

    const routesToAdd: Prisma.RouteCreateManyInput[] = routes.map(
      (route, index) => {
        return {
          id: index + 1, // Generate a simple ID for legacy data
          aircraft_model_code: route.aircraft_model_code,
          arrival_icao: route.arrival_icao,
          departure_icao: route.departure_icao,
          eet: route.eet,
        };
      },
    );

    try {
      await this.prisma.route.createMany({ data: routesToAdd });
      return 'Dados adicionados com sucesso';
    } catch (error) {
      return { msg: 'Erro na inserção dos dados', error };
    }
  }

  @Post('update')
  async updateRoutesDataBase() {
    return this.routesService.updateRoutesDataBase();
  }

  @Post('generateFromFlightAware')
  async generateFromFlightAware() {
    try {
      const result =
        await this.flightAwareService.generateRoutesFromFlightAware();
      return {
        message: 'Routes generated successfully from FlightAware',
        ...result,
      };
    } catch (error) {
      return {
        message: 'Error generating routes from FlightAware',
        error: error.message,
      };
    }
  }
}
