import { IconButton, TextField } from '@mui/material';
import { ExamIndex } from './exam-index';
import { Question } from './question';
import { QuestionContext, QuestionProvider } from './context/exam-context';
import { useContext, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { SetUpExamTemplate } from './set-up-exam-template';

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
    <div className="flex flex-col h-full w-full box-border">
      <div className="px-2 w-full h-16 flex items-center box-border">
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
      <div className="flex-1 flex flex-row gap-4 w-full box-border">
        <div className="flex-1">
          <Question isEditing={isEditing} />
        </div>
        <div className="w-96 flex flex-col gap-4 box-border">
          <div className="overflow-y-auto h-min">
            <SetUpExamTemplate />
          </div>
          <div className="flex-1 overflow-y-auto h-full box-border">
            <ExamIndex isEditing={isEditing} />
          </div>
        </div>
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
