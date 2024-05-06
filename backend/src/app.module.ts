import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouteModule as LegacyRouteModule } from './flights/route.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { FlightDutyModule } from './modules/flightDuty/flightDuty.module';
import { RouteModule } from './modules/route/route.module';
import { FlightModule } from './modules/flight/flight.module';
import { UserModule } from './modules/user/user.model';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { AircraftModule } from './modules/aircraft/aircraft.module';

@Module({
  imports: [
    LegacyRouteModule,
    FlightDutyModule,
    PrismaModule,
    RouteModule,
    FlightModule,
    UserModule,
    AircraftModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
