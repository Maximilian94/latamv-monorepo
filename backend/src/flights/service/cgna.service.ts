import { Injectable } from '@nestjs/common';
import { CGNARoutes, Flight } from './interfaces/cgna.interface';
import { HttpService } from '@nestjs/axios';
import * as moment from 'moment';
import { union } from 'lodash';
import { AxiosError } from 'axios';

export interface AirportDataRoute {
  destinartions: string[];
  origins: string[];
}

@Injectable()
export class CGNAService {
  constructor(private readonly httpService: HttpService) {}

  private routes: CGNARoutes = [];
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
        eobt: '',
        eet: '',
        flight_number: '',
        flight_level: '',
        rmk: '',
        route: '',
        speed: '',
        weekday: '',
      };
    };

    const regex = /^\s*(\d{6} \d{6} \d{7})/;
    const isFlightDataRow = /^\s{59}/;

    const pushFlight = () => {
      for (const weekday of flight.weekday) {
        if (weekday != '0') flights.push({ ...flight, weekday });
      }
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
        flight.weekday = row.substring(17, 24);
        flight.flight_number = row.substring(25, 32);
        flight.aircraft_model_code = row.substring(33, 37);
        flight.departure_icao = row.substring(40, 44);
        flight.eobt = row.substring(44, 48);
        flight.speed = row.substring(50, 54);
        flight.flight_level = row.substring(55, 58);
        flight.route = row.substring(59, 95).trim();
        flight.arrival_icao = row.substring(95, 99);
        flight.eet = row.substring(99, 103);
        flight.rmk = row.substring(104).trim();
      };

      const continueFlightData = () => {
        flight.route = (flight.route + ' ' + row.substring(59, 104)).trim();
        flight.rmk = (flight.rmk + ' ' + row.substring(104)).trim();
      };

      if (regex.test(row)) {
        if (flight) {
          addAirportData(flight);
          pushFlight();
        }
        if (!flight) initFlightData();

        startFlightData();
      } else if (isFlightDataRow.test(row)) {
        continueFlightData();
      }
    });

    pushFlight();

    console.log(
      'convertCGNATextToJson - 1',
      flights.filter((e) => e.flight_number == 'TAM3000').length,
    );

    return flights;
  }

  async requestCGNARoutes(date: moment.Moment) {
    try {
      console.log(
        'Tenta pegar rotas do CGNA para o dia',
        date.format('YYYY-MM-DD'),
      );
      const response = await this.httpService
        .get(
          `http://portal.cgna.decea.mil.br/files/abas/${date.format('YYYY-MM-DD')}/painel_rpl/companhias/Cia_TAM_CS.txt`,
        )
        .toPromise();

      console.log('Passou do response');

      return Promise.resolve(response.data);

      // return response.toPromise().then(({ data }) => {
      //   console.log('Aoba');
      //   return Promise.resolve(data);
      // });
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
    console.log('CGNARoutesText');
    return this.convertCGNATextToJson(CGNARoutesText);
  }

  async getAirportsDataRoute() {
    await this.getCGNARoutes();
    return this.airportsDataRoute;
  }
}
