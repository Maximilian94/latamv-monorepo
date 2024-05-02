import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RouteRepository } from './repository/route.repository';

@Module({
  controllers: [],
  providers: [RouteRepository],
  imports: [PrismaModule],
  exports: [RouteRepository],
})
export class RouteModule {}
