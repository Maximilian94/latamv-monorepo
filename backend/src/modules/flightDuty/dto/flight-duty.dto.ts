import { IsNotEmpty } from 'class-validator';

export class CloseFlightDto {
  @IsNotEmpty()
  flightId: string;

  @IsNotEmpty()
  flightDutyId: string;
}
