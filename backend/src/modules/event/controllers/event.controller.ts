import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventService } from '../services/event.service';
import { CreateEventDto } from '../dto/event.dto';

@Controller('event')
export class EventController {
  constructor(private eventService: EventService) {}

  @UseGuards(AuthGuard)
  @Get('severity')
  async getEventSeverities() {
    return this.eventService.getEventSeverities();
  }

  @UseGuards(AuthGuard)
  @Post()
  async createEvent(@Body() data: CreateEventDto) {
    return this.eventService.createEvent(data);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getEvents() {
    return this.eventService.getEvents();
  }
}
