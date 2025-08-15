import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  TextField,
} from '@mui/material';
import { useQuestionContext } from './useQuestionContext';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';

export const QuestionContent = ({
  isEditing = false,
}: {
  isEditing: boolean;
}) => {
  const { currentQuestion, questions, onOptionSelect, editQuestion, alternativesSelected } =
    useQuestionContext();
  const [title, setTitle] = useState(questions[currentQuestion]?.statement || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingOptionNewText, setEditingOptionNewText] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null
  );

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    editQuestion({ ...questions[currentQuestion], statement: title });
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleEditOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(index);
    setEditingOptionNewText(questions[currentQuestion].alternatives[index].text);
  };

  const handleSaveOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(null);
    editQuestion({ ...questions[currentQuestion], alternatives: questions[currentQuestion].alternatives.map((option, i) => i === index ? { ...option, text: editingOptionNewText } : option) });
  };

  const shouldShowAsCorrect = (optionId: number) => {
    if(isEditing){
      return questions[currentQuestion].alternatives.find(option => option.id === optionId)?.isCorrect;
    }
    return alternativesSelected[currentQuestion] === optionId;
  }

  const letters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];

  if (questions === undefined || questions.length === 0) return null;

  return (
    <div>
      <>
      {isEditing && (
        <div className="flex flex-row gap-2 items-center">
          <span>Tag: {questions[currentQuestion].tagName}</span>
          <span>Difficulty: {questions[currentQuestion].difficulty}</span>
        </div>
      )}

        {isEditing && (
          <>
            {isEditingTitle && (
              <div className="flex flex-row gap-2 items-center">
                <TextField
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <IconButton onClick={handleSaveTitle}>
                  <SaveIcon />
                </IconButton>
              </div>
            )}
            {!isEditingTitle && (
              <div className="flex flex-row gap-2 items-center">
                <span>{questions[currentQuestion].statement}</span>
                <IconButton onClick={handleEditTitle}>
                  <EditIcon />
                </IconButton>
              </div>
            )}
          </>
        )}
        {!isEditing && <span>{questions[currentQuestion].statement}</span>}
      </>

      <List>
        {questions[currentQuestion].alternatives.map((option, index) => (
          <ListItem key={option.id}>
            <ListItemButton
              className={`rounded-md border-2 border-solid  ${shouldShowAsCorrect(option.id) ? 'bg-indigo-500 border-indigo-200' : 'bg-indigo-900 border-indigo-900'}`}
              disableRipple
              onClick={() => onOptionSelect(currentQuestion, option.id)}
            >
              {isEditing && (
                <>
                  {editingOptionIndex === index && (
                    <div className=" flex gap-4 items-center w-full">
                      <span className="w-8 text-4xl text-gray-50">
                        {letters[index]}
                      </span>

                      <div className="flex w-full items-center">
                        <div className="flex-1">
                          <TextField value={editingOptionNewText} size="small" fullWidth onChange={(e) => setEditingOptionNewText(e.target.value)} autoFocus />
                        </div>
                        <IconButton onClick={(event) => handleSaveOption(index, event)}>
                          <SaveIcon />
                        </IconButton>
                      </div>
                    </div>
                  )}

                  {editingOptionIndex !== index && (
                    <div className=" flex gap-4 items-center w-full">
                      <span className="w-8 text-4xl text-gray-50">
                        {letters[index]}
                      </span>

                      <div className="flex w-full items-center">
                        <span className="flex-1">{option.text}</span>
                        <IconButton onClick={(event) => handleEditOption(index, event)}>
                          <EditIcon />
                        </IconButton>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isEditing && (
                <div className=" flex gap-4 items-center">
                  <span className="text-4xl text-gray-50">
                    {letters[index]}
                  </span>
                  <span>{option.text}</span>
                </div>
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};
