import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';
import { GetUser } from 'src/common/decorator/getUser.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CloseFlightDto, GenerateFlightDutyDto } from '../dto/flight-duty.dto';

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @UseGuards(AuthGuard)
  @Post()
  async generateFlightDuty(
    @Query() query: GenerateFlightDutyDto,
    @GetUser() user: any,
  ) {
    return await this.flightDutyService.generateFlightDuty(user, query);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getFlightDuty(@GetUser() user: any) {
    return await this.flightDutyService.getFlightDutyByUserId(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('flight')
  async closeFlight(@Query() query: CloseFlightDto, @GetUser() user: any) {
    return await this.flightDutyService.closeFlight(
      user,
      +query.flightId,
      +query.flightDutyId,
    );
  }
}
