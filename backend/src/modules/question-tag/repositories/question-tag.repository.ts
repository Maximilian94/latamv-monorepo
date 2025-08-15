import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateQuestionTagDto } from '../dto/create-question-tag.dto';
import { UpdateQuestionTagDto } from '../dto/update-question-tag.dto';

@Injectable()
export class QuestionTagRepository {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionTagDto: CreateQuestionTagDto) {
    return this.prisma.questionTag.create({
      data: createQuestionTagDto,
    });
  }

  async findAll() {
    return this.prisma.questionTag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.questionTag.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.questionTag.findUnique({
      where: { name },
    });
  }

  async update(id: number, updateQuestionTagDto: UpdateQuestionTagDto) {
    return this.prisma.questionTag.update({
      where: { id },
      data: updateQuestionTagDto,
    });
  }

  async remove(id: number) {
    return this.prisma.questionTag.delete({
      where: { id },
    });
  }

  async countQuestionsByTag(tagId: number) {
    return this.prisma.question.count({
      where: { tagId, isActive: true },
    });
  }
}
