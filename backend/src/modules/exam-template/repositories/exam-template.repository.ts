import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateExamTemplateDto } from '../dto/create-exam-template.dto';
import { UpdateExamTemplateDto } from '../dto/update-exam-template.dto';

@Injectable()
export class ExamTemplateRepository {
  constructor(private prisma: PrismaService) {}

  async create(createExamTemplateDto: CreateExamTemplateDto) {
    const { examTemplateTags, ...templateData } = createExamTemplateDto;

    return this.prisma.examTemplate.create({
      data: {
        ...templateData,
        examTemplateTags: {
          create: examTemplateTags,
        },
      },
      include: {
        examTemplateTags: {
          include: {
            questionTag: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.examTemplate.findMany({
      include: {
        examTemplateTags: {
          include: {
            questionTag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.examTemplate.findUnique({
      where: { id },
      include: {
        examTemplateTags: {
          include: {
            questionTag: true,
          },
        },
      },
    });
  }

  async update(id: number, updateExamTemplateDto: UpdateExamTemplateDto) {
    const { examTemplateTags, ...templateData } = updateExamTemplateDto;

    // If examTemplateTags are provided, replace all existing ones
    if (examTemplateTags) {
      await this.prisma.examTemplateTag.deleteMany({
        where: { examTemplateId: id },
      });
    }

    return this.prisma.examTemplate.update({
      where: { id },
      data: {
        ...templateData,
        ...(examTemplateTags && {
          examTemplateTags: {
            create: examTemplateTags,
          },
        }),
      },
      include: {
        examTemplateTags: {
          include: {
            questionTag: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.examTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getTagIdsForTemplate(templateId: number): Promise<number[]> {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      include: {
        examTemplateTags: true,
      },
    });

    if (!template) {
      return [];
    }

    return template.examTemplateTags.map((tag) => tag.questionTagId);
  }

  async getTotalQuestionCount(templateId: number): Promise<number> {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id: templateId },
      include: {
        examTemplateTags: true,
      },
    });

    if (!template) {
      return 0;
    }

    return template.examTemplateTags.reduce(
      (total, tag) => total + tag.questionCount,
      0,
    );
  }
}
