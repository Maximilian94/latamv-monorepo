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
import { ExamTemplateService } from '../services/exam-template.service';
import { CreateExamTemplateDto } from '../dto/create-exam-template.dto';
import { UpdateExamTemplateDto } from '../dto/update-exam-template.dto';
import { ExamTemplateResponseDto } from '../dto/exam-template-response.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('exam-templates')
@UseGuards(AuthGuard)
export class ExamTemplateController {
  constructor(private readonly examTemplateService: ExamTemplateService) {}

  @Post()
  create(
    @Body() createExamTemplateDto: CreateExamTemplateDto,
  ): Promise<ExamTemplateResponseDto> {
    return this.examTemplateService.create(createExamTemplateDto);
  }

  @Get()
  findAll(): Promise<ExamTemplateResponseDto[]> {
    return this.examTemplateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ExamTemplateResponseDto> {
    return this.examTemplateService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExamTemplateDto: UpdateExamTemplateDto,
  ): Promise<ExamTemplateResponseDto> {
    return this.examTemplateService.update(+id, updateExamTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.examTemplateService.remove(+id);
  }
}
