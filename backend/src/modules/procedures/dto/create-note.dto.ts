import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { NoteKind } from '@prisma/client';

export class CreateNoteDto {
  @IsInt()
  checklistItemId: number;

  @IsEnum(NoteKind)
  kind: NoteKind;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
