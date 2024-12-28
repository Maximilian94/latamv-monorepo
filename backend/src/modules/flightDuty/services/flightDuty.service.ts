import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { includes, last, sample } from 'lodash';
import {
  FlightSegment as FlightSegmentClass,
  RouteSegment,
} from '../model/flightSegment';
import { FlightDutyRepository } from '../repositories/flight-duty.repository';
import * as dayjs from 'dayjs';
import { FlightService } from 'src/modules/flight/services/flight.service';
import { RouteService } from 'src/modules/route/services/route.service';
import { Prisma, User, Route } from '@prisma/client';
import { AircraftService } from 'src/modules/aircraft/services/aircraft.service';
import { createErrorResponse } from '../../../common/utils/error-response.util';
import { GenerateFlightDutyDto } from '../dto/flight-duty.dto';

type OmitUser = Omit<User, 'password'>;

type FilterCriteria = {
  excludeAirports?: string[];
  onlyDestinations?: string[];
  aircraft: string[];
};

type AirportConnectionData = {
  destinations: Array<string>;
  origins: Array<string>;
};

type AirportsConnection = { [key: string]: AirportConnectionData };

@Injectable()
export class FlightDutyService {
  constructor(
    private flightDutyRepository: FlightDutyRepository,
    private flightService: FlightService,
    private routeService: RouteService,
    private aircraftService: AircraftService,
  ) {}
  readonly DEFAULT_EXPIRATION_DAYS = 30;

  async generateFlightDuty(user: OmitUser, params: GenerateFlightDutyDto) {
    console.log('params.aircraft', params.aircraft);
    const isUserAvailableToCreateFlightDuty =
      await this.isUserAvailableToCreateFlightDuty(user.id);

    if (!isUserAvailableToCreateFlightDuty) {
      throw new HttpException(
        {
          error: `You cannot create a new flight duty while you have a pending one`,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const numberOfFlights =
      params.numberOfFlights < 2 ? 2 : params.numberOfFlights;

    const HUB = 'SBGR';
    const randomAircraft = await this.aircraftService.getRandomAircraft({
      where: {
        ...(params.aircraft?.length
          ? { aircraftModel: { code: { in: params.aircraft } } }
          : {}),
        active: true,
      },
    });

    //  Will slipt the flightDuty in segments
    const segments = this.createRouteInSegments(numberOfFlights, HUB);

    const filters: FilterCriteria = {
      aircraft: params.aircraft,
    };

    await this.addRoutesOnSegments(segments, HUB, filters);

    console.log('segments', segments[0]);

    if (segments.some((s) => s.numberOfFlights == 0)) {
      throw new InternalServerErrorException(
        createErrorResponse('Unable to add routes'),
      );
    }

    const flightDuty = segments.map((segment) => segment.route);

    const createdAt = dayjs();
    const expirationDate = createdAt.add(this.DEFAULT_EXPIRATION_DAYS, 'day');

    const flightDutyToCreate: Prisma.FlightDutyCreateArgs['data'] = {
      createdAt: createdAt.toDate(),
      expirationDate: expirationDate.toDate(),
      userId: user.id,
      aircraftRegistration: randomAircraft.registration,
    };

    const routes: RouteSegment[] = [];
    flightDuty.forEach((segment) =>
      segment.forEach((route) => routes.push(route)),
    );

    console.log('flightDuty', flightDuty);

    if (routes.length === 0) {
      console.error('No routes pushed', routes);
      throw new InternalServerErrorException(
        createErrorResponse('No routes found'),
      );
    }

    const routeIds = (
      await this.flightService.sampleRoutesFromRoutesSegments(
        routes,
        filters.aircraft,
      )
    ).map(({ id }) => id);

    console.log('routeIds', routeIds);

    if (routeIds.length == 0) {
      return console.error('Não foi encontrado rotas');
    }

    await this.flightDutyRepository.createFlightDuty(
      flightDutyToCreate,
      routeIds,
      user.id,
    );

    return { flightDuty };
  }

  async getFlightDuties(data: Prisma.FlightDutyFindManyArgs) {
    return this.flightDutyRepository.getFlightDuties(data);
  }

  async getFlightDutyByUserId(userId: number) {
    const flightDuty =
      await this.flightDutyRepository.getUnfinishedFlightDutyByUserId(userId);
    if (!flightDuty) return {};
    return flightDuty;
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

  private async getAirportConnectionsGraph(filters: FilterCriteria) {
    const airportsConnections: AirportsConnection = {};
    let routes: Array<Route> = [];
    routes = await this.routeService.getRoutes({
      where: {
        available: true,
        ...(filters.aircraft?.length > 0
          ? { aircraft_model_code: { in: filters.aircraft } }
          : {}),
      },
    });

    console.log('filters.aircraft', filters.aircraft);
    console.log('Rotas', routes);

    if (routes.length == 0) {
      throw new HttpException(
        'Não existem rotas disponíveis',
        HttpStatus.BAD_REQUEST,
      );
    }

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
    filterCriteria?: Omit<FilterCriteria, 'aircraft'>;
  }) {
    const possibleRoutes: string[] = [];
    const excludeAirports = filterCriteria?.excludeAirports || [];
    const onlyDestinations = filterCriteria?.onlyDestinations || [];
    const { destinations } = airportConnectionData;

    this.filterDestinations({
      destinations,
      excludeAirports,
      onlyDestinations,
    }).forEach((destination) => {
      if (previousRoute)
        possibleRoutes.push(`${previousRoute} - ${destination}`);
      else possibleRoutes.push(`${departureICAO} - ${destination}`);
    });

    return possibleRoutes;
  }

  private filterDestinations(params: {
    excludeAirports: string[] | undefined;
    onlyDestinations: string[] | undefined;
    destinations: string[];
  }) {
    let filteredDestinations = params.destinations;

    const applyExcludeAirports = () => {
      filteredDestinations = filteredDestinations.filter((destination) => {
        return params.excludeAirports.includes(destination);
      });
    };

    const applyOnlyDestinations = () => {
      filteredDestinations = filteredDestinations.filter((destination) => {
        return params.onlyDestinations.includes(destination);
      });
    };

    params.excludeAirports.length > 0 ? applyExcludeAirports() : true;
    params.onlyDestinations.length > 0 ? applyOnlyDestinations() : true;

    return filteredDestinations;
  }

  private async addRoutesOnSegments(
    flightSegments: FlightSegmentClass[],
    HUB: string,
    filters: FilterCriteria,
  ) {
    const airportsConnections = await this.getAirportConnectionsGraph(filters);
    console.log('airportsConnections', airportsConnections);

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

      if (allPossibleRoutesForThisSegment.length == 0) {
        throw new InternalServerErrorException(
          createErrorResponse('No routes for this filters'),
        );
      }

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

          if (possibleNextRoutes.length == 0) {
            throw new InternalServerErrorException(
              createErrorResponse('No possible routes for this filters'),
            );
          }

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

  private async isUserAvailableToCreateFlightDuty(userId: number) {
    const response =
      await this.flightDutyRepository.getUnfinishedFlightDutyByUserId(userId);

    return response == null;
  }

  async closeFlightDuty(flightDutyId: number) {
    return this.flightDutyRepository.closeFlightDuty(flightDutyId);
  }

  async closeFlight(user: User, flightId: number, flightDutyId: number) {
    const flightDuty =
      await this.flightDutyRepository.getFlightDutyById(flightDutyId);

    if (flightDuty.userId != user.id) return null;

    const currentFlight = flightDuty.flights.find((f) => !f.isClosed);

    if (currentFlight.id != flightId) {
      throw new ConflictException(
        `The flight ID ${flightId} does not correspond to the current flight.`,
      );
    }

    const isCurrentFlightTheLastOne =
      flightDuty.flights.length == currentFlight.index + 1;

    await this.flightService.closeFlightById(flightId);

    if (isCurrentFlightTheLastOne) {
      await this.closeFlightDuty(flightDutyId);
    }

    return await this.flightService.closeFlightById(flightId);
  }

  private getCurrentFlightFromFlightDuty() {}
}
