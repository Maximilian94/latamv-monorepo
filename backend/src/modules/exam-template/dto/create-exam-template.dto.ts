import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamTemplateTagDto {
  @IsNumber()
  questionTagId: number;

  @IsNumber()
  @Min(1)
  questionCount: number;
}

export class CreateExamTemplateDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  questionCount: number;

  @IsNumber()
  @Min(1)
  timeLimit: number; // Time limit in minutes

  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore: number; // Minimum score to pass (0-100)

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExamTemplateTagDto)
  examTemplateTags: CreateExamTemplateTagDto[];
}
