import { Injectable } from '@nestjs/common';
import { CGNARoutes } from './interfaces/cgna.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment';
import { union } from 'lodash';

interface Flight {
  day: string;
  company: string;
  aircraft: string;
  departure: string;
  departureTime: string;
  speed: string;
  flightLevel: string;
  route: string;
  arrival: string;
  eet: string;
  rmk: string;
}

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
    const flights = [];

    const rows = dados.toString().split('\n');

    let flight = null;

    const regex = /^\s*(\d{6} \d{6} \d{7})/;
    const isFlightDataRow = /^\s{59}/;

    const pushFlight = () => {
      for (const day in flight.day) {
        if (day != '0') flights.push({ ...flight, day });
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

      const departureAirportData = initAirportData(flight.departure);
      const landingAirportData = initAirportData(flight.arrival);

      departureAirportData.destinartions = union(
        departureAirportData.destinartions,
        [flight.arrival],
      );

      landingAirportData.origins = union(landingAirportData.origins, [
        flight.departure,
      ]);
    };

    rows.map((row) => {
      const startFlightData = () => {
        flight.day = row.substring(17, 24);
        flight.company = row.substring(25, 32);
        flight.aircraft = row.substring(33, 39);
        flight.departure = row.substring(40, 44);
        flight.departureTime = row.substring(44, 48);
        flight.speed = row.substring(50, 54);
        flight.flightLevel = row.substring(55, 58);
        flight.route = row.substring(59, 95).trim();
        flight.arrival = row.substring(95, 99);
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
        if (!flight) flight = {};

        startFlightData();
      } else if (isFlightDataRow.test(row)) {
        continueFlightData();
      }
    });

    pushFlight();

    return flights;
  }

  async requestCGNARoutes(date: moment.Moment) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(
          `http://portal.cgna.decea.mil.br/files/abas/${date.format('YYYY-MM-DD')}/painel_rpl/companhias/Cia_TAM_CS.txt`,
        ),
      );

      return Promise.resolve(data);
    } catch (error) {
      return this.requestCGNARoutes(date.subtract(1, 'days'));
    }
  }

  async getCGNARoutes(): Promise<CGNARoutes> {
    if (this.routes.length == 0) {
      const teste = moment();
      const CGNARoutes = await this.requestCGNARoutes(teste);
      this.routes = this.convertCGNATextToJson(CGNARoutes);
    }
    return this.routes;
  }

  async getAirportsDataRoute() {
    await this.getCGNARoutes();
    return this.airportsDataRoute;
  }
}
