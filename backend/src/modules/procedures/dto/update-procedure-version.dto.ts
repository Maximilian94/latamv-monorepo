import { PartialType } from '@nestjs/mapped-types';
import { CreateProcedureVersionDto } from './create-procedure-version.dto';

export class UpdateProcedureVersionDto extends PartialType(
  CreateProcedureVersionDto,
) {}
