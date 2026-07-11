import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsInt()
  checklistItemId: number;

  @IsString()
  name: string;

  @IsInt()
  severityId: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
