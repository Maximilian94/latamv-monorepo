import { IsNotEmpty } from 'class-validator';

export class CloseFlightDto {
  @IsNotEmpty()
  flightId: string;
  flightDutyId: string;
}
