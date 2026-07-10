import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSubPhaseDto {
  @IsInt()
  phaseId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
