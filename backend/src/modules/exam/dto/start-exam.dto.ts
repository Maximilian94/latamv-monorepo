import { IsNumber } from 'class-validator';

export class StartExamDto {
  @IsNumber()
  examTemplateId: number;
}
