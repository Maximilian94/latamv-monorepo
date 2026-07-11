import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { QuestionTagService } from '../services/question-tag.service';
import { CreateQuestionTagDto } from '../dto/create-question-tag.dto';
import { UpdateQuestionTagDto } from '../dto/update-question-tag.dto';
import { QuestionTagResponseDto } from '../dto/question-tag-response.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('question-tags')
@UseGuards(AuthGuard)
export class QuestionTagController {
  constructor(private readonly questionTagService: QuestionTagService) {}

  @Post()
  create(
    @Body() createQuestionTagDto: CreateQuestionTagDto,
  ): Promise<QuestionTagResponseDto> {
    return this.questionTagService.create(createQuestionTagDto);
  }

  @Get()
  findAll(): Promise<QuestionTagResponseDto[]> {
    return this.questionTagService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuestionTagResponseDto> {
    return this.questionTagService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionTagDto: UpdateQuestionTagDto,
  ): Promise<QuestionTagResponseDto> {
    return this.questionTagService.update(+id, updateQuestionTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.questionTagService.remove(+id);
  }
}
