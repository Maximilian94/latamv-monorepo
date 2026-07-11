import { PartialType } from '@nestjs/mapped-types';
import { CreateSubPhaseDto } from './create-subphase.dto';

export class UpdateSubPhaseDto extends PartialType(CreateSubPhaseDto) {}
