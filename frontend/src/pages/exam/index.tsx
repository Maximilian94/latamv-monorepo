import { IconButton, TextField } from '@mui/material';
import { ExamIndex } from './exam-index';
import { useExamStore } from '../../store/exam.store';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SetUpExamTemplate } from './set-up-exam-template';
import { Exam } from './question';
import { useNavigate } from '@tanstack/react-router';

// Componente interno que usa o Zustand store
const ExamContent = ({ 
  isEditing = false, 
  examTemplateId 
}: { 
  isEditing?: boolean;
  examTemplateId?: number;
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const navigate = useNavigate();
  const { 
    examTitle, 
    updateExamTitle, 
    loadExamTemplate, 
    loadQuestionTags, 
    initializeExam 
  } = useExamStore();
  const [title, setTitle] = useState(examTitle);

  // Carregar dados quando o componente montar ou examTemplateId mudar
  useEffect(() => {
    if (examTemplateId) {
      // Carregar template específico
      loadExamTemplate(examTemplateId);
    } else {
      // Carregar dados padrão
      initializeExam();
      loadExamTemplate(1); // Template padrão
    }
    
    // Carregar tags de perguntas
    loadQuestionTags();
  }, [examTemplateId, loadExamTemplate, loadQuestionTags, initializeExam]);

  // Atualizar o title quando examTitle mudar
  useEffect(() => {
    setTitle(examTitle);
  }, [examTitle]);

  const handleEditClick = () => {
    setTitle(examTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    updateExamTitle(title);
    setIsEditingTitle(false);
  };

  const handleBack = () => {
    navigate({ to: '/exam' });
  };

  return (
    <div className="flex flex-col h-full w-full box-border">
      <div className="px-2 w-full h-16 flex items-center box-border">
        {isEditing && (
          <div className="flex items-center gap-4 w-full">
            <IconButton onClick={handleBack} className="text-white">
              <ArrowBackIcon />
            </IconButton>
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
          </div>
        )}

        {!isEditing && <span className="text-4xl font-bold">{examTitle}</span>}
      </div>
      <div className="flex-1 flex flex-row gap-4 w-full box-border">
        <div className="flex-1">
          <Exam isEditing={isEditing} />
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

export const ExamPage = ({ 
  isEditing = false, 
  examTemplateId 
}: { 
  isEditing?: boolean;
  examTemplateId?: number;
}) => {
  return <ExamContent isEditing={isEditing} examTemplateId={examTemplateId} />;
};
