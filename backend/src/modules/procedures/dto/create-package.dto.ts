import { IsString, IsOptional } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  code: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
