import { createContext, ReactNode, useEffect, useState } from "react";
import { Question } from "./question.types";


export const QuestionContext = createContext<{
    currentQuestion: number;
    setCurrentQuestion: (question: number) => void;
    totalQuestions: number;
    setTotalQuestions: (total: number) => void;
    questions: Question[];
    onOptionSelect: (questionId: number, optionId: number) => void;
    editQuestion: (question: Question) => void;
    examTitle: string;
    updateExamTitle: (title: string) => void;
}>({
    currentQuestion: 0,
    setCurrentQuestion: () => {},
    totalQuestions: 0,
    setTotalQuestions: () => {},
    questions: [],
    onOptionSelect: () => {},
    editQuestion: () => {},
    examTitle: 'Exam Title',
    updateExamTitle: () => {},
});

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examTitle, setExamTitle] = useState('Exam Title');

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

    useEffect(() => {
        console.log('examTitle', examTitle);
    }, [examTitle]);

    useEffect(() => {
        setTotalQuestions(50);
        setQuestions(Array.from({ length: 50 }, (_, index) => ({
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
        })));
    }, []);

    return <QuestionContext.Provider value={{ currentQuestion, setCurrentQuestion, totalQuestions, setTotalQuestions, questions, onOptionSelect, editQuestion, examTitle, updateExamTitle }}>{children}</QuestionContext.Provider>;
}