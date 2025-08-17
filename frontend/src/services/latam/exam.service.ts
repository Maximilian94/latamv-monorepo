import { api } from '../api';

// Types
export interface QuestionTag {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAlternative {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  tagId: number;
  tagName: string;
  statement: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  difficulty: number;
  isActive: boolean;
  alternatives: QuestionAlternative[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamTemplateTag {
  questionTagId: number;
  questionTagName: string;
  questionCount: number;
}

export interface ExamTemplate {
  id: number;
  title: string;
  description?: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  examTemplateTags: ExamTemplateTag[];
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestionAlternative {
  id: number;
  text: string;
  isCorrect: boolean;
  selectedByUser: boolean;
  order: number;
}

export interface ExamQuestion {
  id: number;
  statement: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  difficulty: number;
  tagName: string;
  order: number;
  timeSpent?: number;
  alternatives: ExamQuestionAlternative[];
}

export interface Exam {
  id: number;
  examTemplateId: number;
  examTemplateTitle: string;
  userId: number;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  isPassed?: boolean;
  timeSpent?: number;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
  questionCount: number;
  answeredCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDetail extends Exam {
  examQuestions: ExamQuestion[];
}

export interface ExamStats {
  totalExams: number;
  finishedExams: number;
  passedExams: number;
  passRate: number;
  averageScore: number;
}

// Question Tags
export const getQuestionTags = () => api.get<QuestionTag[]>('/question-tags');
export const createQuestionTag = (data: { name: string; description?: string; color?: string }) =>
  api.post<QuestionTag>('/question-tags', data);
export const updateQuestionTag = (id: number, data: { name?: string; description?: string; color?: string }) =>
  api.patch<QuestionTag>(`/question-tags/${id}`, data);
export const deleteQuestionTag = (id: number) => api.delete(`/question-tags/${id}`);

// Questions
export const getQuestions = (params?: {
  tagId?: number;
  tagIds?: number[];
  isActive?: boolean;
  difficulty?: number;
  skip?: number;
  take?: number;
}) => {
  const { tagIds, ...otherParams } = params || {};
  const queryParams: Record<string, string | number | boolean> = { ...otherParams };
  
  // Convert tagIds array to comma-separated string for query params
  if (tagIds && tagIds.length > 0) {
    queryParams.tagIds = tagIds.join(',');
  }
  
  return api.get<Question[]>('/questions', { params: queryParams });
};
export const getRandomQuestions = (tagIds: number[], count: number) =>
  api.get<Question[]>('/questions/random', { params: { tagIds: tagIds.join(','), count } });
export const createQuestion = (data: {
  tagId: number;
  statement: string;
  imageUrl?: string;
  videoUrl?: string;
  explanation?: string;
  difficulty?: number;
  isActive?: boolean;
  alternatives: Array<{ text: string; isCorrect: boolean }>;
}) => api.post<Question>('/questions', data);
export const updateQuestion = (id: number, data: Question) => api.patch<Question>(`/questions/${id}`, data);
export const deleteQuestion = (id: number) => api.delete(`/questions/${id}`);

// Exam Templates
export const getExamTemplates = () => api.get<ExamTemplate[]>('/exam-templates');
export const getExamTemplateWithQuestions = (id: number) => api.get<ExamTemplate>(`/exam-templates/${id}/with-questions`);
export const createExamTemplate = (data: {
  title: string;
  description?: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  isActive?: boolean;
  examTemplateTags?: Array<{ questionTagId: number; questionCount: number }>;
}) => api.post<ExamTemplate>('/exam-templates', data);
export const updateExamTemplate = (id: number, data: ExamTemplate) => api.patch<ExamTemplate>(`/exam-templates/${id}`, data);
export const deleteExamTemplate = (id: number) => api.delete(`/exam-templates/${id}`);

// Exams
export const startExam = (data: { examTemplateId: number }) => api.post<ExamDetail>('/exams/start', data);
export const submitAnswer = (examId: number, data: { examQuestionId: number; selectedAlternativeId: number; timeSpent?: number }) =>
  api.post(`/exams/${examId}/answer`, data);
export const finishExam = (examId: number, data?: { timeSpent?: number }) => api.post<ExamDetail>(`/exams/${examId}/finish`, data);
export const abandonExam = (examId: number) => api.post(`/exams/${examId}/abandon`);
export const getExams = (params?: { status?: string; skip?: number; take?: number }) =>
  api.get<Exam[]>('/exams', { params });
export const getExamInProgress = () => api.get<ExamDetail | null>('/exams/in-progress');
export const getExamStats = () => api.get<ExamStats>('/exams/stats');
export const getExamDetail = (id: number) => api.get<ExamDetail>(`/exams/${id}`);
