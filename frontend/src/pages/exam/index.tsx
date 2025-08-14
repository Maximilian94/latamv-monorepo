import { ExamIndex } from './exam-index';
import { Question } from './question';
import { QuestionProvider } from './question/context';

export const ExamPage = () => {
  return (
    <QuestionProvider>
      <div className="flex flex-col h-full">
        <h1>Exam Page</h1>
        <div className="flex flex-row gap-4 h-full">
          <Question />
          <ExamIndex />
        </div>
      </div>
    </QuestionProvider>
  );
};
