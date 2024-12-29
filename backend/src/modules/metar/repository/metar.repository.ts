import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ApiResponse, MetarAPIResponse } from '../types/metar.types';
import { RouteService } from '../../route/services/route.service';
import { SuntimeAPIResponse } from '../types/sunrise-sunset.types';
import {
  createErrorResponse,
  ErrorResponse,
  isErrorResponse,
} from '../../../common/utils/error-response.util';

type MetarData = {
  [airport: string]: MetarAPIResponse['data'][number];
};

type SuntimesData = {
  [airport: string]: SuntimeAPIResponse['data'][number];
};

@Injectable()
export class WeatherRepository {
  constructor(
    private readonly httpService: HttpService,
    private routesService: RouteService,
  ) {}
  private metar: MetarData = {};
  private lastTimeMetarUpdated: Date | null = null;

  private suntimes: SuntimesData = {};
  private lastTimeSuntimesUpdated: Date | null = null;

  private readonly apiKey = `?x-api-key=${process.env.CHECK_WX_API_KEY}`;
  private readonly baseCheckwxURL = `https://api.checkwx.com`;
  private readonly featureFlag = true;

  private async requestNewMetarData(airports: Array<string>) {
    try {
      const airportsAsString = airports.join(',');
      const url = `${this.baseCheckwxURL}/metar/${airportsAsString}/decoded${this.apiKey}`;
      console.log('url', url);
      const response = await lastValueFrom(
        this.httpService.get<MetarAPIResponse>(url),
      );
      return response.data;
    } catch (e) {
      console.log('Erro ao pegar o metar', e);
      return createErrorResponse(
        'Não foi possível buscar os dados de METAR. Tente novamente mais tarde.',
      );
    }
  }

  private async requestNewSuntimesData(airports: Array<string>) {
    try {
      const airportsAsString = airports.join(',');
      const url = `${this.baseCheckwxURL}/station/${airportsAsString}/suntimes${this.apiKey}`;
      console.log('url', url);
      const response = await lastValueFrom(
        this.httpService.get<SuntimeAPIResponse>(url),
      );
      return response.data;
    } catch (e) {
      console.log('Erro ao pegar o sunset sunrise', e);
      return createErrorResponse(
        'Não foi possível buscar os dados de Suntimes. Tente novamente mais tarde.',
      );
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private checkIfNeedsToUpdateMetar() {
    const now = new Date();

    // Se já foi atualizado antes, verifica se ainda estamos na mesma hora
    if (
      this.lastTimeMetarUpdated &&
      now.getHours() === this.lastTimeMetarUpdated.getHours()
    ) {
      // Estamos na mesma hora da última atualização, usa o cache
      return false;
    }

    return true;
  }

  private checkIfNeedsToUpdateSuntimes(): boolean {
    const now = new Date();

    // Se já foi atualizado antes, verifica se ainda estamos no mesmo dia
    if (
      this.lastTimeSuntimesUpdated &&
      now.getFullYear() === this.lastTimeSuntimesUpdated.getFullYear() &&
      now.getMonth() === this.lastTimeSuntimesUpdated.getMonth() &&
      now.getDate() === this.lastTimeSuntimesUpdated.getDate()
    ) {
      // Estamos no mesmo dia da última atualização, usa o cache
      return false;
    }

    return true;
  }

  private async getAllAirportsInChunks() {
    const airports = await this.routesService.getAllAirportsFromRoutes();

    return this.chunkArray(airports, 20);
  }

  async updateMetar(): Promise<void> {
    this.metar = {};
    const airportChunks = await this.getAllAirportsInChunks();

    const results = await Promise.all(
      airportChunks.map((chunk) => this.requestNewMetarData(chunk)),
    );

    for (const result of results) {
      if (isErrorResponse(result)) return;
      // Verifica se result.data existe e é um array
      if (result && Array.isArray(result.data)) {
        for (const metarInfo of result.data) {
          // Extrai ICAO e raw_text do objeto
          const { icao, raw_text } = metarInfo;
          if (icao && raw_text) {
            this.metar[icao] = metarInfo;
          }
        }
      }
    }
  }

  async updateSuntimes(): Promise<void> {
    this.suntimes = {};

    const airportChunks = await this.getAllAirportsInChunks();

    const results = await Promise.all(
      airportChunks.map((chunk) => this.requestNewSuntimesData(chunk)),
    );

    for (const result of results) {
      if (isErrorResponse(result)) return;
      // Verifica se result.data existe e é um array
      if (result && Array.isArray(result.data)) {
        for (const suntimes of result.data) {
          const { icao } = suntimes;
          if (icao) {
            this.suntimes[icao] = suntimes;
          }
        }
      }
    }
  }

  async getMetar() {
    if (!this.featureFlag) return null;
    if (this.checkIfNeedsToUpdateMetar()) await this.updateMetar();
    return this.metar;
  }

  async getSuntimes() {
    if (!this.featureFlag) return null;
    if (this.checkIfNeedsToUpdateSuntimes()) await this.updateSuntimes();
    return this.suntimes;
  }
}
