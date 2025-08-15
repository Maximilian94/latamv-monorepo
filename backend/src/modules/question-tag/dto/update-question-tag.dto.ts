import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionTagDto } from './create-question-tag.dto';

export class UpdateQuestionTagDto extends PartialType(CreateQuestionTagDto) {}
