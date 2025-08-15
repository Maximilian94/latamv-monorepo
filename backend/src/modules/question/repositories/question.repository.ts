import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';

@Injectable()
export class QuestionRepository {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto) {
    const { alternatives, ...questionData } = createQuestionDto;

    return this.prisma.question.create({
      data: {
        ...questionData,
        alternatives: {
          create: alternatives,
        },
      },
      include: {
        tag: true,
        alternatives: true,
      },
    });
  }

  async findAll(options?: {
    tagId?: number;
    tagIds?: number[];
    isActive?: boolean;
    difficulty?: number;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (options?.tagId) {
      where.tagId = options.tagId;
    } else if (options?.tagIds && options.tagIds.length > 0) {
      where.tagId = { in: options.tagIds };
    }

    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.difficulty) where.difficulty = options.difficulty;

    return this.prisma.question.findMany({
      where,
      include: {
        tag: true,
        alternatives: true,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        tag: true,
        alternatives: true,
      },
    });
  }

  async findRandomByTags(tagIds: number[], count: number) {
    // Get questions for each tag
    const questionsByTag = await Promise.all(
      tagIds.map(async (tagId) => {
        const questions = await this.prisma.question.findMany({
          where: { tagId, isActive: true },
          include: {
            tag: true,
            alternatives: true,
          },
        });
        return questions;
      }),
    );

    // Flatten and shuffle all questions
    const allQuestions = questionsByTag.flat();
    const shuffled = this.shuffleArray(allQuestions);

    return shuffled.slice(0, count);
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto) {
    const { alternatives, ...questionData } = updateQuestionDto;

    // If alternatives are provided, replace all existing ones
    if (alternatives) {
      await this.prisma.questionAlternative.deleteMany({
        where: { questionId: id },
      });
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        ...(alternatives && {
          alternatives: {
            create: alternatives,
          },
        }),
      },
      include: {
        tag: true,
        alternatives: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.question.delete({
      where: { id },
    });
  }

  async countByTag(tagId: number) {
    return this.prisma.question.count({
      where: { tagId, isActive: true },
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
