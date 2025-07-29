import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateBaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class AddAirportDto {
  @IsNotEmpty()
  @IsString()
  airportCode: string;
}

export class BaseResponseDto {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  baseAirports?: Array<{
    id: number;
    airportCode: string;
    createdAt: Date;
  }>;
} 