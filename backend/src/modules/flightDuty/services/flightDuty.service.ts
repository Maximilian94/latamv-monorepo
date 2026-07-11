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
  minEet?: number;
  maxEet?: number;
};

/** Prisma `where` fragment for a per-leg EET (minutes) range; empty if open. */
function eetWhere(minEet?: number, maxEet?: number) {
  const eet: { gte?: number; lte?: number } = {};
  if (typeof minEet === 'number' && !Number.isNaN(minEet)) eet.gte = minEet;
  if (typeof maxEet === 'number' && !Number.isNaN(maxEet)) eet.lte = maxEet;
  return Object.keys(eet).length ? { eet } : {};
}

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

  // Neo variants are their OWN AircraftModel code (A20N/A21N), but routes are
  // only registered under the base model (A320/A321). So aircraft are matched
  // by the selected code as-is, while route sampling uses the base code.
  private static readonly ROUTE_BASE_CODE: Record<string, string> = {
    A18N: 'A318',
    A19N: 'A319',
    A20N: 'A320',
    A21N: 'A321',
  };

  private parseAircraftSelection(entries: string[] | string = []) {
    // A single selected aircraft arrives as a bare string query param, not an
    // array — normalise so we never iterate a string char-by-char.
    const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
    const aircraftCodes = new Set<string>();
    const routeCodes = new Set<string>();
    for (const entry of list) {
      aircraftCodes.add(entry);
      routeCodes.add(FlightDutyService.ROUTE_BASE_CODE[entry] ?? entry);
    }
    return {
      aircraftCodes: [...aircraftCodes],
      routeCodes: [...routeCodes],
    };
  }

  async generateFlightDuty(user: OmitUser, params: GenerateFlightDutyDto) {
    const isUserAvailableToCreateFlightDuty =
      await this.isUserAvailableToCreateFlightDuty(user.id);

    if (!isUserAvailableToCreateFlightDuty) {
      throw new HttpException(
        {
          message:
            'Você já tem uma escala aberta. Conclua-a ou use "Sair da escala" antes de gerar uma nova.',
        },
        HttpStatus.CONFLICT,
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

    // Aircraft are matched by their own code (incl. neo A20N/A21N); routes use
    // the base model code, which is where routes are registered.
    const { aircraftCodes, routeCodes } = this.parseAircraftSelection(
      params.aircraft,
    );

    const randomAircraft = await this.aircraftService.getRandomAircraft({
      where: {
        ...(aircraftCodes.length
          ? { aircraftModelCode: { in: aircraftCodes } }
          : {}),
        active: true,
      },
    });

    if (!randomAircraft) {
      throw new HttpException(
        {
          message:
            'Nenhuma aeronave ativa disponível para a seleção. Tente outra variante (ex.: CEO em vez de NEO) ou selecione outro modelo.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    //  Will slipt the flightDuty in segments
    const segments = this.createRouteInSegments(numberOfFlights, HUB);

    const filters: FilterCriteria = {
      aircraft: routeCodes,
      minEet: params.minEet,
      maxEet: params.maxEet,
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

    const sampledRoutes =
      await this.flightService.sampleRoutesFromRoutesSegments(
        routes,
        filters.aircraft,
        userSubsidiaryIcaoCode,
        { min: filters.minEet, max: filters.maxEet },
      );
    // A leg with no concrete route in range samples to `undefined` — drop those.
    const routeIds = sampledRoutes
      .filter((route): route is Route => Boolean(route))
      .map((route) => route.id);

    // If any leg couldn't be filled, fail loudly instead of silently returning
    // 200 with no duty (which left the user with no feedback at all).
    if (routeIds.length < routes.length) {
      throw new HttpException(
        {
          message:
            'Não foi possível montar a escala completa com os filtros escolhidos. Amplie a faixa de tempo de voo ou troque o modelo da aeronave e tente novamente.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.flightDutyRepository.createFlightDuty(
      flightDutyToCreate,
      routeIds,
      user.id,
    );

    return { flightDuty };
  }

  // Abandon the user's open duty without flying it. Mirrors normal completion
  // (isClosed = true), so the pilot can immediately generate a fresh duty.
  async leaveFlightDuty(userId: number) {
    const open =
      await this.flightDutyRepository.getUnfinishedFlightDutyByUserId(userId);
    if (!open) {
      throw new HttpException(
        { error: 'You have no open flight duty to leave' },
        HttpStatus.NOT_FOUND,
      );
    }
    return this.flightDutyRepository.closeFlightDuty(open.id);
  }

  // Selectable aircraft variants with the live count of active airframes, so the
  // generator shows "A320 NEO · 17 available" and disables empty variants.
  async getAircraftOptions() {
    const VARIANTS: {
      code: string;
      model: string;
      label: string;
      neo: boolean;
    }[] = [
      { code: 'A319', model: 'A319', label: 'A319', neo: false },
      { code: 'A320', model: 'A320', label: 'A320 CEO', neo: false },
      { code: 'A20N', model: 'A320', label: 'A320 NEO', neo: true },
      { code: 'A321', model: 'A321', label: 'A321 CEO', neo: false },
      { code: 'A21N', model: 'A321', label: 'A321 NEO', neo: true },
    ];

    return Promise.all(
      VARIANTS.map(async (v) => ({
        code: v.code,
        model: v.model,
        label: v.label,
        neo: v.neo,
        // Each variant is its own AircraftModel code (incl. neo A20N/A21N).
        count: await this.prisma.aircraft.count({
          where: { active: true, aircraftModelCode: v.code },
        }),
      })),
    );
  }

  // Real min/max route EET (raw units) for the selected model, so the generator
  // slider is bounded by data that actually exists instead of guessed minutes.
  async getEetBounds(aircraft?: string[] | string) {
    const { routeCodes } = this.parseAircraftSelection(aircraft ?? []);
    const agg = await this.prisma.route.aggregate({
      where: {
        available: true,
        ...(routeCodes.length
          ? { aircraft_model_code: { in: routeCodes } }
          : {}),
      },
      _min: { eet: true },
      _max: { eet: true },
    });
    return { min: agg._min.eet ?? 0, max: agg._max.eet ?? 0 };
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
      ...eetWhere(filters.minEet, filters.maxEet),
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
      const hasEetRange =
        filters.minEet != null || filters.maxEet != null;
      const message = hasEetRange
        ? 'Nenhuma rota disponível para os filtros escolhidos. Amplie a faixa de tempo de voo ou troque o modelo da aeronave.'
        : userSubsidiaryIcaoCode
          ? `Nenhuma rota disponível para a sua filial (${userSubsidiaryIcaoCode}). Tente outro modelo de aeronave.`
          : 'Nenhuma rota disponível para o modelo selecionado. Tente outro modelo de aeronave.';
      throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
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
