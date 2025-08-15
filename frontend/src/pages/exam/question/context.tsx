import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getExamTemplates,
  getQuestions,
  Question,
  QuestionAlternative,
} from '../../../services/latam/exam.service';

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
});

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState('Exam Title');
  const [questionTime, setQuestionTime] = useState(0);
  const totalQuestions = useMemo(() => questions.length, [questions]);
  const [alternativesSelected, setAlternativesSelected] = useState<
    Array<number | undefined>
  >([]);

  const onOptionSelect = (questionId: number, optionId: number) => {
    setQuestions(
      questions.map((question) =>
        question.id === questionId
          ? { ...question, selectedOption: optionId }
          : question
      )
    );
  };

  const editQuestion = (question: Question) => {
    setQuestions(
      questions.map((q) => (q.id === currentQuestion ? question : q))
    );
  };

  const updateExamTitle = (title: string) => {
    setExamTitle(title);
  };

  const createQuestion = () => {
    setQuestions([...questions, randomQuestionCreator(questions.length)]);
    setAlternativesSelected([...alternativesSelected, undefined]);
  };

  const randomQuestionCreator = useCallback((index: number): Question => {
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
  }, []);

  const generateRandomAlternatives = (): QuestionAlternative[] => {
    return Array.from({ length: 4 }, (_, index) => ({
      id: index,
      label: `Option ${index + 1}`,
      value: `option_${index + 1}`,
      text: `Option ${index + 1}`,
      isCorrect: index === 0, // Mark the first option as correct for demo purposes
    }));
  };

  useEffect(() => {
    const fakeArray = Array.from({ length: 50 }, (_, index) => index);
    setQuestions(fakeArray.map((index) => randomQuestionCreator(index)));
    setAlternativesSelected(fakeArray.map(() => undefined));
  }, []);

  useEffect(() => {
    getExamTemplates().then((res) => {
      console.log(res);
      getQuestions({
        tagIds: res.data[0].examTemplateTags.map((tag) => tag.questionTagId),
      }).then((res) => {
        setQuestions(res.data);
      });
    });
  }, []);

  const updateQuestionTime = (time: number) => {
    setQuestionTime(time);
  };

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
        alternativesSelected: alternativesSelected as number[], // Type assertion to fix lint error - TODO: fix this
        setAlternativesSelected,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};
