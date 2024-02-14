import { Injectable } from '@nestjs/common';
import { flatMap, includes, sample } from 'lodash';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async generateFlightDuty(params?: GenerateFlightDutyParams) {
    const { numberOfFlights = 2 } = params;
    const HUB = 'SBGR';

    const airportsConnections = await this.getAirportConnectionsGraph();

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

    for (let index = 0; index < segments.length; index++) {
      const currentSegment = segments[index];
      let nextSegment: FlightSegment = null;
      if (+index == 0) {
        currentSegment.departure = HUB;
      }

      if (+index == segments.length - 1) {
        currentSegment.arrival = HUB;
      } else {
        nextSegment = segments[index + 1];
      }

      const possibleRoutes = await this.generatePossibleRoutes({
        airportsConnections,
        numberOfFlights: currentSegment.numberOfFlights,
        startAirport: currentSegment.departure,
        endAirport: currentSegment.arrival,
      });

      const route = sample(possibleRoutes);
      currentSegment.arrival = route[route.length - 1];
      currentSegment.route = route;
      if (nextSegment) {
        nextSegment.departure = route[route.length - 1];
      }
    }

    const reduceRoutesSegementsInOneRoute = (segments) => {
      return flatMap(segments, (segment, index) => {
        return +index === 0 ? segment.route : segment.route.slice(1);
      });
    };

    return {
      final: reduceRoutesSegementsInOneRoute(segments),
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

  async generatePossibleRoutes({
    startAirport,
    endAirport,
    airportsConnections,
    numberOfFlights,
  }: {
    startAirport: string;
    endAirport?: string;
    airportsConnections: AirportsConnection;
    numberOfFlights: number;
  }) {
    const possibleRoutes: Array<Array<string>> = [];

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
      if (level == numberOfFlights) {
        if (endAirport) {
          if (endAirport == startAirport) possibleRoutes.push(list);
        } else {
          possibleRoutes.push(list);
        }
      } else {
        for (const arp of airportsConnections[startAirport].destinations) {
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
}
