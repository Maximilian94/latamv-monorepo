import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';
import { ValidationRuleType } from '@prisma/client';

export class CreateRuleDto {
  @IsString()
  eventId: string;

  @IsEnum(ValidationRuleType)
  type: ValidationRuleType;

  @IsString()
  phase: string;

  @IsArray()
  @IsString({ each: true })
  aliases: string[];

  @IsString()
  expr: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  details?: any;
}
