export class QuestionAlternativeResponseDto {
  id: number;
  text: string;
  isCorrect: boolean;
}

export class QuestionResponseDto {
  id: number;
  tagId: number;
  tagName: string;
  statement: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  difficulty: number;
  isActive: boolean;
  alternatives: QuestionAlternativeResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
