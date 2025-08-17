import { IconButton, TextField } from '@mui/material';
import { ExamIndex } from './exam-index';
import { useExamStore } from '../../store/exam.store';
import { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { Exam } from './question';
import { useNavigate } from '@tanstack/react-router';
import { ExamTemplateDialog } from './exam-template-dialog';

// Componente interno que usa o Zustand store
const ExamContent = ({ 
  isEditing = false, 
  examTemplateId 
}: { 
  isEditing?: boolean;
  examTemplateId?: number;
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
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
    // Check if we're in admin context by looking at the current URL
    const isAdminContext = window.location.pathname.includes('/admin/');
    
    if (isAdminContext) {
      navigate({ to: '/admin/exam-templates' });
    } else {
      navigate({ to: '/exam', search: { templateId: undefined } });
    }
  };

  const handleOpenTemplateDialog = () => {
    setOpenTemplateDialog(true);
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
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
              <div className="flex flex-row gap-4 w-full items-center">
                <span className="text-4xl font-bold">{examTitle}</span>
                <IconButton onClick={handleEditClick}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={handleOpenTemplateDialog} className="text-white">
                  <SettingsIcon />
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
          <div className="flex-1 overflow-y-auto h-full box-border">
            <ExamIndex isEditing={isEditing} />
          </div>
        </div>
      </div>

      {/* Template Settings Dialog */}
      {openTemplateDialog && (
        <ExamTemplateDialog
          open={openTemplateDialog}
          onClose={handleCloseTemplateDialog}
          examTemplateId={examTemplateId}
        />
      )}
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
