import { IsNumber, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsNumber()
  examQuestionId: number;

  @IsNumber()
  selectedAlternativeId: number;

  @IsOptional()
  @IsNumber()
  timeSpent?: number; // Time spent on this question in seconds
}
