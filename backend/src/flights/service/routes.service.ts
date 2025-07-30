import { Injectable } from '@nestjs/common';
import { FlightAwareService } from './flightaware.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { isEmpty, isEqual, pickBy } from 'lodash';
import { Route } from '@prisma/client';

export interface updateRoutesDataBaseResponse {
  routesUpdated: any[];
  routesAdded: any[];
  routesDeleted: any[];
}

@Injectable()
export class RoutesService {
  constructor(
    private flightAwareService: FlightAwareService,
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
    this.resetUpdateRoutesDataBaseResponse();

    try {
      // Get updatedRoutes from FlightAware
      const updatedRoutesFromFlightAware =
        await this.flightAwareService.getLATAMFlights();
      const routesFromDatabase: Route[] = await this.prisma.route.findMany();

      for (const flightAwareRoute of updatedRoutesFromFlightAware) {
        const routeFound = await this.prisma.route.findMany({
          where: {
            flight_number: flightAwareRoute.flight_number,
            departure_icao: flightAwareRoute.departure_icao,
            arrival_icao: flightAwareRoute.arrival_icao,
          },
        });

        if (routeFound.length == 1) {
          await this.updateFlightIfNeeded({
            updatedRoute: flightAwareRoute,
            databaseRoute: routeFound[0],
          });
        }

        if (routeFound.length == 0) {
          await this.addFlightIfNeeded({ newRoute: flightAwareRoute });
        }

        if (routeFound.length > 1) {
          console.log('Achou mais de uma rota', routeFound, flightAwareRoute);
        }
      }

      await this.deleteFlightsIfNeeded({
        routesFromDatabase,
        updatedRoutesFromFlightAware,
      });

      return this.updateRoutesDataBaseResponse;
    } catch (error) {
      console.error('Error updating routes from FlightAware:', error);
      return this.updateRoutesDataBaseResponse;
    }
  }

  async updateFlightIfNeeded({
    updatedRoute,
    databaseRoute,
  }: {
    updatedRoute: any;
    databaseRoute: Route;
  }) {
    const dataToUpdate = pickBy(updatedRoute, (value, key) => {
      return !isEqual(value, databaseRoute[key]);
    });

    if (!isEmpty(dataToUpdate)) {
      const flightUpdated = await this.prisma.route.update({
        data: dataToUpdate,
        where: { flight_number: databaseRoute.flight_number },
      });

      const oldData = {};

      Object.keys(dataToUpdate).map((key) => {
        oldData[key] = databaseRoute[key];
      });

      this.updateRoutesDataBaseResponse.routesUpdated.push({
        flight_number: flightUpdated.flight_number,
        weekday: flightUpdated.weekday,
        oldData,
        newData: dataToUpdate,
      });
    }
  }

  async addFlightIfNeeded({ newRoute }: { newRoute: any }) {
    const flightAdded = await this.prisma.route.create({
      data: { ...newRoute },
    });

    this.updateRoutesDataBaseResponse.routesAdded.push({
      flight_number: flightAdded.flight_number,
      weekday: flightAdded.weekday,
      data: flightAdded,
    });
  }

  async deleteFlightsIfNeeded({
    routesFromDatabase,
    updatedRoutesFromFlightAware,
  }: {
    routesFromDatabase: Route[];
    updatedRoutesFromFlightAware: any[];
  }) {
    const updatedRoutesMap = new Map(
      updatedRoutesFromFlightAware.map((route) => [route.flight_number, route]),
    );
    const routesToDelete = routesFromDatabase.filter(
      (dbRoute) => !updatedRoutesMap.has(dbRoute.flight_number),
    );

    for (const route of routesToDelete) {
      await this.prisma.route.delete({
        where: { flight_number: route.flight_number },
      });
      this.updateRoutesDataBaseResponse.routesDeleted.push({
        flight_number: route.flight_number,
        weekday: route.weekday,
      });
    }
  }
}
