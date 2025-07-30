import { Injectable } from '@nestjs/common';
import { FlightAwareService } from './flightaware.service';
import { sample } from 'lodash';

@Injectable()
export class FlightDutyService {
  constructor(private flightAwareService: FlightAwareService) {}

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

    try {
      const flightAwareRoutes = await this.flightAwareService.getLATAMFlights();

      // Build airports data from FlightAware routes
      const airportsDataRoute: {
        [key: string]: { destinartions: string[]; origins: string[] };
      } = {};

      flightAwareRoutes.forEach((route) => {
        // Initialize airports if not exists
        if (!airportsDataRoute[route.departure_icao]) {
          airportsDataRoute[route.departure_icao] = {
            destinartions: [],
            origins: [],
          };
        }
        if (!airportsDataRoute[route.arrival_icao]) {
          airportsDataRoute[route.arrival_icao] = {
            destinartions: [],
            origins: [],
          };
        }

        // Add destinations and origins
        if (
          !airportsDataRoute[route.departure_icao].destinartions.includes(
            route.arrival_icao,
          )
        ) {
          airportsDataRoute[route.departure_icao].destinartions.push(
            route.arrival_icao,
          );
        }
        if (
          !airportsDataRoute[route.arrival_icao].origins.includes(
            route.departure_icao,
          )
        ) {
          airportsDataRoute[route.arrival_icao].origins.push(
            route.departure_icao,
          );
        }
      });

      const generateRoutes = (
        atual: string,
        voosRestantes: number,
        rotaAtual: string[],
        rotasValidas: string[][],
      ) => {
        if (voosRestantes === 0) {
          if (atual === hub) {
            // O último aeroporto deve ser o HUB
            rotasValidas.push([...rotaAtual, atual]);
          }
          return;
        }

        const destinos = airportsDataRoute[atual]?.destinartions || [];

        destinos.forEach((destino) => {
          generateRoutes(
            destino,
            voosRestantes - 1,
            [...rotaAtual, atual],
            rotasValidas,
          );
        });
      };

      const getAllRoutes = (hub: string, quantidadeVoos: number) => {
        const rotasValidas: string[][] = [];
        generateRoutes(hub, quantidadeVoos, [], rotasValidas);
        return rotasValidas;
      };

      const todasRotas = getAllRoutes(hub, numberOfFlights);

      const flightDut: any[] = [];
      const randomRoute = sample(todasRotas);

      if (randomRoute) {
        randomRoute.forEach((value, i) => {
          if (i == randomRoute.length - 1) return;
          const departure = value;
          const arrival = randomRoute[i + 1];
          const availableRoutes = flightAwareRoutes.filter(
            (r) => r.departure_icao == departure && r.arrival_icao == arrival,
          );

          const randomFlight = sample(availableRoutes);
          if (randomFlight) {
            flightDut.push(randomFlight);
          }
        });
      }

      return {
        quantidade: todasRotas.length,
        escolhida: sample(todasRotas),
        flightDut,
      };
    } catch (error) {
      return { error: 'Failed to generate flight duty: ' + error.message };
    }
  }
}
