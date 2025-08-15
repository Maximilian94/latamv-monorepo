import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateQuestionTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
