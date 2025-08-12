import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateAwardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  description: string;

  @IsString()
  tooltip: string;

  @IsNumber()
  @Min(1)
  @Max(3650) // Max 10 years
  validityDuration: number;
}
