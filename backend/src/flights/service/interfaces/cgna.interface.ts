export type CGNARoutes = FlightInfo[];

interface FlightInfo {
  day: string;
  company: string;
  aircraft: string;
  departure: string;
  departureTime: string;
  speed: string;
  flightLevel: string;
  route: string;
  arrival: string;
  eet: string;
  rmk: string;
}
