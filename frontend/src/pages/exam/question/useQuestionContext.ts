import { useContext } from "react";
import { QuestionContext } from "../context/exam-context";

export function useQuestionContext() {
    const context = useContext(QuestionContext);
    if (context == undefined) {
        throw new Error('useQuestionContext must be used within an QuestionContext');
    }
    return context;
}
