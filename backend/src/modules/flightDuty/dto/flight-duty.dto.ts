import { IsNotEmpty } from 'class-validator';
import { FlightEvent } from '@prisma/client';

export class CloseFlightDto {
  @IsNotEmpty()
  flightId: number;

  @IsNotEmpty()
  flightDutyId: number;

  @IsNotEmpty()
  OFF: string;

  @IsNotEmpty()
  OUT: string;

  @IsNotEmpty()
  IN: string;

  @IsNotEmpty()
  ON: string;

  @IsNotEmpty()
  endAcarsTime: string;

  @IsNotEmpty()
  startAcarsTime: string;

  @IsNotEmpty()
  events: FlightEvent[];
}

export class GenerateFlightDutyDto {
  @IsNotEmpty()
  aircraft: Array<string>;

  @IsNotEmpty()
  numberOfFlights: number;
}
