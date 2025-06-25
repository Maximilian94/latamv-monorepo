import { EventController } from './controllers/event.controller';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { EventService } from './services/event.service';

@Module({
  controllers: [EventController],
  providers: [EventService],
  imports: [PrismaModule, PermissionModule],
  exports: [EventService],
})
export class EventModule {}
