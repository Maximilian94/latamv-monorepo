import { Body, Controller, Post } from '@nestjs/common';
import { AircraftService } from '../services/aircraft.service';
import { CreateAircraftDto } from '../dto/aircraft.dto';

@Controller('aircraft')
export class AuthController {
  constructor(private aircraftService: AircraftService) {}

  @Post('create')
  signIn(@Body() data: CreateAircraftDto) {
    return this.aircraftService.createAircraft(data);
  }
}
