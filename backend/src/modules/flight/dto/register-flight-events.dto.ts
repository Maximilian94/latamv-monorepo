import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterFlightEventDto {
  @IsString()
  eventId: string;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  details?: any;
}

export class RegisterFlightEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegisterFlightEventDto)
  events: RegisterFlightEventDto[];
}
