import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { FlightRepository } from './repository/flight.repository';
import { FlightService } from './services/flight.service';
import { RouteModule } from '../route/route.module';

@Module({
  controllers: [],
  providers: [FlightRepository, FlightService],
  imports: [PrismaModule, RouteModule],
  exports: [FlightRepository, FlightService],
})
export class FlightModule {}
