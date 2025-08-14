import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import Divider from '@mui/material/Divider';
import { useQuestionContext } from './useQuestionContext';

export const QuestionHeader = () => {
  const { currentQuestion, totalQuestions } = useQuestionContext();

  return (
    <>
      <div className="flex flex-row justify-between gap-4 items-center py-2 px-4 text-lg text-slate-200">
        <span>
          Q {currentQuestion + 1}/{totalQuestions}
        </span>
        <span>12357486</span>
        <div className="flex flex-row gap-2 items-center">
          <AccessAlarmIcon />
          <span>00:00:00</span>
        </div>
      </div>
      <Divider />
    </>
  );
};
