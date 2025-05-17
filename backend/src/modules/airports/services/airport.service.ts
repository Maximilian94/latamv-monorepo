import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state: string;
  country: string;
  elevation: number;
  lat: number;
  lon: number;
  tz: string;
}

@Injectable()
export class AirportService {
  private airports: Record<string, Airport>;

  constructor() {
    this.loadAirports();
  }

  private loadAirports() {
    // Caminho absoluto corrigido
    const filePath = path.join(
      process.cwd(), // Diretório raiz do projeto (backend/)
      'src',
      'utils',
      'airports.json',
    );

    console.log('Carregando aeroportos de:', filePath); // Debug

    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      this.airports = JSON.parse(rawData);
    } catch (error) {
      throw new Error(`Falha ao carregar aeroportos: ${error.message}`);
    }
  }

  getAirportData(icao: string) {
    const airport = this.airports[icao.toUpperCase()];
    if (!airport) throw new Error('Aeroporto não encontrado');
    return airport;
  }
}
