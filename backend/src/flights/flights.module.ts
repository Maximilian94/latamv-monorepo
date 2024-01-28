import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RoutesController } from './controllers/routes.controller';
import { CGNAService } from './service/cgna.service';

@Module({
  imports: [HttpModule],
  controllers: [RoutesController],
  providers: [CGNAService],
})
export class FlightsModule {}
