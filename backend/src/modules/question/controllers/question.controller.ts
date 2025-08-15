import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { QuestionResponseDto } from '../dto/question-response.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('questions')
@UseGuards(AuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  create(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.create(createQuestionDto);
  }

  @Get()
  findAll(
    @Query('tagId') tagId?: string,
    @Query('isActive') isActive?: string,
    @Query('difficulty') difficulty?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<QuestionResponseDto[]> {
    const options: any = {};

    if (tagId) options.tagId = +tagId;
    if (isActive !== undefined) options.isActive = isActive === 'true';
    if (difficulty) options.difficulty = +difficulty;
    if (skip) options.skip = +skip;
    if (take) options.take = +take;

    return this.questionService.findAll(options);
  }

  @Get('random')
  findRandom(
    @Query('tagIds') tagIds: string,
    @Query('count') count: string,
  ): Promise<QuestionResponseDto[]> {
    const tagIdsArray = tagIds.split(',').map((id) => +id);
    return this.questionService.findRandomByTags(tagIdsArray, +count);
  }

  @Get('count/:tagId')
  countByTag(@Param('tagId') tagId: string): Promise<number> {
    return this.questionService.countByTag(+tagId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QuestionResponseDto> {
    return this.questionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionService.update(+id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.questionService.remove(+id);
  }
}
