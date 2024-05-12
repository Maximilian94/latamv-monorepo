import { IsNotEmpty } from 'class-validator';

export class CreateAircraftDto {
  @IsNotEmpty()
  registration: string;

  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  engine: string;

  @IsNotEmpty()
  active: boolean;

  @IsNotEmpty()
  aircraftModelCode: string;
}
