import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ExamTemplateRepository } from '../repositories/exam-template.repository';
import { CreateExamTemplateDto } from '../dto/create-exam-template.dto';
import { UpdateExamTemplateDto } from '../dto/update-exam-template.dto';
import { ExamTemplateResponseDto } from '../dto/exam-template-response.dto';
import { QuestionService } from '../../question/services/question.service';

@Injectable()
export class ExamTemplateService {
  constructor(
    private readonly examTemplateRepository: ExamTemplateRepository,
    private readonly questionService: QuestionService,
  ) {}

  async create(
    createExamTemplateDto: CreateExamTemplateDto,
  ): Promise<ExamTemplateResponseDto> {
    // Validate that question count matches the sum of tag question counts
    const totalTagQuestions = createExamTemplateDto.examTemplateTags.reduce(
      (total, tag) => total + tag.questionCount,
      0,
    );

    if (totalTagQuestions !== createExamTemplateDto.questionCount) {
      throw new BadRequestException(
        `Total question count (${createExamTemplateDto.questionCount}) must match the sum of tag question counts (${totalTagQuestions})`,
      );
    }

    // Validate that there are tags
    if (createExamTemplateDto.examTemplateTags.length === 0) {
      throw new BadRequestException('At least one tag must be specified');
    }

    const examTemplate = await this.examTemplateRepository.create(
      createExamTemplateDto,
    );
    return this.mapToResponseDto(examTemplate);
  }

  async findAll(): Promise<ExamTemplateResponseDto[]> {
    const examTemplates = await this.examTemplateRepository.findAll();
    return examTemplates.map((template) => this.mapToResponseDto(template));
  }

  async findOne(id: number): Promise<ExamTemplateResponseDto> {
    const examTemplate = await this.examTemplateRepository.findOne(id);
    if (!examTemplate) {
      throw new NotFoundException(`Exam template with ID ${id} not found`);
    }
    return this.mapToResponseDto(examTemplate);
  }

  async findOneWithQuestions(id: number): Promise<ExamTemplateResponseDto> {
    const examTemplate = await this.examTemplateRepository.findOne(id);
    if (!examTemplate) {
      throw new NotFoundException(`Exam template with ID ${id} not found`);
    }

    // Get all tag IDs from the template
    const tagIds = examTemplate.examTemplateTags.map(
      (tag) => tag.questionTagId,
    );

    // Get questions for all tags
    const questions = await this.questionService.findAll({ tagIds });

    // Map to response DTO and include questions
    const responseDto = this.mapToResponseDto(examTemplate);
    return {
      ...responseDto,
      questions,
    };
  }

  async update(
    id: number,
    updateExamTemplateDto: UpdateExamTemplateDto,
  ): Promise<ExamTemplateResponseDto> {
    // Check if template exists
    const existingTemplate = await this.examTemplateRepository.findOne(id);
    if (!existingTemplate) {
      throw new NotFoundException(`Exam template with ID ${id} not found`);
    }

    // If examTemplateTags are being updated, validate them
    if (updateExamTemplateDto.examTemplateTags) {
      const totalTagQuestions = updateExamTemplateDto.examTemplateTags.reduce(
        (total, tag) => total + tag.questionCount,
        0,
      );

      const questionCount =
        updateExamTemplateDto.questionCount || existingTemplate.questionCount;

      if (totalTagQuestions !== questionCount) {
        throw new BadRequestException(
          `Total question count (${questionCount}) must match the sum of tag question counts (${totalTagQuestions})`,
        );
      }

      if (updateExamTemplateDto.examTemplateTags.length === 0) {
        throw new BadRequestException('At least one tag must be specified');
      }
    }

    const updatedTemplate = await this.examTemplateRepository.update(
      id,
      updateExamTemplateDto,
    );
    return this.mapToResponseDto(updatedTemplate);
  }

  async remove(id: number): Promise<void> {
    const existingTemplate = await this.examTemplateRepository.findOne(id);
    if (!existingTemplate) {
      throw new NotFoundException(`Exam template with ID ${id} not found`);
    }

    await this.examTemplateRepository.remove(id);
  }

  async getTagIdsForTemplate(templateId: number): Promise<number[]> {
    return this.examTemplateRepository.getTagIdsForTemplate(templateId);
  }

  async getTotalQuestionCount(templateId: number): Promise<number> {
    return this.examTemplateRepository.getTotalQuestionCount(templateId);
  }

  private mapToResponseDto(examTemplate: any): ExamTemplateResponseDto {
    return {
      id: examTemplate.id,
      title: examTemplate.title,
      description: examTemplate.description,
      questionCount: examTemplate.questionCount,
      timeLimit: examTemplate.timeLimit,
      passingScore: examTemplate.passingScore,
      isActive: examTemplate.isActive,
      examTemplateTags: examTemplate.examTemplateTags.map((tag: any) => ({
        questionTagId: tag.questionTagId,
        questionTagName: tag.questionTag.name,
        questionCount: tag.questionCount,
      })),
      createdAt: examTemplate.createdAt,
      updatedAt: examTemplate.updatedAt,
    };
  }
}
