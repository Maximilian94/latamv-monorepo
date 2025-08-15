import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionRepository } from '../repositories/question.repository';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { QuestionResponseDto, QuestionAlternativeResponseDto } from '../dto/question-response.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly questionRepository: QuestionRepository) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<QuestionResponseDto> {
    // Validate that at least one alternative is correct
    const correctAlternatives = createQuestionDto.alternatives.filter(alt => alt.isCorrect);
    if (correctAlternatives.length !== 1) {
      throw new BadRequestException('Question must have exactly one correct alternative');
    }

    // Validate that there are at least 2 alternatives
    if (createQuestionDto.alternatives.length < 2) {
      throw new BadRequestException('Question must have at least 2 alternatives');
    }

    const question = await this.questionRepository.create(createQuestionDto);
    return this.mapToResponseDto(question);
  }

  async findAll(options?: {
    tagId?: number;
    isActive?: boolean;
    difficulty?: number;
    skip?: number;
    take?: number;
  }): Promise<QuestionResponseDto[]> {
    const questions = await this.questionRepository.findAll(options);
    return questions.map(question => this.mapToResponseDto(question));
  }

  async findOne(id: number): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return this.mapToResponseDto(question);
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionResponseDto> {
    // Check if question exists
    const existingQuestion = await this.questionRepository.findOne(id);
    if (!existingQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // If alternatives are being updated, validate them
    if (updateQuestionDto.alternatives) {
      const correctAlternatives = updateQuestionDto.alternatives.filter(alt => alt.isCorrect);
      if (correctAlternatives.length !== 1) {
        throw new BadRequestException('Question must have exactly one correct alternative');
      }

      if (updateQuestionDto.alternatives.length < 2) {
        throw new BadRequestException('Question must have at least 2 alternatives');
      }
    }

    const updatedQuestion = await this.questionRepository.update(id, updateQuestionDto);
    return this.mapToResponseDto(updatedQuestion);
  }

  async remove(id: number): Promise<void> {
    const existingQuestion = await this.questionRepository.findOne(id);
    if (!existingQuestion) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    await this.questionRepository.remove(id);
  }

  async findRandomByTags(tagIds: number[], count: number): Promise<QuestionResponseDto[]> {
    if (tagIds.length === 0) {
      throw new BadRequestException('At least one tag must be provided');
    }

    if (count <= 0) {
      throw new BadRequestException('Count must be greater than 0');
    }

    const questions = await this.questionRepository.findRandomByTags(tagIds, count);
    return questions.map(question => this.mapToResponseDto(question));
  }

  async countByTag(tagId: number): Promise<number> {
    return this.questionRepository.countByTag(tagId);
  }

  private mapToResponseDto(question: any): QuestionResponseDto {
    return {
      id: question.id,
      tagId: question.tagId,
      tagName: question.tag.name,
      statement: question.statement,
      imageUrl: question.imageUrl,
      videoUrl: question.videoUrl,
      explanation: question.explanation,
      difficulty: question.difficulty,
      isActive: question.isActive,
      alternatives: question.alternatives.map((alt: any) => ({
        id: alt.id,
        text: alt.text,
        isCorrect: alt.isCorrect,
      })),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}
