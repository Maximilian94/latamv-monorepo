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
import { APP_FILTER } from '@nestjs/core';
import { AircraftModule } from './modules/aircraft/aircraft.module';
import { GatewayModule } from './gateway/gateway.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { EventEmitterModule } from './common/modules/event-emitter/event-emitter.module';

@Module({
  imports: [
    GatewayModule,
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
    EventEmitterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
  ],
})
export class AppModule {}
