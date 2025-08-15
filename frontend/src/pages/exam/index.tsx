import { IconButton, TextField } from '@mui/material';
import { ExamIndex } from './exam-index';
import { Question } from './question';
import { QuestionContext, QuestionProvider } from './question/context';
import { useContext, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

// Componente interno que usa o contexto
const ExamContent = ({ isEditing = false }: { isEditing?: boolean }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { examTitle, updateExamTitle } = useContext(QuestionContext);
  const [title, setTitle] = useState(examTitle);

  // Atualizar o title quando examTitle mudar
  const handleEditClick = () => {
    setTitle(examTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    updateExamTitle(title);
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-2 w-full h-16 flex items-center">
        {isEditing && (
          <>
            {isEditingTitle ? (
              <div className="flex flex-row gap-4 w-full items-center">
                <TextField
                  id="outlined-basic"
                  label="Outlined"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <IconButton onClick={handleSaveTitle}>
                  <SaveIcon />
                </IconButton>
              </div>
            ) : (
              <div className="flex flex-row gap-4 w-full">
                <span className="text-4xl font-bold">{examTitle}</span>
                <IconButton onClick={handleEditClick}>
                  <EditIcon />
                </IconButton>
              </div>
            )}
          </>
        )}

        {!isEditing && <span className="text-4xl font-bold">{examTitle}</span>}
      </div>
      <div className="flex flex-row gap-4 h-full">
        <Question isEditing={isEditing} />
        <ExamIndex isEditing={isEditing} />
      </div>
    </div>
  );
};

export const ExamPage = ({ isEditing = false }: { isEditing?: boolean }) => {
  return (
    <QuestionProvider>
      <ExamContent isEditing={isEditing} />
    </QuestionProvider>
  );
};
