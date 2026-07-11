import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { Verifiability, ProcedureItemSource } from '@prisma/client';

export class CreateItemDto {
  @IsInt()
  subPhaseId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(Verifiability)
  verifiability?: Verifiability;

  @IsOptional()
  @IsEnum(ProcedureItemSource)
  source?: ProcedureItemSource;
}
