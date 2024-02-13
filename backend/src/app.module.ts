import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouteModule } from './flights/route.module';
import { PrismaModule } from './prisma/prisma.module';
import { FlightDutyModule } from './flightDuty/flightDuty.module';

@Module({
  imports: [RouteModule, FlightDutyModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
