import { Injectable } from '@nestjs/common';
import { CGNAService } from './cgna.service';
import { sample } from 'lodash';
import { CGNARoutes } from './interfaces/cgna.interface';

@Injectable()
export class FlightDutyService {
  constructor(private cgnaService: CGNAService) {}

  async flightDutyGenerator({
    numberOfFlights,
    hub,
  }: {
    numberOfFlights: number;
    hub: string;
  }) {
    if (numberOfFlights <= 1) {
      return { error: 'number of flights should be more than 1' };
    }

    const cgnaRoutes = await this.cgnaService.getCGNARoutes();
    const airportsDataRoute = await this.cgnaService.getAirportsDataRoute();

    const generateRoutes = (atual, voosRestantes, rotaAtual, rotasValidas) => {
      if (voosRestantes === 0) {
        if (atual === hub) {
          // O último aeroporto deve ser o HUB
          rotasValidas.push([...rotaAtual, atual]);
        }
        return;
      }

      const destinos = airportsDataRoute[atual].destinartions;

      destinos.map((destino) => {
        generateRoutes(
          destino,
          voosRestantes - 1,
          [...rotaAtual, atual],
          rotasValidas,
        );
      });
    };

    const getAllRoutes = (hub, quantidadeVoos) => {
      const rotasValidas = [];
      generateRoutes(hub, quantidadeVoos, [], rotasValidas);
      return rotasValidas;
    };

    const todasRotas = getAllRoutes(hub, numberOfFlights);

    const flightDut: CGNARoutes = [];
    const randomRoute = sample(todasRotas);
    randomRoute.map((value, i) => {
      if (i == randomRoute.length - 1) return;
      const departure = value;
      const arrival = randomRoute[i + 1];
      const availableRoutes = cgnaRoutes.filter(
        (r) => r.departure_icao == departure && r.arrival_icao == arrival,
      );

      const randomFlight = sample(availableRoutes);
      flightDut.push(randomFlight);
    });

    return {
      quantidade: todasRotas.length,
      escolhida: sample(todasRotas),
      flightDut,
    };
  }
}
