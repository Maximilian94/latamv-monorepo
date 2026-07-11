import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuestionTagController } from './controllers/question-tag.controller';
import { QuestionTagService } from './services/question-tag.service';
import { QuestionTagRepository } from './repositories/question-tag.repository';
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
  controllers: [QuestionTagController],
  providers: [QuestionTagService, QuestionTagRepository],
  exports: [QuestionTagService],
})
export class QuestionTagModule {}
