import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RoutesController } from './controllers/routes.controller';
import { CGNAService } from './service/cgna.service';
import { FlightDutyService } from './service/flightDuty.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RoutesService } from './service/routes.service';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [RoutesController],
  providers: [CGNAService, FlightDutyService, RoutesService],
})
export class RouteModule {}
