import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExamController } from './controllers/exam.controller';
import { ExamService } from './services/exam.service';
import { ExamRepository } from './repositories/exam.repository';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { ExamTemplateModule } from '../exam-template/exam-template.module';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    ExamTemplateModule,
    QuestionModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExamController],
  providers: [ExamService, ExamRepository],
  exports: [ExamService],
})
export class ExamModule {}
