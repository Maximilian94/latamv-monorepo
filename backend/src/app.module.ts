import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlightsModule } from './flights/flights.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [FlightsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
