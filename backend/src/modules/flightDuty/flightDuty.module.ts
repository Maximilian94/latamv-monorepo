import { Module } from '@nestjs/common';
import { FlightDutyController } from './controllers/flightDuty.controller';
import { FlightDutyService } from './services/flightDuty.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightDutyRepository } from './repositories/flight-duty.repository';
import { FlightRepository } from '../flight/repository/flight.repository';
import { FlightModule } from '../flight/flight.module';
// import { FlightDutiesController } from './controllers/flightDuties.controller';
import { AircraftModule } from '../aircraft/aircraft.module';
import { PermissionModule } from '../permission/permission.module';
import { EventModule } from '../event/event.module';
import { BaseModule } from '../base/base.module';
import { AircraftRepository } from '../aircraft/repositories/aircraft.repository';
import { RouteService } from '../route/services/route.service';
import { RouteRepository } from '../route/repository/route.repository';

@Module({
  controllers: [FlightDutyController],
  providers: [
    FlightDutyService,
    FlightDutyRepository,
    FlightRepository,
    AircraftRepository,
    RouteService,
    RouteRepository,
  ],
  imports: [
    PrismaModule,
    FlightModule,
    AircraftModule,
    PermissionModule,
    EventModule,
    BaseModule,
  ],
  exports: [FlightDutyService],
})
export class FlightDutyModule {}
