import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import { Question } from "./question.types";


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
});

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examTitle, setExamTitle] = useState('Exam Title');
    const [questionTime, setQuestionTime] = useState(0);
    const totalQuestions = useMemo(() => questions.length, [questions]);

    const onOptionSelect = (questionId: number, optionId: number) => {
        setQuestions(questions.map(question => question.id === questionId ? { ...question, selectedOption: optionId } : question));
    }

    const editQuestion = (question: Question) => {
        setQuestions(questions.map(q => q.id === currentQuestion ? question : q));
    }

    const updateExamTitle = (title: string) => {
        console.log('updateExamTitle', title);
        setExamTitle(title);
    }

    const createQuestion = () => {
        setQuestions([...questions, randomQuestionCreator(questions.length)]);
    }

    useEffect(() => {
        console.log('examTitle', examTitle);
    }, [examTitle]);

    const randomQuestionCreator = (index: number) => {
        return {
            id: index,
            label: `Question ${index + 1}`,
            value: `question_${index + 1}`,
            options: Array.from({ length: 4 }, (_, index) => ({
                id: index,
                label: `Option ${index + 1}`,
                value: `option_${index + 1}`,
            })),
            correctOption: Math.floor(Math.random() * 4),
            selectedOption: null,
        }
    }

    useEffect(() => {
        setQuestions(Array.from({ length: 50 }, (_, index) => (randomQuestionCreator(index))));
    }, []);

    const updateQuestionTime = (time: number) => {
        setQuestionTime(time);
    }

    return <QuestionContext.Provider value={{ currentQuestion, setCurrentQuestion, totalQuestions, questions, onOptionSelect, editQuestion, examTitle, updateExamTitle, createQuestion, questionTime, updateQuestionTime }}>{children}</QuestionContext.Provider>;
}