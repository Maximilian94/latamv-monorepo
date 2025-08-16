import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  TextField,
} from '@mui/material';
import { useExamStore } from '../../../store/exam.store';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';

export const QuestionContent = ({
  isEditing = false,
}: {
  isEditing: boolean;
}) => {
  const { currentQuestion, currentExamTemplate, onOptionSelect, editQuestion, alternativesSelected } =
    useExamStore();
  
  const currentQuestionData = currentExamTemplate?.questions?.[currentQuestion];
  
  const [title, setTitle] = useState(currentQuestionData?.statement || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingOptionNewText, setEditingOptionNewText] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null
  );

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (currentQuestionData) {
      editQuestion({ ...currentQuestionData, statement: title });
    }
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleEditOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(index);
    const optionText = currentQuestionData?.alternatives?.[index]?.text || '';
    setEditingOptionNewText(optionText);
  };

  const handleSaveOption = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingOptionIndex(null);
    if (currentQuestionData?.alternatives) {
      const updatedAlternatives = currentQuestionData.alternatives.map((option, i) => 
        i === index ? { ...option, text: editingOptionNewText } : option
      );
      editQuestion({ ...currentQuestionData, alternatives: updatedAlternatives });
    }
  };

  const shouldShowAsCorrect = (optionId: number) => {
    if(isEditing){
      return currentQuestionData?.alternatives?.find(option => option.id === optionId)?.isCorrect;
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

  if (currentExamTemplate?.questions === undefined || currentExamTemplate?.questions.length === 0) return null;

  return (
    <div>
      <>
      {isEditing && (
        <div className="flex flex-row gap-2 items-center">
          <span>Tag: {currentQuestionData?.tagName}</span>
          <span>Difficulty: {currentQuestionData?.difficulty}</span>
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
                <span>{currentQuestionData?.statement}</span>
                <IconButton onClick={handleEditTitle}>
                  <EditIcon />
                </IconButton>
              </div>
            )}
          </>
        )}
        {!isEditing && <span>{currentQuestionData?.statement}</span>}
      </>

      <List>
        {currentQuestionData?.alternatives?.map((option, index) => (
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