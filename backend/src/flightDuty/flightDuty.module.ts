import { Module } from '@nestjs/common';
import { FlightDutyController } from './controllers/flightDuty.controller';
import { FlightDutyService } from './services/flightDuty.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FlightDutyController],
  providers: [FlightDutyService],
  imports: [PrismaModule],
})
export class FlightDutyModule {}
