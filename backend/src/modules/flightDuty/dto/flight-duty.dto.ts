import { IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

  // Per-leg flight-time (EET) range, in minutes. Each generated leg's route
  // must have an eet within [minEet, maxEet]. Both optional (open-ended).
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minEet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxEet?: number;
}
