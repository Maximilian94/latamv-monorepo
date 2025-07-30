import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoutesController } from './controllers/routes.controller';
import { FlightDutyService } from './service/flightDuty.service';
import { FlightAwareService } from './service/flightaware.service';
import { FlightAwareRoutesService } from './service/flightaware-routes.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RoutesService } from './service/routes.service';

@Module({
  imports: [HttpModule, PrismaModule, ConfigModule],
  controllers: [RoutesController],
  providers: [
    FlightDutyService,
    RoutesService,
    FlightAwareService,
    FlightAwareRoutesService,
  ],
})
export class RouteModule {}
