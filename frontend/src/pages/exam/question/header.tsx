import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import Divider from '@mui/material/Divider';
import { useQuestionContext } from './useQuestionContext';
import { IconButton, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { convertMinutesTo_HH_MM } from '../../../utils/date';

export const QuestionHeader = ({ isEditing }: { isEditing: boolean }) => {
  const { currentQuestion, totalQuestions, questionTime, updateQuestionTime } = useQuestionContext();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [time, setTime] = useState(questionTime);

  const handleSaveTime = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    updateQuestionTime(Number(time));
    setIsEditingTime(false);
  }

  const questionTimeFormatted = useMemo(() => {
    return convertMinutesTo_HH_MM(questionTime);
  }, [questionTime]);

  return (
    <>
      <div className="flex flex-row justify-between gap-4 items-center py-2 px-4 text-lg text-slate-200">
        <span>
          Q {currentQuestion + 1}/{totalQuestions}
        </span>
        <span>12357486</span>

        <div className="flex flex-row gap-2 items-center">
          <AccessAlarmIcon />
          {isEditing ? (
            isEditingTime ? (
              <div className="flex flex-row gap-2 items-center">
                <TextField
                  id="filled-number"
                  label="Number"
                  type="number"
                  variant="outlined"
                  size="small"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  value={time}
                  onChange={(e) => setTime(+e.target.value)}
                />
                <IconButton onClick={(e) => handleSaveTime(e)}><SaveIcon /></IconButton>
              </div>
            ) : (
              <div className="flex flex-row gap-2 items-center">
                <span>{questionTimeFormatted}</span>
                <IconButton onClick={() => setIsEditingTime(true)}><EditIcon /></IconButton>
              </div>
            )
          ) : (
            <span>{questionTimeFormatted}</span>
          )}
        </div>
      </div>
      <Divider />
    </>
  );
};
