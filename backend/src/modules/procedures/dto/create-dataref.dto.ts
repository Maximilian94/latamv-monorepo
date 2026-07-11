import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateDatarefDto {
  @IsInt()
  packageId: number;

  @IsString()
  alias: string;

  @IsString()
  datarefName: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  valueType?: string;

  @IsOptional()
  @IsInt()
  arrayIndex?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
