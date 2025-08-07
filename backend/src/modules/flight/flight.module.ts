import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightRepository } from './repository/flight.repository';
import { FlightService } from './services/flight.service';
import { FlightController } from './controllers/flight.controller';
import { PermissionModule } from '../permission/permission.module';
import { EventModule } from '../event/event.module';
import { AircraftRepository } from '../aircraft/repositories/aircraft.repository';
import { RouteRepository } from '../route/repository/route.repository';

@Module({
  controllers: [FlightController],
  providers: [
    FlightRepository,
    FlightService,
    AircraftRepository,
    RouteRepository,
  ],
  imports: [PrismaModule, PermissionModule, EventModule],
  exports: [FlightRepository, FlightService],
})
export class FlightModule {}
