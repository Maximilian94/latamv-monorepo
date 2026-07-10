import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateProcedureVersionDto {
  @IsString()
  aircraftModelCode: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  passingScore?: number;

  @IsOptional()
  @IsInt()
  weightStd?: number;

  @IsOptional()
  @IsInt()
  weightExc?: number;

  @IsOptional()
  @IsInt()
  weightDev?: number;

  @IsOptional()
  @IsInt()
  weightCmp?: number;
}
