import { PartialType } from '@nestjs/mapped-types';
import { CreateDatarefDto } from './create-dataref.dto';

export class UpdateDatarefDto extends PartialType(CreateDatarefDto) {}
