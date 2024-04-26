import { Controller, Get, Post, Query } from '@nestjs/common';
import { CGNAService } from '../service/cgna.service';
import { FlightDutyService } from '../service/flightDuty.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RoutesService } from '../service/routes.service';

@Controller('routes')
export class RoutesController {
  constructor(
    private cgnaService: CGNAService,
    private flightDutyService: FlightDutyService,
    private prisma: PrismaService,
    private routesService: RoutesService,
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

    const routesToAdd: Prisma.RouteCreateManyInput[] = routes.map((route) => {
      return {
        aircraft_model_code: route.aircraft_model_code,
        arrival_icao: route.arrival_icao,
        departure_icao: route.departure_icao,
        eet: route.eet,
        eobt: route.eobt,
        flight_level: route.flight_level,
        flight_number: route.flight_number,
        rmk: route.rmk,
        route: route.route,
        route_status_id: 'available',
        speed: route.speed,
        weekday: route.weekday,
      };
    });

    try {
      await this.prisma.route.createMany({ data: routesToAdd });
      return 'Dados adicionados com sucesso';
    } catch (error) {
      return { msg: 'Erro na inserção dos dados', error };
    }

    // try {
    //   if (routesToAdd) {
    //   } else {
    //     return 'Não existem rotas para serem adicionadas';
    //   }
    // } catch (error) {
    //   return { msg: 'Erro na inserção dos dados', error };
    // }
  }

  @Post('update')
  async updateRoutesDataBase() {
    return this.routesService.updateRoutesDataBase();
  }
}
