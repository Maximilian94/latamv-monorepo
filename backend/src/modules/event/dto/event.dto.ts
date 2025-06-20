import { IsNotEmpty } from 'class-validator';
export class CreateEventDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  severityId: number;

  @IsNotEmpty()
  reference: string;
}
