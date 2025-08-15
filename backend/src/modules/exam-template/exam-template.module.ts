import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExamTemplateController } from './controllers/exam-template.controller';
import { ExamTemplateService } from './services/exam-template.service';
import { ExamTemplateRepository } from './repositories/exam-template.repository';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExamTemplateController],
  providers: [ExamTemplateService, ExamTemplateRepository],
  exports: [ExamTemplateService],
})
export class ExamTemplateModule {}
