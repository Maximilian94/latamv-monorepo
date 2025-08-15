import { IsString, IsNumber, IsOptional, IsBoolean, IsUrl, Min, Max } from 'class-validator';

export class CreateQuestionAlternativeDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsNumber()
  tagId: number;

  @IsString()
  statement: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  alternatives: CreateQuestionAlternativeDto[];
}
