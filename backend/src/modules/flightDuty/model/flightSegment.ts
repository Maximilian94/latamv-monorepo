interface FlightSegmentParams {
  numberOfFlights: number;
  departure?: string;
  arrival?: string;
  route?: string;
}

export class FlightSegment {
  public numberOfFlights: number;
  public departure: string;
  public arrival: string;
  public route: string;

  constructor({
    numberOfFlights,
    departure = null,
    arrival = null,
    route = null,
  }: FlightSegmentParams) {
    this.numberOfFlights = numberOfFlights;
    this.departure = departure;
    this.arrival = arrival;
    this.route = route;
  }
}
