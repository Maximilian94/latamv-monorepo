import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FlightDutyService } from '../services/flightDuty.service';
import { GetUser } from 'src/common/decorator/getUser.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { FlightPermissionGuard } from 'src/common/guards/flight-permission.guard';
import { CloseFlightDto, GenerateFlightDutyDto } from '../dto/flight-duty.dto';

@Controller('flight-duty')
export class FlightDutyController {
  constructor(private flightDutyService: FlightDutyService) {}
  @UseGuards(AuthGuard, FlightPermissionGuard)
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
  @Post('close-flight')
  async closeFlight(@Body() body: CloseFlightDto, @GetUser() user: any) {
    return await this.flightDutyService.closeFlightV2(user, body);
  }

  @UseGuards(AuthGuard)
  @Get('has-open')
  async hasOpenFlightDuty(@GetUser() user: any) {
    const hasOpenFlightDuty = await this.flightDutyService.hasOpenFlightDuty(
      user.id,
    );
    return { hasOpenFlightDuty };
  }
}
