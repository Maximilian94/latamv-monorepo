import { QuestionResponseDto } from '../../question/dto/question-response.dto';

export class ExamTemplateTagResponseDto {
  questionTagId: number;
  questionTagName: string;
  questionCount: number;
}

export class ExamTemplateResponseDto {
  id: number;
  title: string;
  description?: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  examTemplateTags: ExamTemplateTagResponseDto[];
  questions?: QuestionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
