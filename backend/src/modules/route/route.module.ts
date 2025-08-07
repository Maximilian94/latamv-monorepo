import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RouteRepository } from './repository/route.repository';
import { RouteService } from './services/route.service';
import { FlightDutiesController } from './controllers/route.controller';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [FlightDutiesController],
  providers: [RouteRepository, RouteService],
  imports: [PrismaModule, PermissionModule],
  exports: [RouteRepository, RouteService],
})
export class RouteModule {}
