import { Injectable } from '@nestjs/common';
import { WeatherRepository } from '../repository/metar.repository';

@Injectable()
export class WeatherService {
  constructor(private weatherRepository: WeatherRepository) {}

  getMetar() {
    return this.weatherRepository.getMetar();
  }

  getSuntimes() {
    return this.weatherRepository.getSuntimes();
  }
}
