import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePhaseDto {
  @IsInt()
  procedureVersionId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
