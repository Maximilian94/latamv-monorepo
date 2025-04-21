import { IsNotEmpty } from 'class-validator';

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
}

export class GenerateFlightDutyDto {
  @IsNotEmpty()
  aircraft: Array<string>;

  @IsNotEmpty()
  numberOfFlights: number;
}
