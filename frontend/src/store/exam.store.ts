import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ExamTemplate,
  ExamTemplateTag,
  getExamTemplateWithQuestions,
  Question,
  QuestionTag,
} from '../services/latam/exam.service';
import { getQuestionTags } from '../services/latam/exam.service';

interface ExamState {
  // State
  currentQuestion: number;
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

    //   editQuestion: (question) =>
    //     set(
    //       (state) => ({
    //         questions: state.questions.map((q) =>
    //           q.id === state.currentQuestion ? question : q
    //         ),
    //       }),
    //       false,
    //       'editQuestion'
    //     ),

    //   onOptionSelect: (questionId, optionId) =>
    //     set(
    //       (state) => ({
    //         questions: state.questions.map((question) =>
    //           question.id === questionId
    //             ? { ...question, selectedOption: optionId }
    //             : question
    //         ),
    //       }),
    //       false,
    //       'onOptionSelect'
    //     ),

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
        set(
          { alternativesSelected: alternatives },
          false,
          'setAlternativesSelected'
        ),

    //   createQuestion: () =>
    //     set(
    //       (state) => {
    //         const newQuestion = randomQuestionCreator(state.questions.length);
    //         return {
    //           questions: [...state.questions, newQuestion],
    //           alternativesSelected: [...state.alternativesSelected, undefined],
    //         };
    //       },
    //       false,
    //       'createQuestion'
    //     ),

      loadExamTemplate: async (templateId) => {
        try {
          const res = await getExamTemplateWithQuestions(templateId);
          console.log('res', res.data);
          set(
            {
              examQuestionTags: res.data.examTemplateTags,
              currentExamTemplate: res.data,
              examTitle: res.data.title || 'Exam Title',
            },
            false,
            'loadExamTemplate'
          );
        } catch (error) {
          /* empty */
        }
      },

      loadQuestionTags: async () => {
        try {
          const res = await getQuestionTags();
          set({ allQuestionTags: res.data }, false, 'loadQuestionTags');
        } catch (error) {
          /* empty */
        }
      },

    //   initializeExam: () => {
    //     const fakeArray = Array.from({ length: 50 }, (_, index) => index);
    //     const fakeQuestions = fakeArray.map((index) =>
    //       randomQuestionCreator(index)
    //     );
    //     set(
    //       {
    //         questions: fakeQuestions,
    //         alternativesSelected: fakeArray.map(() => undefined),
    //       },
    //       false,
    //       'initializeExam'
    //     );
    //   },
    }),
    {
      name: 'exam-store',
    }
  )
);
