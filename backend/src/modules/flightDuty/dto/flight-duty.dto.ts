import { IsNotEmpty } from 'class-validator';

export class CloseFlightDto {
  @IsNotEmpty()
  flightId: string;

  @IsNotEmpty()
  flightDutyId: string;
}

export class GenerateFlightDutyDto {
  @IsNotEmpty()
  aircraft: Array<string>;

  @IsNotEmpty()
  numberOfFlights: number;
}
