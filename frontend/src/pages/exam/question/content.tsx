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
  const { currentQuestion, questions, onOptionSelect, editQuestion } =
    useQuestionContext();
  const [title, setTitle] = useState(questions[currentQuestion]?.label || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingOptionNewText, setEditingOptionNewText] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null
  );

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    editQuestion({ ...questions[currentQuestion], label: title });
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleEditOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(index);
    setEditingOptionNewText(questions[currentQuestion].options[index].label);
  };

  const handleSaveOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(null);
    editQuestion({ ...questions[currentQuestion], options: questions[currentQuestion].options.map((option, i) => i === index ? { ...option, label: editingOptionNewText } : option) });
  };

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
                <span>{questions[currentQuestion].label}</span>
                <IconButton onClick={handleEditTitle}>
                  <EditIcon />
                </IconButton>
              </div>
            )}
          </>
        )}
        {!isEditing && <span>{questions[currentQuestion].label}</span>}
      </>

      <List>
        {questions[currentQuestion].options.map((option, index) => (
          <ListItem key={option.id}>
            <ListItemButton
              className={`rounded-md border-2 border-solid  ${questions[currentQuestion].selectedOption === option.id ? 'bg-indigo-500 border-indigo-200' : 'bg-indigo-900 border-indigo-900'}`}
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
                        <span className="flex-1">{option.label}</span>
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
                  <span>{option.label}</span>
                </div>
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};
