export interface RouteSegment {
  departure: string;
  arrival: string;
}

interface FlightSegmentParams {
  numberOfFlights: number;
  departure?: string;
  arrival?: string;
  route?: Array<RouteSegment>;
}

export class FlightSegment {
  public numberOfFlights: number;
  public departure: string;
  public arrival: string;
  public route: RouteSegment[];

  constructor({
    numberOfFlights,
    departure = null,
    arrival = null,
    route = [],
  }: FlightSegmentParams) {
    this.numberOfFlights = numberOfFlights;
    this.departure = departure;
    this.arrival = arrival;
    this.route = route;
  }
}
