export type CGNARoutes = Flight[];

export interface Flight {
  aircraft_model_code: string;
  departure_icao: string;
  eobt: string;
  arrival_icao: string;
  eet: string;
}
