import { Injectable } from '@nestjs/common';
import { CGNAService } from './cgna.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { isEmpty, isEqual, pickBy } from 'lodash';
import { Flight } from './interfaces/cgna.interface';
import { Route } from '@prisma/client';

export interface updateRoutesDataBaseResponse {
  routesUpdated: any[];
  routesAdded: any[];
  routesDeleted: any[];
}

@Injectable()
export class RoutesService {
  constructor(
    private cgnaService: CGNAService,
    private prisma: PrismaService,
  ) {}

  updateRoutesDataBaseResponse = {
    routesUpdated: [],
    routesAdded: [],
    routesDeleted: [],
  };

  resetUpdateRoutesDataBaseResponse() {
    this.updateRoutesDataBaseResponse.routesUpdated = [];
    this.updateRoutesDataBaseResponse.routesAdded = [];
    this.updateRoutesDataBaseResponse.routesDeleted = [];
  }

  async updateRoutesDataBase(): Promise<updateRoutesDataBaseResponse> {
    console.log('Começou------');
    this.resetUpdateRoutesDataBaseResponse();
    //  Get updatedRoutes from CGNA formated
    //  Check what routes will be deleted
    //  Update/Create the rest

    const updatedRoutesFromCGNA = await this.cgnaService.getCGNARoutes();
    const routesFromDatabase: Route[] = await this.prisma.route.findMany();

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

    await this.deleteFlightsIfNeeded({
      routesFromDatabase,
      updatedRoutesFromCGNA,
    });

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

      this.updateRoutesDataBaseResponse.routesUpdated.push({
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

    this.updateRoutesDataBaseResponse.routesAdded.push({
      id: flightAdded.id,
      weekday: flightAdded.weekday,
      flight_number: flightAdded.flight_number,
      data: flightAdded,
    });
  }

  async deleteFlightsIfNeeded({
    routesFromDatabase,
    updatedRoutesFromCGNA,
  }: {
    routesFromDatabase: Route[];
    updatedRoutesFromCGNA: Flight[];
  }) {
    const updatedRoutesMap = new Map(
      updatedRoutesFromCGNA.map((route) => [route.flight_number, route]),
    );
    const routesToDelete = routesFromDatabase.filter(
      (dbRoute) => !updatedRoutesMap.has(dbRoute.flight_number),
    );

    for (const route of routesToDelete) {
      await this.prisma.route.delete({ where: { id: route.id } });
      this.updateRoutesDataBaseResponse.routesDeleted.push({
        id: route.id,
        weekday: route.weekday,
        flight_number: route.flight_number,
      });
    }
  }
}
