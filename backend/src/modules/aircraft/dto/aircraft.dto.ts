import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAircraftDto {
  @IsNotEmpty()
  @IsString()
  registration: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsNotEmpty()
  @IsString()
  aircraftModelCode: string;
}

export class UpdateAircraftDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsString()
  aircraftModelCode?: string;
}
