import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ExamService } from '../services/exam.service';
import { StartExamDto } from '../dto/start-exam.dto';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { FinishExamDto } from '../dto/finish-exam.dto';
import {
  ExamResponseDto,
  ExamDetailResponseDto,
} from '../dto/exam-response.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { GetUser } from '../../../common/decorator/getUser.decorator';
import { ExamStatus } from '@prisma/client';

@Controller('exams')
@UseGuards(AuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('start')
  startExam(
    @GetUser('id') userId: number,
    @Body() startExamDto: StartExamDto,
  ): Promise<ExamDetailResponseDto> {
    return this.examService.startExam(userId, startExamDto);
  }

  @Post(':id/answer')
  submitAnswer(
    @GetUser('id') userId: number,
    @Param('id') examId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ): Promise<void> {
    return this.examService.submitAnswer(userId, +examId, submitAnswerDto);
  }

  @Post(':id/finish')
  finishExam(
    @GetUser('id') userId: number,
    @Param('id') examId: string,
    @Body() finishExamDto: FinishExamDto,
  ): Promise<ExamDetailResponseDto> {
    return this.examService.finishExam(userId, +examId, finishExamDto);
  }

  @Post(':id/abandon')
  abandonExam(
    @GetUser('id') userId: number,
    @Param('id') examId: string,
  ): Promise<void> {
    return this.examService.abandonExam(userId, +examId);
  }

  @Get()
  findByUser(
    @GetUser('id') userId: number,
    @Query('status') status?: ExamStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ExamResponseDto[]> {
    const options: any = {};
    if (status) options.status = status;
    if (skip) options.skip = +skip;
    if (take) options.take = +take;

    return this.examService.findByUser(userId, options);
  }

  @Get('in-progress')
  findInProgress(
    @GetUser('id') userId: number,
  ): Promise<ExamDetailResponseDto | null> {
    return this.examService.findInProgress(userId);
  }

  @Get('stats')
  getStats(@GetUser('id') userId: number) {
    return this.examService.getStats(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ExamDetailResponseDto> {
    return this.examService.findOne(+id);
  }
}
