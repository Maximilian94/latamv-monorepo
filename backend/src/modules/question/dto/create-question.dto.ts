import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsUrl({}, { message: 'imageUrl must be a valid URL address' })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'videoUrl must be a valid URL address' })
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionAlternativeDto)
  alternatives: CreateQuestionAlternativeDto[];
}
