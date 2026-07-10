import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { FlightService } from '../services/flight.service';
import { GetUser } from '../../../common/decorator/getUser.decorator';
import { RegisterFlightEventsDto } from '../dto/register-flight-events.dto';

@Controller('flight')
export class FlightController {
  constructor(private flightService: FlightService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getFlights(@GetUser() user: any) {
    return this.flightService.getAllUserFlights({ userId: user.id });
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getFlightById(@Param('id') id: string, @GetUser() user: any) {
    return this.flightService.getFlightById({ flightId: +id, userId: user.id });
  }

  @UseGuards(AuthGuard)
  @Patch('review/:id')
  async reviewFlight(@Param('id') id: string) {
    return this.flightService.reviewFlightById({ flightId: +id });
  }

  @UseGuards(AuthGuard)
  @Post(':id/events')
  async registerFlightEvents(
    @Param('id') id: string,
    @Body() dto: RegisterFlightEventsDto,
  ) {
    return this.flightService.registerFlightEvents({
      flightId: +id,
      events: dto.events,
    });
  }
}
