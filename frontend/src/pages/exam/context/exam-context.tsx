import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import React, { createContext, ReactNode } from 'react';
import {
  getExamTemplateWithQuestions,
  getQuestionTags,
  Question,
  QuestionAlternative,
  QuestionTag,
  ExamTemplateTag,
  ExamTemplate,
} from '../../../services/latam/exam.service';

// Types
interface ExamState {
  // State
  currentQuestion: number;
  questions: Question[];
  examTitle: string;
  questionTime: number;
  allQuestionTags: QuestionTag[];
  examQuestionTags: ExamTemplateTag[];
  currentExamTemplate: ExamTemplate | null;
  alternativesSelected: Array<number | undefined>;

  // Actions
  setCurrentQuestion: (question: number) => void;
  setQuestions: (questions: Question[]) => void;
  editQuestion: (question: Question) => void;
  onOptionSelect: (questionId: number, optionId: number) => void;
  updateExamTitle: (title: string) => void;
  updateQuestionTime: (time: number) => void;
  setAllQuestionTags: (tags: QuestionTag[]) => void;
  setExamQuestionTags: (tags: ExamTemplateTag[]) => void;
  setCurrentExamTemplate: (template: ExamTemplate | null) => void;
  setAlternativesSelected: (alternatives: Array<number | undefined>) => void;
  createQuestion: () => void;
  loadExamTemplate: (templateId: number) => Promise<void>;
  loadQuestionTags: () => Promise<void>;
  initializeExam: () => void;
}

// Helper functions
const randomQuestionCreator = (index: number): Question => {
  return {
    id: index,
    statement: `Question ${index + 1}`,
    alternatives: generateRandomAlternatives(),
    difficulty: Math.floor(Math.random() * 3) + 1,
    isActive: true,
    tagId: 0,
    tagName: '',
    imageUrl: '',
    videoUrl: '',
    explanation: '',
    createdAt: '',
    updatedAt: '',
  };
};

const generateRandomAlternatives = (): QuestionAlternative[] => {
  return Array.from({ length: 4 }, (_, index) => ({
    id: index,
    label: `Option ${index + 1}`,
    value: `option_${index + 1}`,
    text: `Option ${index + 1}`,
    isCorrect: index === 0,
  }));
};

// Store
export const useExamStore = create<ExamState>()(
  devtools(
    (set) => ({
      // Initial state
      currentQuestion: 0,
      questions: [],
      examTitle: 'Exam Title',
      questionTime: 0,
      allQuestionTags: [],
      examQuestionTags: [],
      currentExamTemplate: null,
      alternativesSelected: [],

      // Actions
      setCurrentQuestion: (question) =>
        set({ currentQuestion: question }, false, 'setCurrentQuestion'),

      setQuestions: (questions) =>
        set({ questions }, false, 'setQuestions'),

      editQuestion: (question) =>
        set(
          (state) => ({
            questions: state.questions.map((q) =>
              q.id === state.currentQuestion ? question : q
            ),
          }),
          false,
          'editQuestion'
        ),

      onOptionSelect: (questionId, optionId) =>
        set(
          (state) => ({
            questions: state.questions.map((question) =>
              question.id === questionId
                ? { ...question, selectedOption: optionId }
                : question
            ),
          }),
          false,
          'onOptionSelect'
        ),

      updateExamTitle: (title) =>
        set({ examTitle: title }, false, 'updateExamTitle'),

      updateQuestionTime: (time) =>
        set({ questionTime: time }, false, 'updateQuestionTime'),

      setAllQuestionTags: (tags) =>
        set({ allQuestionTags: tags }, false, 'setAllQuestionTags'),

      setExamQuestionTags: (tags) =>
        set({ examQuestionTags: tags }, false, 'setExamQuestionTags'),

      setCurrentExamTemplate: (template) =>
        set({ currentExamTemplate: template }, false, 'setCurrentExamTemplate'),

      setAlternativesSelected: (alternatives) =>
        set({ alternativesSelected: alternatives }, false, 'setAlternativesSelected'),

      createQuestion: () =>
        set(
          (state) => {
            const newQuestion = randomQuestionCreator(state.questions.length);
            return {
              questions: [...state.questions, newQuestion],
              alternativesSelected: [...state.alternativesSelected, undefined],
            };
          },
          false,
          'createQuestion'
        ),

      loadExamTemplate: async (templateId) => {
        try {
          const res = await getExamTemplateWithQuestions(templateId);
          console.log('getExamTemplateWithQuestions', res.data);
          set(
            {
              questions: res.data.questions || [],
              examQuestionTags: res.data.examTemplateTags,
              currentExamTemplate: res.data,
            },
            false,
            'loadExamTemplate'
          );
        } catch (error) {
          console.error('Error loading exam template:', error);
        }
      },

      loadQuestionTags: async () => {
        try {
          const res = await getQuestionTags();
          console.log('getQuestionTags', res.data);
          set({ allQuestionTags: res.data }, false, 'loadQuestionTags');
        } catch (error) {
          console.error('Error loading question tags:', error);
        }
      },

      initializeExam: () => {
        const fakeArray = Array.from({ length: 50 }, (_, index) => index);
        const fakeQuestions = fakeArray.map((index) => randomQuestionCreator(index));
        set(
          {
            questions: fakeQuestions,
            alternativesSelected: fakeArray.map(() => undefined),
          },
          false,
          'initializeExam'
        );
      },
    }),
    {
      name: 'exam-store',
    }
  )
);

// Legacy Context for backward compatibility (if needed)
export const QuestionContext = createContext<{
  currentQuestion: number;
  setCurrentQuestion: (question: number) => void;
  totalQuestions: number;
  questions: Question[];
  onOptionSelect: (questionId: number, optionId: number) => void;
  editQuestion: (question: Question) => void;
  examTitle: string;
  updateExamTitle: (title: string) => void;
  createQuestion: () => void;
  questionTime: number;
  updateQuestionTime: (time: number) => void;
  alternativesSelected: number[];
  setAlternativesSelected: (alternatives: number[]) => void;
  allQuestionTags: QuestionTag[];
  examQuestionTags: ExamTemplateTag[];
  currentExamTemplate: ExamTemplate | null;
}>({
  currentQuestion: 0,
  setCurrentQuestion: () => {},
  totalQuestions: 0,
  questions: [],
  onOptionSelect: () => {},
  editQuestion: () => {},
  examTitle: 'Exam Title',
  updateExamTitle: () => {},
  createQuestion: () => {},
  questionTime: 0,
  updateQuestionTime: () => {},
  alternativesSelected: [],
  setAlternativesSelected: () => {},
  allQuestionTags: [],
  examQuestionTags: [],
  currentExamTemplate: null,
});

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
  const {
    currentQuestion,
    setCurrentQuestion,
    questions,
    onOptionSelect,
    editQuestion,
    examTitle,
    updateExamTitle,
    createQuestion,
    questionTime,
    updateQuestionTime,
    alternativesSelected,
    setAlternativesSelected,
    allQuestionTags,
    examQuestionTags,
    currentExamTemplate,
    loadExamTemplate,
    loadQuestionTags,
    initializeExam,
  } = useExamStore();

  const totalQuestions = questions.length;

  // Initialize data on mount
  React.useEffect(() => {
    initializeExam();
    loadExamTemplate(1);
    loadQuestionTags();
  }, []);

  return (
    <QuestionContext.Provider
      value={{
        currentQuestion,
        setCurrentQuestion,
        totalQuestions,
        questions,
        onOptionSelect,
        editQuestion,
        examTitle,
        updateExamTitle,
        createQuestion,
        questionTime,
        updateQuestionTime,
        alternativesSelected: alternativesSelected as number[],
        setAlternativesSelected: (alternatives: number[]) =>
          setAlternativesSelected(alternatives as Array<number | undefined>),
        allQuestionTags,
        examQuestionTags,
        currentExamTemplate,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};
