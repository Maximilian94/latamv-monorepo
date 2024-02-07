export type CGNARoutes = Flight[];

export interface Flight {
  weekday: string;
  flight_number: string;
  aircraft_model_code: string;
  departure_icao: string;
  eobt: string;
  speed: string;
  flight_level: string;
  route: string;
  arrival_icao: string;
  eet: string;
  rmk: string;
}
