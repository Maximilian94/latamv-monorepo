import { Injectable } from '@nestjs/common';
import { includes, sample } from 'lodash';
import { PrismaService } from 'src/prisma/prisma.service';
import { FlightSegment as FlightSegmentClass } from '../model/flightSegment';

type FilterCriteria = {
  airportsRoutes?: Array<string>;
  destinations?: Array<string>;
};

type FindPossibleRoutesV2Props = {
  airportsConnections: AirportsConnection;
  filterCriteria: FilterCriteria;
};

type AirportConnectionData = {
  destinations: Array<string>;
  origins: Array<string>;
};

type AirportsConnection = { [key: string]: AirportConnectionData };

export type GenerateFlightDutyParams = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

type FlightSegment = {
  departure: string;
  arrival: string;
  numberOfFlights: number;
  route: Array<string>;
};

@Injectable()
export class FlightDutyService {
  constructor(private prisma: PrismaService) {}

  finalRoute = [];

  resetFinalRoute({ HUB }: { HUB: string }) {
    this.finalRoute = [HUB];
  }

  private createRouteInSegments = (
    numberOfTotalFlights: number,
    HUB: string,
  ): FlightSegmentClass[] => {
    const segments: FlightSegmentClass[] = [];
    const preferredFlightPerSegment = 4;
    const alternativeFlightPerSegment = 3;
    let remainingFlights = numberOfTotalFlights;

    while (remainingFlights > 0) {
      let numberOfFlights;
      if (remainingFlights % preferredFlightPerSegment === 1) {
        numberOfFlights = alternativeFlightPerSegment;
      } else if (remainingFlights >= preferredFlightPerSegment) {
        numberOfFlights = preferredFlightPerSegment;
      } else {
        numberOfFlights = remainingFlights;
      }

      segments.push(
        new FlightSegmentClass({
          numberOfFlights,
          departure: segments.length === 0 ? HUB : undefined,
          arrival: remainingFlights - numberOfFlights <= 0 ? HUB : undefined,
        }),
      );

      remainingFlights -= numberOfFlights;
    }

    return segments;
  };

  private initSegments = (numberOfFlights: number) => {
    const segments: FlightSegment[] = [];
    let numberOfFlightsWile = numberOfFlights;
    if (numberOfFlights > 3) {
      while (numberOfFlightsWile > 0) {
        let flightsInSegment;

        if (numberOfFlightsWile % 4 == 0 || numberOfFlightsWile === 2) {
          flightsInSegment = Math.min(4, numberOfFlightsWile);
        } else {
          flightsInSegment = Math.min(3, numberOfFlightsWile);
        }

        segments.push({
          numberOfFlights: flightsInSegment,
          departure: '',
          arrival: null,
          route: null,
        });

        numberOfFlightsWile -= flightsInSegment;
      }
    } else {
      segments.push({
        numberOfFlights,
        departure: '',
        arrival: null,
        route: null,
      });
    }
    return segments;
  };

  async generateFlightDuty(params?: GenerateFlightDutyParams) {
    console.log('Inicia aqui');
    const { numberOfFlights = 2, doNotRepeatAirport } = params;
    const HUB = 'SBGR';

    this.resetFinalRoute({ HUB });

    // const airportsConnections = await this.getAirportConnectionsGraph();

    //  Will slipt the flightDuty in segments
    const segments = this.initSegments(numberOfFlights);
    const segments2 = this.createRouteInSegments(numberOfFlights, HUB);

    await this.buildRoutes(segments2, HUB);

    // console.log('Segmentos', segments);
    console.log('segments2', segments2);
    console.log('Rotas', segments2.map((segment) => segment.route).join(', '));

    // const addRoutes = async ({ index }: { index: number }) => {
    //   const currentSegment = segments[index];
    //   let nextSegment: FlightSegment = null;
    //   if (+index == 0) currentSegment.departure = HUB;

    //   if (+index == segments.length - 1) {
    //     currentSegment.arrival = HUB;
    //   } else {
    //     nextSegment = segments[index + 1];
    //   }

    //   const possibleRoutes = await this.generatePossibleRoutes({
    //     airportsConnections,
    //     numberOfFlights: currentSegment.numberOfFlights,
    //     startAirport: currentSegment.departure,
    //     endAirport: currentSegment.arrival,
    //     doNotRepeatAirport,
    //   });

    //   if (!possibleRoutes || possibleRoutes.length == 0) {
    //     this.resetFinalRoute({ HUB });
    //     return addRoutes({ index: 0 });
    //   }

    //   const route = sample(possibleRoutes);
    //   this.finalRoute.push(...route);
    //   currentSegment.arrival = route[route.length - 1];
    //   currentSegment.route = route;
    //   if (nextSegment) {
    //     nextSegment.departure = route[route.length - 1];
    //     addRoutes({ index: index + 1 });
    //   }
    // };

    // addRoutes({ index: 0 });

    return {
      final: this.finalRoute,
    };
  }

  async getAirportConnectionsGraph() {
    const airportsConnections: AirportsConnection = {};
    const routes = await this.prisma.route.findMany();
    for (const route of routes) {
      const { departure_icao, arrival_icao } = route;

      if (!airportsConnections[departure_icao]) {
        airportsConnections[departure_icao] = { destinations: [], origins: [] };
      }
      if (!airportsConnections[arrival_icao]) {
        airportsConnections[arrival_icao] = { destinations: [], origins: [] };
      }

      if (
        !includes(airportsConnections[arrival_icao].origins, departure_icao)
      ) {
        airportsConnections[arrival_icao].origins.push(departure_icao);
      }

      if (
        !includes(
          airportsConnections[departure_icao].destinations,
          arrival_icao,
        )
      ) {
        airportsConnections[departure_icao].destinations.push(arrival_icao);
      }
    }

    return airportsConnections;
  }

  generatePossibleRoutes({
    startAirport,
    endAirport,
    airportsConnections,
    numberOfFlights,
    doNotRepeatAirport,
    airportsToAvoid,
  }: {
    startAirport: string;
    endAirport?: string;
    airportsConnections: AirportsConnection;
    numberOfFlights: number;
    doNotRepeatAirport?: boolean;
    airportsToAvoid?: Array<string>;
  }) {
    const possibleRoutes: Array<Array<string>> = [];

    const addPossibleRoute = (possibleListRoute: Array<string>) => {
      possibleRoutes.push(possibleListRoute.slice(1));
    };

    const findPossibility = ({
      level,
      startAirport,
      list,
      endAirport,
    }: {
      level: number;
      startAirport: string;
      list: Array<string>;
      endAirport?: string;
    }) => {
      const isLastFlight = level == numberOfFlights;
      if (isLastFlight) {
        if (endAirport) {
          if (endAirport == startAirport) addPossibleRoute(list);
        } else {
          addPossibleRoute(list);
        }
      } else {
        for (const arp of airportsConnections[startAirport].destinations) {
          if (doNotRepeatAirport) {
            if (airportsToAvoid?.includes(arp)) {
              return;
            }

            if (this.finalRoute.includes(arp)) {
              if (arp == 'SBGR') {
              } else {
                return;
              }
            }
          }

          findPossibility({
            level: level + 1,
            startAirport: arp,
            list: [...list, arp],
            endAirport,
          });
        }
      }
    };

    findPossibility({
      startAirport,
      level: 0,
      list: [startAirport],
      endAirport,
    });

    return possibleRoutes;
  }

  filterAirports(criteria: FilterCriteria, connections: AirportsConnection) {
    const filteredConnections: AirportsConnection = {};
    const filterBy = (icao) => {
      return includes(criteria.airportsRoutes, icao);
    };

    // Iterar sobre cada entrada no dicionário
    Object.entries(connections).forEach(([icao, data]) => {
      const matchesAirportsRoutes = criteria.airportsRoutes
        ? filterBy(icao)
        : true;

      const matchesDestination = criteria.destinations
        ? criteria.destinations.includes(icao)
        : true;

      // Se todos os critérios ativos são verdadeiros, adicionar ao resultado
      if (matchesAirportsRoutes && matchesDestination) {
        console.log('Selecinou');
        filteredConnections[icao] = data;
      } else {
        console.log('Não selecinou');
      }
    });

    console.log('filteredConnections', filteredConnections);

    return filteredConnections;
  }

  findPossibleRoutesV2 = ({
    airportsConnections,
    filterCriteria,
  }: FindPossibleRoutesV2Props) => {
    // console.log('airportsConnections', airportsConnections);
    console.log('filterCriteria', filterCriteria);
    const filteredRoutes = this.filterAirports(
      filterCriteria,
      airportsConnections,
    );

    console.log('Depois dos filtros', filteredRoutes);
    return filteredRoutes;
  };

  async buildRoutes(flightSegments: FlightSegmentClass[], HUB: string) {
    const airportsConnections = await this.getAirportConnectionsGraph();

    const addRoutes = async ({ index }: { index: number }) => {
      console.log('Inicia addRoutes');
      const currentSegment = flightSegments[index];
      let nextSegment: FlightSegmentClass = null;
      if (+index == 0) currentSegment.departure = HUB;

      if (+index == flightSegments.length - 1) {
        currentSegment.arrival = HUB;
      } else {
        nextSegment = flightSegments[index + 1];
      }

      console.log('Vai calcular rotas possiveis');

      // const possibleRoutes = await this.generatePossibleRoutes({
      //   airportsConnections,
      //   numberOfFlights: currentSegment.numberOfFlights,
      //   startAirport: currentSegment.departure,
      //   endAirport: currentSegment.arrival,
      // });

      const possibleRoutes = [[]];
      console.log('currentSegment.arrival', currentSegment.arrival);
      console.log('currentSegment.departure', currentSegment.departure);
      const possibleRoutesV2 = this.findPossibleRoutesV2({
        airportsConnections,
        filterCriteria: {
          destinations: currentSegment.arrival
            ? [currentSegment.arrival]
            : undefined,
          airportsRoutes: currentSegment.departure
            ? [currentSegment.departure]
            : undefined,
        },
      });

      console.log('Quantidade de rotas possiveis', possibleRoutesV2.length);

      if (!possibleRoutes || possibleRoutes.length == 0) {
        console.log('Não achou rota possivel');
        this.resetFinalRoute({ HUB });
        return addRoutes({ index: 0 });
      }

      const route = sample(possibleRoutes);
      this.finalRoute.push(...route);
      currentSegment.arrival = route[route.length - 1];
      currentSegment.route = route.toString();
      if (nextSegment) {
        console.log('Proximo segmento', nextSegment);
        nextSegment.departure = route[route.length - 1];
        addRoutes({ index: index + 1 });
      }
    };

    addRoutes({ index: 0 });
  }
}
