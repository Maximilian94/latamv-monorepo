// import { useExamStore } from "../../../store/exam.store";

// export function useQuestionContext() {
//     const store = useExamStore();
    
//     // Retornar apenas as propriedades necessárias para manter compatibilidade
//     return {
//         currentQuestion: store.currentQuestion,
//         setCurrentQuestion: store.setCurrentQuestion,
//         questions: store.questions,
//         onOptionSelect: store.onOptionSelect,
//         editQuestion: store.editQuestion,
//         examTitle: store.examTitle,
//         updateExamTitle: store.updateExamTitle,
//         createQuestion: store.createQuestion,
//         questionTime: store.questionTime,
//         updateQuestionTime: store.updateQuestionTime,
//         alternativesSelected: store.alternativesSelected as number[],
//         setAlternativesSelected: (alternatives: number[]) =>
//             store.setAlternativesSelected(alternatives as Array<number | undefined>),
//         allQuestionTags: store.allQuestionTags,
//         examQuestionTags: store.examQuestionTags,
//         currentExamTemplate: store.currentExamTemplate,
//     };
// }
