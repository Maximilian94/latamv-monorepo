import { Controller, Get } from '@nestjs/common';
import { WeatherService } from '../services/metar.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('metar')
  getMetar() {
    return this.weatherService.getMetar();
  }

  @Get('suntimes')
  getSuntimes() {
    console.log('Vai pegar suntimes');
    return this.weatherService.getSuntimes();
  }
}
