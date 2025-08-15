import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ExamRepository } from '../repositories/exam.repository';
import { ExamTemplateService } from '../../exam-template/services/exam-template.service';
import { QuestionService } from '../../question/services/question.service';
import { StartExamDto } from '../dto/start-exam.dto';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { FinishExamDto } from '../dto/finish-exam.dto';
import {
  ExamResponseDto,
  ExamDetailResponseDto,
} from '../dto/exam-response.dto';
import { ExamStatus } from '@prisma/client';

@Injectable()
export class ExamService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly examTemplateService: ExamTemplateService,
    private readonly questionService: QuestionService,
  ) {}

  async startExam(
    userId: number,
    startExamDto: StartExamDto,
  ): Promise<ExamDetailResponseDto> {
    // Check if user has an exam in progress
    const existingExam = await this.examRepository.findInProgressByUser(userId);
    if (existingExam) {
      throw new ConflictException(
        'You already have an exam in progress. Please finish it before starting a new one.',
      );
    }

    // Get exam template
    const examTemplate = await this.examTemplateService.findOne(
      startExamDto.examTemplateId,
    );
    if (!examTemplate.isActive) {
      throw new BadRequestException('This exam template is not active.');
    }

    // Get questions for each tag according to the template configuration
    const examTemplateTags = examTemplate.examTemplateTags;
    const selectedQuestions = [];

    for (const templateTag of examTemplateTags) {
      const questions = await this.questionService.findRandomByTags(
        [templateTag.questionTagId],
        templateTag.questionCount,
      );
      selectedQuestions.push(...questions);
    }

    // Shuffle questions to randomize order
    const shuffledQuestions = this.shuffleArray(selectedQuestions);

    // Create exam
    const exam = await this.examRepository.create({
      examTemplateId: startExamDto.examTemplateId,
      userId,
    });

    // Create immutable copies of questions and alternatives
    for (let i = 0; i < shuffledQuestions.length; i++) {
      const question = shuffledQuestions[i];

      // Create exam question (immutable copy)
      const examQuestion = await this.examRepository.createExamQuestion({
        examId: exam.id,
        questionId: question.id,
        statement: question.statement,
        imageUrl: question.imageUrl,
        videoUrl: question.videoUrl,
        explanation: question.explanation,
        difficulty: question.difficulty,
        tagName: question.tagName,
        order: i + 1,
      });

      // Shuffle alternatives and create immutable copies
      const shuffledAlternatives = this.shuffleArray(question.alternatives);
      await this.examRepository.createExamQuestionAlternatives(
        examQuestion.id,
        shuffledAlternatives.map((alt: any, index) => ({
          text: alt.text,
          isCorrect: alt.isCorrect,
          order: index + 1, // A=1, B=2, C=3, D=4
        })),
      );
    }

    // Return the created exam with questions
    return this.findOne(exam.id);
  }

  async submitAnswer(
    userId: number,
    examId: number,
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<void> {
    // Get exam and verify ownership
    const exam = await this.examRepository.findOne(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }
    if (exam.userId !== userId) {
      throw new BadRequestException(
        'You can only submit answers to your own exams.',
      );
    }
    if (exam.status !== ExamStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Cannot submit answers to a finished exam.',
      );
    }

    // Find the exam question
    const examQuestion = exam.examQuestions.find(
      (q) => q.id === submitAnswerDto.examQuestionId,
    );
    if (!examQuestion) {
      throw new NotFoundException('Question not found in this exam.');
    }

    // Find the selected alternative
    const selectedAlternative = examQuestion.examQuestionAlternatives.find(
      (alt) => alt.id === submitAnswerDto.selectedAlternativeId,
    );
    if (!selectedAlternative) {
      throw new NotFoundException('Selected alternative not found.');
    }

    // Clear previous selections for this question
    for (const alternative of examQuestion.examQuestionAlternatives) {
      await this.examRepository.updateExamQuestionAlternative(alternative.id, {
        selectedByUser: false,
      });
    }

    // Mark the selected alternative
    await this.examRepository.updateExamQuestionAlternative(
      submitAnswerDto.selectedAlternativeId,
      { selectedByUser: true },
    );

    // Update time spent on question if provided
    if (submitAnswerDto.timeSpent !== undefined) {
      await this.examRepository.updateExamQuestion(examQuestion.id, {
        timeSpent: submitAnswerDto.timeSpent,
      });
    }
  }

  async finishExam(
    userId: number,
    examId: number,
    finishExamDto: FinishExamDto,
  ): Promise<ExamDetailResponseDto> {
    // Get exam and verify ownership
    const exam = await this.examRepository.findOne(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }
    if (exam.userId !== userId) {
      throw new BadRequestException('You can only finish your own exams.');
    }
    if (exam.status !== ExamStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam is already finished.');
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = exam.examQuestions.length;

    for (const examQuestion of exam.examQuestions) {
      const selectedAlternative = examQuestion.examQuestionAlternatives.find(
        (alt) => alt.selectedByUser,
      );
      if (selectedAlternative && selectedAlternative.isCorrect) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= exam.examTemplate.passingScore;

    // Update exam
    await this.examRepository.update(examId, {
      status: ExamStatus.FINISHED,
      finishedAt: new Date(),
      score,
      isPassed,
      timeSpent: finishExamDto.timeSpent,
    });

    return this.findOne(examId);
  }

  async findOne(id: number): Promise<ExamDetailResponseDto> {
    const exam = await this.examRepository.findOne(id);
    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    return this.mapToDetailResponseDto(exam);
  }

  async findByUser(
    userId: number,
    options?: {
      status?: ExamStatus;
      skip?: number;
      take?: number;
    },
  ): Promise<ExamResponseDto[]> {
    const exams = await this.examRepository.findByUser(userId, options);
    return exams.map((exam) => this.mapToResponseDto(exam));
  }

  async findInProgress(userId: number): Promise<ExamDetailResponseDto | null> {
    const exam = await this.examRepository.findInProgressByUser(userId);
    return exam ? this.mapToDetailResponseDto(exam) : null;
  }

  async abandonExam(userId: number, examId: number): Promise<void> {
    const exam = await this.examRepository.findOne(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }
    if (exam.userId !== userId) {
      throw new BadRequestException('You can only abandon your own exams.');
    }
    if (exam.status !== ExamStatus.IN_PROGRESS) {
      throw new BadRequestException('Only exams in progress can be abandoned.');
    }

    await this.examRepository.update(examId, {
      status: ExamStatus.ABANDONED,
      finishedAt: new Date(),
    });
  }

  async getStats(userId: number) {
    return this.examRepository.getExamStats(userId);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private mapToResponseDto(exam: any): ExamResponseDto {
    const answeredCount =
      exam.examQuestions?.filter((q: any) =>
        q.examQuestionAlternatives?.some((alt: any) => alt.selectedByUser),
      ).length || 0;

    return {
      id: exam.id,
      examTemplateId: exam.examTemplateId,
      examTemplateTitle: exam.examTemplate.title,
      userId: exam.userId,
      startedAt: exam.startedAt,
      finishedAt: exam.finishedAt,
      score: exam.score,
      isPassed: exam.isPassed,
      timeSpent: exam.timeSpent,
      status: exam.status,
      questionCount: exam.examTemplate.questionCount,
      answeredCount,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    };
  }

  private mapToDetailResponseDto(exam: any): ExamDetailResponseDto {
    const baseResponse = this.mapToResponseDto(exam);

    return {
      ...baseResponse,
      examQuestions:
        exam.examQuestions?.map((q: any) => ({
          id: q.id,
          statement: q.statement,
          imageUrl: q.imageUrl,
          videoUrl: q.videoUrl,
          explanation: q.explanation,
          difficulty: q.difficulty,
          tagName: q.tagName,
          order: q.order,
          timeSpent: q.timeSpent,
          alternatives:
            q.examQuestionAlternatives?.map((alt: any) => ({
              id: alt.id,
              text: alt.text,
              isCorrect: alt.isCorrect,
              selectedByUser: alt.selectedByUser,
              order: alt.order,
            })) || [],
        })) || [],
    };
  }
}
