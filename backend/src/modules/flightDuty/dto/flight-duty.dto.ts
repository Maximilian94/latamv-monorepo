import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
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

/**
 * Desktop ACARS "Submit Flight" payload. Unlike {@link CloseFlightDto}, events
 * are NOT sent here — the desktop app streams them live via POST /flight/:id/events
 * throughout the flight, so re-sending them on submit would create duplicates.
 * The backend finalizes the flight, computes the score, and closes the duty.
 * OOOI marks are optional: the desktop stamps whichever phase transitions it
 * observed; any missing mark defaults to the ACARS end time.
 */
export class SubmitFlightDto {
  @IsNotEmpty()
  @IsNumber()
  flightId: number;

  @IsNotEmpty()
  @IsNumber()
  flightDutyId: number;

  @IsNotEmpty()
  @IsString()
  startAcarsTime: string;

  @IsNotEmpty()
  @IsString()
  endAcarsTime: string;

  @IsOptional()
  @IsString()
  OUT?: string;

  @IsOptional()
  @IsString()
  OFF?: string;

  @IsOptional()
  @IsString()
  ON?: string;

  @IsOptional()
  @IsString()
  IN?: string;
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
