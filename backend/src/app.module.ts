import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouteModule as LegacyRouteModule } from './flights/route.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { FlightDutyModule } from './modules/flightDuty/flightDuty.module';
import { RouteModule } from './modules/route/route.module';
import { FlightModule } from './modules/flight/flight.module';
import { UserModule } from './modules/user/user.model';

@Module({
  imports: [
    LegacyRouteModule,
    FlightDutyModule,
    PrismaModule,
    RouteModule,
    FlightModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
