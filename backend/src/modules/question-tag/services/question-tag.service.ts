import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { QuestionTagRepository } from '../repositories/question-tag.repository';
import { CreateQuestionTagDto } from '../dto/create-question-tag.dto';
import { UpdateQuestionTagDto } from '../dto/update-question-tag.dto';
import { QuestionTagResponseDto } from '../dto/question-tag-response.dto';

@Injectable()
export class QuestionTagService {
  constructor(private readonly questionTagRepository: QuestionTagRepository) {}

  async create(createQuestionTagDto: CreateQuestionTagDto): Promise<QuestionTagResponseDto> {
    // Check if tag with same name already exists
    const existingTag = await this.questionTagRepository.findByName(createQuestionTagDto.name);
    if (existingTag) {
      throw new ConflictException(`Question tag with name "${createQuestionTagDto.name}" already exists`);
    }

    const questionTag = await this.questionTagRepository.create(createQuestionTagDto);
    return this.mapToResponseDto(questionTag);
  }

  async findAll(): Promise<QuestionTagResponseDto[]> {
    const questionTags = await this.questionTagRepository.findAll();
    return questionTags.map(tag => this.mapToResponseDto(tag));
  }

  async findOne(id: number): Promise<QuestionTagResponseDto> {
    const questionTag = await this.questionTagRepository.findOne(id);
    if (!questionTag) {
      throw new NotFoundException(`Question tag with ID ${id} not found`);
    }
    return this.mapToResponseDto(questionTag);
  }

  async update(id: number, updateQuestionTagDto: UpdateQuestionTagDto): Promise<QuestionTagResponseDto> {
    // Check if tag exists
    const existingTag = await this.questionTagRepository.findOne(id);
    if (!existingTag) {
      throw new NotFoundException(`Question tag with ID ${id} not found`);
    }

    // If name is being updated, check for conflicts
    if (updateQuestionTagDto.name && updateQuestionTagDto.name !== existingTag.name) {
      const tagWithSameName = await this.questionTagRepository.findByName(updateQuestionTagDto.name);
      if (tagWithSameName) {
        throw new ConflictException(`Question tag with name "${updateQuestionTagDto.name}" already exists`);
      }
    }

    const updatedTag = await this.questionTagRepository.update(id, updateQuestionTagDto);
    return this.mapToResponseDto(updatedTag);
  }

  async remove(id: number): Promise<void> {
    // Check if tag exists
    const existingTag = await this.questionTagRepository.findOne(id);
    if (!existingTag) {
      throw new NotFoundException(`Question tag with ID ${id} not found`);
    }

    // Check if tag has questions
    const questionCount = await this.questionTagRepository.countQuestionsByTag(id);
    if (questionCount > 0) {
      throw new ConflictException(`Cannot delete tag with ${questionCount} questions. Remove or reassign questions first.`);
    }

    await this.questionTagRepository.remove(id);
  }

  private mapToResponseDto(questionTag: any): QuestionTagResponseDto {
    return {
      id: questionTag.id,
      name: questionTag.name,
      description: questionTag.description,
      color: questionTag.color,
      createdAt: questionTag.createdAt,
      updatedAt: questionTag.updatedAt,
    };
  }
}
