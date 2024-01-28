import { Injectable } from '@nestjs/common';
import { CGNARoute } from './interfaces/cgna.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment';

@Injectable()
export class CGNAService {
  constructor(private readonly httpService: HttpService) {}

  private routes: CGNARoute[] = [];

  create(cat: CGNARoute) {
    this.routes.push(cat);
  }

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
        if (flight) pushFlight();
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

  async getCGNARoutes(): Promise<CGNARoute[]> {
    if (this.routes.length == 0) {
      const teste = moment();
      const CGNARoutes = await this.requestCGNARoutes(teste);
      this.routes = this.convertCGNATextToJson(CGNARoutes);
    }

    return this.routes;
  }
}
