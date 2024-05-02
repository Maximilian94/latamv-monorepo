import { Injectable } from '@nestjs/common';
import { includes, last, sample } from 'lodash';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  FlightSegment as FlightSegmentClass,
  RouteSegment,
} from '../model/flightSegment';
import { FlightDutyRepository } from '../repositories/flight-duty.repository';
import * as dayjs from 'dayjs';
import { FlightService } from 'src/modules/flight/services/flight.service';

type FilterCriteria = {
  excludeAirports?: string[];
  onlyDestinations?: string[];
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

@Injectable()
export class FlightDutyService {
  constructor(
    private prisma: PrismaService,
    private flightDutyRepository: FlightDutyRepository,
    private flightService: FlightService,
  ) {}
  readonly DEFAULT_EXPIRATION_DAYS = 30;

  async generateFlightDuty(params?: GenerateFlightDutyParams) {
    const { numberOfFlights = 2 } = params;
    const HUB = 'SBGR';

    // const airportsConnections = await this.getAirportConnectionsGraph();

    //  Will slipt the flightDuty in segments
    const segments2 = this.createRouteInSegments(numberOfFlights, HUB);

    await this.buildRoutes(segments2, HUB);

    const flightDuty = segments2.map((segment) => segment.route);

    const createdAt = dayjs();
    const expirationDate = createdAt.add(this.DEFAULT_EXPIRATION_DAYS, 'day');

    const flightDutyDataBase = await this.flightDutyRepository.createFlightDuty(
      {
        createdAt: createdAt.toDate(),
        expirationDate: expirationDate.toDate(),
      },
    );

    const routes: RouteSegment[] = [];
    flightDuty.forEach((segment) =>
      segment.forEach((route) => routes.push(route)),
    );

    this.flightService.createFlightsFromRoutesSegment(
      routes,
      flightDutyDataBase.id,
    );

    return { flightDuty };
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

  private async getAirportConnectionsGraph() {
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

  private generatePossibleRoutesFromAirport({
    departureICAO,
    airportConnectionData,
    previousRoute,
    filterCriteria,
  }: {
    departureICAO: string;
    airportConnectionData: AirportConnectionData;
    previousRoute: string;
    filterCriteria?: FilterCriteria;
  }) {
    const possibleRoutes: string[] = [];

    this.filterDestinations(
      filterCriteria,
      airportConnectionData?.destinations,
    ).forEach((destination) => {
      if (previousRoute)
        possibleRoutes.push(`${previousRoute} - ${destination}`);
      else possibleRoutes.push(`${departureICAO} - ${destination}`);
    });

    return possibleRoutes;
  }

  private filterDestinations(
    filterCriteria: FilterCriteria,
    destinations: string[],
  ) {
    const excludeAirports = () => {
      filteredDestinations = filteredDestinations.filter((destination) => {
        return !filterCriteria?.excludeAirports.includes(destination);
      });
    };

    const onlyDestinations = () => {
      filteredDestinations = filteredDestinations.filter((destination) => {
        return filterCriteria?.onlyDestinations.includes(destination);
      });
    };

    let filteredDestinations = destinations;
    filterCriteria?.excludeAirports ? excludeAirports() : true;
    filterCriteria?.onlyDestinations ? onlyDestinations() : true;

    return filteredDestinations;
  }

  private async buildRoutes(flightSegments: FlightSegmentClass[], HUB: string) {
    const airportsConnections = await this.getAirportConnectionsGraph();

    const addRoutes = async ({ segmentIndex }: { segmentIndex: number }) => {
      const currentSegment = flightSegments[segmentIndex];
      let nextSegment: FlightSegmentClass = null;
      if (+segmentIndex == 0) currentSegment.departure = HUB;

      if (+segmentIndex == flightSegments.length - 1) {
        currentSegment.arrival = HUB;
      } else {
        nextSegment = flightSegments[segmentIndex + 1];
      }

      let allPossibleRoutesForThisSegment: string[] =
        this.generatePossibleRoutesFromAirport({
          departureICAO: currentSegment.departure,
          airportConnectionData: airportsConnections[currentSegment.departure],
          previousRoute: '',
        });

      for (let i = 1; i < currentSegment.numberOfFlights; i++) {
        const isLastFlightAndSegment =
          !nextSegment && i == currentSegment.numberOfFlights - 1;

        const newPossibleRoutesForThisSegment: string[] = [];
        allPossibleRoutesForThisSegment.forEach((currentFlightDuty) => {
          const departureForNextLeg = last(currentFlightDuty.split('-')).trim();

          const possibleNextRoutes = this.generatePossibleRoutesFromAirport({
            departureICAO: departureForNextLeg,
            airportConnectionData: airportsConnections[departureForNextLeg],
            previousRoute: currentFlightDuty,
            filterCriteria: {
              onlyDestinations: isLastFlightAndSegment ? [HUB] : undefined,
            },
          });

          newPossibleRoutesForThisSegment.push(...possibleNextRoutes);
        });

        allPossibleRoutesForThisSegment = newPossibleRoutesForThisSegment;
      }

      if (allPossibleRoutesForThisSegment.length) {
        currentSegment.route = this.parseRoute(
          sample(allPossibleRoutesForThisSegment),
        );
        currentSegment.arrival =
          currentSegment.route[currentSegment.route.length - 1].arrival;
        if (nextSegment) {
          nextSegment.departure = currentSegment.arrival;
          addRoutes({ segmentIndex: segmentIndex + 1 });
        }
      }
    };

    addRoutes({ segmentIndex: 0 });
  }

  private parseRoute(routeString) {
    // Divide a string pelos hífens para obter os códigos dos aeroportos
    const airports = routeString.split(' - ');

    // Cria um array para armazenar os segmentos de viagem
    const segments = [];

    // Itera sobre os códigos dos aeroportos, exceto o último, porque cada segmento precisa de um aeroporto de partida e de chegada
    for (let i = 0; i < airports.length - 1; i++) {
      // Cria um objeto para cada segmento e o adiciona ao array
      segments.push({
        departure: airports[i],
        arrival: airports[i + 1],
      });
    }

    return segments;
  }
}
