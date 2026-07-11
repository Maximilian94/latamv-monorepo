import { IsNumber, IsOptional } from 'class-validator';

export class FinishExamDto {
  @IsOptional()
  @IsNumber()
  timeSpent?: number; // Total time spent in seconds
}
