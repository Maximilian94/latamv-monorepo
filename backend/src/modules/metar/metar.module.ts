import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { WeatherRepository } from './repository/metar.repository';
import { WeatherService } from './services/metar.service';
import { WeatherController } from './controllers/metar.controller';
import { RouteModule } from '../route/route.module';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  controllers: [WeatherController],
  providers: [WeatherService, WeatherRepository],
  imports: [PrismaModule, RouteModule, HttpModule],
  exports: [WeatherService],
})
export class MetarModule {}
