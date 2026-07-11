import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AircraftRepository } from './repositories/aircraft.repository';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { AircraftService } from './services/aircraft.service';
import { AircraftController } from './controllers/aircraft.controller';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [AircraftController],
  exports: [AircraftService],
  imports: [
    PrismaModule,
    PermissionModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AircraftRepository, AircraftService],
})
export class AircraftModule {}
