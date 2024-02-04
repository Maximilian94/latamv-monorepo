import { Controller, Get, Query } from '@nestjs/common';
import { CGNAService } from '../service/cgna.service';
import { FlightDutyService } from '../service/flightDuty.service';
import { CGNARoutes } from '../service/interfaces/cgna.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('routes')
export class RoutesController {
  constructor(
    private cgnaService: CGNAService,
    private flightDutyService: FlightDutyService,
    private prisma: PrismaService,
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
        aircraft_model_code: route.aircraft,
        arrival_icao: route.arrival,
        departure_icao: route.departure,
        eet: route.eet,
        eobt: route.departureTime,
        flight_level: route.flightLevel,
        flight_number: route.company,
        rmk: route.rmk,
        route: route.route,
        route_status_id: 'available',
        speed: route.speed,
        weekdays: route.day,
      };
    });

    try {
      const response = await this.prisma.route.createMany({
        data: routesToAdd,
      });
      return 'Dados adicionados com sucesso';
    } catch (error) {
      console.log('error.meta', error.meta);
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
}
