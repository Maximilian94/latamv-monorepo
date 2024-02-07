import { Injectable } from '@nestjs/common';
import { CGNAService } from './cgna.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { isEmpty, isEqual, pickBy } from 'lodash';
import { Flight } from './interfaces/cgna.interface';
import { Route } from '@prisma/client';

export interface updateRoutesDataBaseResponse {
  flightsUpdated: any[];
}

@Injectable()
export class RoutesService {
  constructor(
    private cgnaService: CGNAService,
    private prisma: PrismaService,
  ) {}

  updateRoutesDataBaseResponse = {
    flightsUpdated: [],
    flightsAdded: [],
  };

  resetUpdateRoutesDataBaseResponse() {
    this.updateRoutesDataBaseResponse.flightsUpdated = [];
    this.updateRoutesDataBaseResponse.flightsAdded = [];
  }

  async updateRoutesDataBase(): Promise<updateRoutesDataBaseResponse> {
    console.log('Começou------');
    this.resetUpdateRoutesDataBaseResponse();
    //  Get updatedRoutes from CGNA formated
    //  Check what routes will be deleted
    //  Update/Create the rest

    const updatedRoutesFromCGNA = await this.cgnaService.getCGNARoutes();
    // const routesFromDatabase = await this.prisma.route.findMany();

    for (const CGNARoute of updatedRoutesFromCGNA) {
      // console.log('CGNARoute', CGNARoute);
      const routeFound = await this.prisma.route.findMany({
        where: {
          flight_number: CGNARoute.flight_number,
          weekday: CGNARoute.weekday,
          departure_icao: CGNARoute.departure_icao,
          arrival_icao: CGNARoute.arrival_icao,
        },
      });

      if (routeFound.length == 1) {
        await this.updateFlightIfNeeded({
          updatedRoute: CGNARoute,
          databaseRoute: routeFound[0],
        });
      }

      if (routeFound.length == 0) {
        await this.addFlightIfNeeded({ newRoute: CGNARoute });
      }

      if (routeFound.length > 1) {
        console.log('Achou mais de uma rota', routeFound, CGNARoute);
      }
    }

    return this.updateRoutesDataBaseResponse;
  }

  async updateFlightIfNeeded({
    updatedRoute,
    databaseRoute,
  }: {
    updatedRoute: Flight;
    databaseRoute: Route;
  }) {
    const dataToUpdate = pickBy(updatedRoute, (value, key) => {
      return !isEqual(value, databaseRoute[key]);
    });

    if (!isEmpty(dataToUpdate)) {
      const flightUpdated = await this.prisma.route.update({
        data: dataToUpdate,
        where: { id: databaseRoute.id },
      });

      const oldData = {};

      Object.keys(dataToUpdate).map((key) => {
        oldData[key] = databaseRoute[key];
      });

      this.updateRoutesDataBaseResponse.flightsUpdated.push({
        id: flightUpdated.id,
        weekday: flightUpdated.weekday,
        flight_number: flightUpdated.flight_number,
        oldData,
        newData: dataToUpdate,
      });
    }
  }

  async addFlightIfNeeded({ newRoute }: { newRoute: Flight }) {
    const flightAdded = await this.prisma.route.create({
      data: { ...newRoute, route_status_id: '' },
    });

    this.updateRoutesDataBaseResponse.flightsAdded.push({
      id: flightAdded.id,
      weekday: flightAdded.weekday,
      flight_number: flightAdded.flight_number,
      data: flightAdded,
    });
  }
}
