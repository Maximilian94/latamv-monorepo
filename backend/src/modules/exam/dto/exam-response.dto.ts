export class ExamQuestionAlternativeResponseDto {
  id: number;
  text: string;
  isCorrect: boolean;
  selectedByUser: boolean;
  order: number;
}

export class ExamQuestionResponseDto {
  id: number;
  statement: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  difficulty: number;
  tagName: string;
  order: number;
  timeSpent?: number;
  alternatives: ExamQuestionAlternativeResponseDto[];
}

export class ExamResponseDto {
  id: number;
  examTemplateId: number;
  examTemplateTitle: string;
  userId: number;
  startedAt: Date;
  finishedAt?: Date;
  score?: number;
  isPassed?: boolean;
  timeSpent?: number;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
  questionCount: number;
  answeredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ExamDetailResponseDto extends ExamResponseDto {
  examQuestions: ExamQuestionResponseDto[];
}
