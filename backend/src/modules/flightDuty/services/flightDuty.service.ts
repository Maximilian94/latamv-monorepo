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
import { Prisma, User, Route, FlightEvent } from '@prisma/client';
import { AircraftService } from 'src/modules/aircraft/services/aircraft.service';
import { createErrorResponse } from '../../../common/utils/error-response.util';
import { GenerateFlightDutyDto } from '../dto/flight-duty.dto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { EventService } from '../../event/services/event.service';
import { BaseService } from '../../base/services/base.service';

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
    private prisma: PrismaService,
    private eventService: EventService,
    private baseService: BaseService,
  ) {}
  readonly DEFAULT_EXPIRATION_DAYS = 30;

  async generateFlightDuty(user: OmitUser, params: GenerateFlightDutyDto) {
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

    // Get user's base or use default HUB
    let HUB = 'SBGR'; // Default HUB

    if (user.baseId) {
      const userBase = await this.baseService.getBaseById(user.baseId);
      if (userBase && userBase.baseAirports.length > 0) {
        // Get a random airport from the user's base
        const randomAirport = await this.baseService.getRandomAirportFromBase(
          user.baseId,
        );

        if (randomAirport) {
          HUB = randomAirport;
        }
      }
    }

    // Get user's subsidiary ICAO code
    let userSubsidiaryIcaoCode: string | undefined;
    if (user.subsidiaryId) {
      const userSubsidiary = await this.prisma.subsidiary.findUnique({
        where: { id: user.subsidiaryId },
        select: { icaoCode: true },
      });
      userSubsidiaryIcaoCode = userSubsidiary?.icaoCode;
    }

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

    await this.addRoutesOnSegments(
      segments,
      HUB,
      filters,
      userSubsidiaryIcaoCode,
    );

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
        userSubsidiaryIcaoCode,
      )
    ).map(({ id }) => id);

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

  private async getAirportConnectionsGraph(
    filters: FilterCriteria,
    userSubsidiaryIcaoCode?: string,
  ) {
    const airportsConnections: AirportsConnection = {};
    let routes: Array<Route> = [];

    // Build the where clause for route filtering
    const whereClause: any = {
      available: true,
      ...(filters.aircraft?.length > 0
        ? { aircraft_model_code: { in: filters.aircraft } }
        : {}),
    };

    // Add subsidiary filter if user has a subsidiary
    if (userSubsidiaryIcaoCode) {
      whereClause.ident_icao = {
        startsWith: userSubsidiaryIcaoCode,
      };
    }

    routes = await this.routeService.getRoutes({
      where: whereClause,
    });

    if (routes.length == 0) {
      const errorMessage = userSubsidiaryIcaoCode
        ? `No routes available for subsidiary ${userSubsidiaryIcaoCode}`
        : 'No routes available';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
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

  private getRoutesFromDeparture({
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
        // Exclui os aeroportos presentes na lista excludeAirports
        return !params.excludeAirports.includes(destination);
      });
    };

    const applyOnlyDestinations = () => {
      filteredDestinations = filteredDestinations.filter((destination) => {
        // Mantém apenas os aeroportos presentes na lista onlyDestinations
        return params.onlyDestinations.includes(destination);
      });
    };

    // Aplica os filtros se as listas existirem e não forem vazias
    if (params.excludeAirports?.length > 0) {
      applyExcludeAirports();
    }

    if (params.onlyDestinations?.length > 0) {
      applyOnlyDestinations();
    }

    return filteredDestinations;
  }

  private async addRoutesOnSegments(
    flightSegments: FlightSegmentClass[],
    HUB: string,
    filters: FilterCriteria,
    userSubsidiaryIcaoCode?: string,
  ) {
    const airportsConnections = await this.getAirportConnectionsGraph(
      filters,
      userSubsidiaryIcaoCode,
    );

    const addRoutes = async ({ segmentIndex }: { segmentIndex: number }) => {
      const currentSegment = flightSegments[segmentIndex];
      let nextSegment: FlightSegmentClass = null;
      const isFirstSegment = segmentIndex == 0;
      const isLastSegment = segmentIndex == flightSegments.length - 1;

      if (isFirstSegment) currentSegment.departure = HUB;
      if (isLastSegment) currentSegment.arrival = HUB;
      if (!isLastSegment) nextSegment = flightSegments[segmentIndex + 1];

      let allPossibleRoutesForThisSegment: string[] =
        this.getRoutesFromDeparture({
          departureICAO: currentSegment.departure,
          airportConnectionData: airportsConnections[currentSegment.departure],
          previousRoute: '',
        });

      if (allPossibleRoutesForThisSegment.length == 0) {
        throw new InternalServerErrorException(
          createErrorResponse('No possible routes for this filters'),
        );
      }

      for (let i = 1; i < currentSegment.numberOfFlights; i++) {
        const isLastFlight = currentSegment.numberOfFlights == i + 1;

        //  Routes that can be used to complete the 'circle'
        const validRoutesForThisSegment: string[] = [];

        try {
          allPossibleRoutesForThisSegment.forEach((currentFlightDuty) => {
            const departureForNextLeg = last(
              currentFlightDuty.split('-'),
            ).trim();

            const possibleNextRoutes = this.getRoutesFromDeparture({
              departureICAO: departureForNextLeg,
              airportConnectionData: airportsConnections[departureForNextLeg],
              previousRoute: currentFlightDuty,
              filterCriteria: {
                onlyDestinations:
                  isLastFlight && isLastSegment ? [HUB] : undefined,
              },
            });

            if (possibleNextRoutes.length == 0) {
              console.log(
                `Não é possivel chegar a ${HUB} partindo de ${departureForNextLeg}`,
              );
            }

            validRoutesForThisSegment.push(...possibleNextRoutes);
          });
        } catch (error) {
          console.error('Error in route generation:', error.message);
          throw new InternalServerErrorException(
            createErrorResponse('Route generation failed.'),
          );
        }

        allPossibleRoutesForThisSegment = validRoutesForThisSegment;
      }

      if (allPossibleRoutesForThisSegment.length) {
        currentSegment.route = this.parseRoute(
          sample(allPossibleRoutesForThisSegment),
        );
        currentSegment.arrival =
          currentSegment.route[currentSegment.route.length - 1].arrival;
        if (nextSegment) {
          nextSegment.departure = currentSegment.arrival;
          await addRoutes({ segmentIndex: segmentIndex + 1 });
        }
      }
    };

    await addRoutes({ segmentIndex: 0 });
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

  async closeFlight(
    user: User,
    flightId: number,
    flightDutyId: number,
    OFF: string,
    OUT: string,
    IN: string,
    ON: string,
    endAcarsTime: string,
    startAcarsTime: string,
  ) {
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

    await this.flightService.finishFlightById({
      flightId,
      OFF: new Date(OFF),
      OUT: new Date(OUT),
      IN: new Date(IN),
      ON: new Date(ON),
      endAcarsTime: new Date(endAcarsTime),
      startAcarsTime: new Date(startAcarsTime),
    });

    if (isCurrentFlightTheLastOne) {
      await this.closeFlightDuty(flightDutyId);
    }

    return await this.flightService.finishFlightById({
      flightId,
      OFF: new Date(OFF),
      OUT: new Date(OUT),
      IN: new Date(IN),
      ON: new Date(ON),
      endAcarsTime: new Date(endAcarsTime),
      startAcarsTime: new Date(startAcarsTime),
    });
  }

  async closeFlightV2(
    user: User,
    flightData: {
      flightId: number;
      flightDutyId: number;
      OFF: string;
      OUT: string;
      IN: string;
      ON: string;
      endAcarsTime: string;
      startAcarsTime: string;
      events: FlightEvent[];
    },
  ) {
    const flightDutyFromFlightData =
      await this.flightDutyRepository.getFlightDutyById(
        flightData.flightDutyId,
      );

    if (flightDutyFromFlightData.userId != user.id) {
      throw new ConflictException('Flight from another user');
    }

    if (flightDutyFromFlightData.isClosed) {
      throw new ConflictException('Flight Duty is already closed');
    }

    const currentFlight = flightDutyFromFlightData.flights.find(
      (f) => !f.isClosed,
    );

    if (currentFlight.id != flightData.flightId) {
      throw new ConflictException('Flight is not the current one');
    }

    const isCurrentFlightTheLastOne =
      flightDutyFromFlightData.flights.length == currentFlight.index + 1;

    try {
      await this.prisma.$transaction(async () => {
        await this.flightService.finishFlightById({
          flightId: flightData.flightId,
          OFF: new Date(flightData.OFF),
          OUT: new Date(flightData.OUT),
          IN: new Date(flightData.IN),
          ON: new Date(flightData.ON),
          endAcarsTime: new Date(flightData.endAcarsTime),
          startAcarsTime: new Date(flightData.startAcarsTime),
        });

        await this.eventService.registerManyFlightEvents(flightData.events);

        if (isCurrentFlightTheLastOne) {
          await this.closeFlightDuty(flightData.flightDutyId);
        }
      });
      return { success: true, message: 'Voo registrado e fechado com sucesso' };
    } catch (error) {
      console.error('Erro na transação:', error);
      return { success: false, message: 'Falha ao processar o voo' };
    }
  }

  getCurrentFlightDutyFromUser() {}

  async hasOpenFlightDuty(userId: number): Promise<boolean> {
    const openFlightDuty = await this.prisma.flightDuty.findFirst({
      where: {
        userId,
        isClosed: false,
      },
    });

    return !!openFlightDuty;
  }
}
