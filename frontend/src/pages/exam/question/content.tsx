import { IconButton, List, ListItem, ListItemButton, TextField } from '@mui/material';
import { useQuestionContext } from './useQuestionContext';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';

export const QuestionContent = ({ isEditing = false }: { isEditing: boolean }) => {
  const { currentQuestion, questions, onOptionSelect, editQuestion } = useQuestionContext();
  const [title, setTitle] = useState(questions[currentQuestion]?.label || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    editQuestion({...questions[currentQuestion], label: title});
  }

  const handleEditTitle = () => {
    setIsEditingTitle(true);
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
        {isEditing && <>
        {isEditingTitle && <div className="flex flex-row gap-2 items-center">
          <TextField value={title} onChange={(e) => setTitle(e.target.value)} />
          <IconButton onClick={handleSaveTitle}>
            <SaveIcon />
          </IconButton>
        </div>}
        {!isEditingTitle && <div className="flex flex-row gap-2 items-center">
          <span>{questions[currentQuestion].label}</span>
          <IconButton onClick={handleEditTitle}>
            <EditIcon />
          </IconButton>
        </div>}
        </>}
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
              <div className=" flex gap-4 items-center">
                <span className="text-4xl text-gray-50">{letters[index]}</span>
                <span>{option.label}</span>
              </div>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
};
