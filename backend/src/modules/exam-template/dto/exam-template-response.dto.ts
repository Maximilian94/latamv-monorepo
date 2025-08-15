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
  createdAt: Date;
  updatedAt: Date;
}
