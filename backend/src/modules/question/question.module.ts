import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuestionController } from './controllers/question.controller';
import { QuestionService } from './services/question.service';
import { QuestionRepository } from './repositories/question.repository';
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
  controllers: [QuestionController],
  providers: [QuestionService, QuestionRepository],
  exports: [QuestionService],
})
export class QuestionModule {}
