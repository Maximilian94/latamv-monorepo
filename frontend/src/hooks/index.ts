// Auth hooks
export { useAuth } from './useAuth';

// Exam hooks
export { 
  useExamTemplates,
  useExamTemplate,
  useCreateExamTemplate,
  useUpdateExamTemplate,
  useDeleteExamTemplate
} from './exam/useExamTemplates';

export {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion
} from './exam/useQuestions';

export {
  useQuestionTags,
  useCreateQuestionTag,
  useUpdateQuestionTag,
  useDeleteQuestionTag
} from './exam/useQuestionTags';

export {
  useExams,
  useExam,
  useStartExam,
  useSubmitAnswer,
  useFinishExam,
  useAbandonExam
} from './exam/useExams';
