import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RouteRepository } from './repository/route.repository';
import { RouteService } from './services/route.service';

@Module({
  controllers: [],
  providers: [RouteRepository, RouteService],
  imports: [PrismaModule],
  exports: [RouteRepository, RouteService],
})
export class RouteModule {}
