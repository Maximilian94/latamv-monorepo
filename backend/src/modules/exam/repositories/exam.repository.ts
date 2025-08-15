import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ExamStatus } from '@prisma/client';

@Injectable()
export class ExamRepository {
  constructor(private prisma: PrismaService) {}

  async create(examData: { examTemplateId: number; userId: number }) {
    return this.prisma.exam.create({
      data: examData,
      include: {
        examTemplate: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.exam.findUnique({
      where: { id },
      include: {
        examTemplate: true,
        examQuestions: {
          include: {
            examQuestionAlternatives: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findByUser(
    userId: number,
    options?: {
      status?: ExamStatus;
      skip?: number;
      take?: number;
    },
  ) {
    const where: any = { userId };
    if (options?.status) where.status = options.status;

    return this.prisma.exam.findMany({
      where,
      include: {
        examTemplate: true,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInProgressByUser(userId: number) {
    return this.prisma.exam.findFirst({
      where: {
        userId,
        status: ExamStatus.IN_PROGRESS,
      },
      include: {
        examTemplate: true,
        examQuestions: {
          include: {
            examQuestionAlternatives: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.exam.update({
      where: { id },
      data,
      include: {
        examTemplate: true,
      },
    });
  }

  async createExamQuestion(examQuestionData: {
    examId: number;
    questionId: number;
    statement: string;
    imageUrl?: string;
    videoUrl?: string;
    explanation?: string;
    difficulty: number;
    tagName: string;
    order: number;
  }) {
    return this.prisma.examQuestion.create({
      data: examQuestionData,
    });
  }

  async createExamQuestionAlternatives(
    examQuestionId: number,
    alternatives: Array<{
      text: string;
      isCorrect: boolean;
      order: number;
    }>,
  ) {
    return this.prisma.examQuestionAlternative.createMany({
      data: alternatives.map((alt) => ({
        examQuestionId,
        text: alt.text,
        isCorrect: alt.isCorrect,
        order: alt.order,
      })),
    });
  }

  async updateExamQuestionAlternative(
    id: number,
    data: { selectedByUser?: boolean },
  ) {
    return this.prisma.examQuestionAlternative.update({
      where: { id },
      data,
    });
  }

  async updateExamQuestion(id: number, data: { timeSpent?: number }) {
    return this.prisma.examQuestion.update({
      where: { id },
      data,
    });
  }

  async countByUser(userId: number, status?: ExamStatus) {
    const where: any = { userId };
    if (status) where.status = status;

    return this.prisma.exam.count({ where });
  }

  async getExamStats(userId: number) {
    const exams = await this.prisma.exam.findMany({
      where: { userId },
      select: {
        score: true,
        isPassed: true,
        status: true,
      },
    });

    const totalExams = exams.length;
    const finishedExams = exams.filter((e) => e.status === ExamStatus.FINISHED);
    const passedExams = finishedExams.filter((e) => e.isPassed === true);
    const averageScore =
      finishedExams.length > 0
        ? finishedExams.reduce((sum, e) => sum + (e.score || 0), 0) /
          finishedExams.length
        : 0;

    return {
      totalExams,
      finishedExams: finishedExams.length,
      passedExams: passedExams.length,
      passRate:
        finishedExams.length > 0
          ? (passedExams.length / finishedExams.length) * 100
          : 0,
      averageScore: Math.round(averageScore),
    };
  }
}
