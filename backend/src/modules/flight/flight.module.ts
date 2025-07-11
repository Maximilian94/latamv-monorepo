import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightRepository } from './repository/flight.repository';
import { FlightService } from './services/flight.service';
import { RouteModule } from '../route/route.module';
import { FlightController } from './controllers/flight.controller';
import { PermissionModule } from '../permission/permission.module';
import { EventModule } from '../event/event.module';

@Module({
  controllers: [FlightController],
  providers: [FlightRepository, FlightService],
  imports: [PrismaModule, RouteModule, PermissionModule, EventModule],
  exports: [FlightRepository, FlightService],
})
export class FlightModule {}
