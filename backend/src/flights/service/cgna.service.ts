import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Flight } from './interfaces/cgna.interface';
import * as moment from 'moment';
import { AxiosError } from 'axios';
import { union } from 'lodash';

export interface AirportDataRoute {
  destinartions: string[];
  origins: string[];
}

@Injectable()
export class CGNAService {
  constructor(private readonly httpService: HttpService) {}

  private routes: Flight[] = [];
  private airportsDataRoute: { [key: string]: AirportDataRoute } = {};

  convertCGNATextToJson(dados) {
    const flights: Flight[] = [];

    const rows = dados.toString().split('\n');

    let flight: Flight = null;
    const initFlightData = () => {
      flight = {
        aircraft_model_code: '',
        arrival_icao: '',
        departure_icao: '',
        eet: 0,
      };
    };

    const regex = /^\s*(\d{6} \d{6} \d{7})/;

    const pushFlight = () => {
      flights.push({ ...flight });
    };

    const addAirportData = (flight: Flight) => {
      const initAirportData = (airport: string) => {
        if (!this.airportsDataRoute[airport]) {
          this.airportsDataRoute[airport] = {
            destinartions: [],
            origins: [],
          };
        }
        return this.airportsDataRoute[airport];
      };

      const departureAirportData = initAirportData(flight.departure_icao);
      const landingAirportData = initAirportData(flight.arrival_icao);

      departureAirportData.destinartions = union(
        departureAirportData.destinartions,
        [flight.arrival_icao],
      );

      landingAirportData.origins = union(landingAirportData.origins, [
        flight.departure_icao,
      ]);
    };

    rows.map((row) => {
      const startFlightData = () => {
        flight.aircraft_model_code = row.substring(33, 37);
        flight.departure_icao = row.substring(40, 44);
        flight.arrival_icao = row.substring(95, 99);
        const eetString = row.substring(99, 103);
        const hours = parseInt(eetString.substring(0, 2), 10);
        const minutes = parseInt(eetString.substring(2, 4), 10);
        flight.eet = (hours * 60 + minutes) * 60; // Convert to seconds
      };

      if (regex.test(row)) {
        if (flight) {
          addAirportData(flight);
          pushFlight();
        }
        if (!flight) initFlightData();

        startFlightData();
      }
    });

    pushFlight();

    return flights;
  }

  async requestCGNARoutes(date: moment.Moment) {
    try {
      const response = await this.httpService
        .get(
          `http://portal.cgna.decea.mil.br/files/abas/${date.format('YYYY-MM-DD')}/painel_rpl/companhias/Cia_TAM_CS.txt`,
        )
        .toPromise();

      return Promise.resolve(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log('Entrou no erro', error.message);
      }
      return this.requestCGNARoutes(date.subtract(1, 'days'));
    }
  }

  async getCGNARoutes(): Promise<Flight[]> {
    const teste = moment();
    const CGNARoutesText = await this.requestCGNARoutes(teste);
    return this.convertCGNATextToJson(CGNARoutesText);
  }

  async getAirportsDataRoute() {
    await this.getCGNARoutes();
    return this.airportsDataRoute;
  }
}
