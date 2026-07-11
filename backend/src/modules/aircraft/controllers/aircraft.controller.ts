import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AircraftService } from '../services/aircraft.service';
import { CreateAircraftDto, UpdateAircraftDto } from '../dto/aircraft.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('aircraft')
@UseGuards(AuthGuard)
export class AircraftController {
  constructor(private aircraftService: AircraftService) {}

  @Get()
  list() {
    return this.aircraftService.listAircrafts();
  }

  @Get('models')
  models() {
    return this.aircraftService.getModels();
  }

  @Post()
  create(@Body() data: CreateAircraftDto) {
    return this.aircraftService.createAircraft(data);
  }

  @Patch(':registration')
  update(
    @Param('registration') registration: string,
    @Body() data: UpdateAircraftDto,
  ) {
    return this.aircraftService.updateAircraft(registration, data);
  }
}
