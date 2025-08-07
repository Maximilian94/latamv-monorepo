import { Controller, Get, UseGuards } from '@nestjs/common';
import { RouteService } from '../services/route.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorator/getUser.decorator';

@Controller('routes')
export class FlightDutiesController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  findAll() {
    return this.routeService.getRoutes({});
  }

  @UseGuards(AuthGuard)
  @Get('by-subsidiary')
  async findRoutesBySubsidiary(@GetUser() user: any) {
    // Get user's subsidiary ICAO code
    const userSubsidiary = await this.routeService.getUserSubsidiary(user.id);

    if (!userSubsidiary?.icaoCode) {
      return this.routeService.getRoutes({ where: { available: true } });
    }

    return this.routeService.getRoutes({
      where: {
        available: true,
        ident_icao: {
          startsWith: userSubsidiary.icaoCode,
        },
      },
    });
  }

  @Get('airports')
  findAllAirports() {
    return this.routeService.getAllAirportsFromRoutes();
  }
}
