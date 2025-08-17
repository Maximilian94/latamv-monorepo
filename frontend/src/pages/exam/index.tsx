import { IconButton } from '@mui/material';
import { ExamIndex } from './exam-index';
import { useExamStore } from '../../store/exam.store';
import { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Exam } from './question';
import { ExamTemplateDialog } from './exam-template-dialog';

// Componente interno que usa o Zustand store
const ExamContent = ({
  isEditing = false,
  examTemplateId,
}: {
  isEditing?: boolean;
  examTemplateId?: number;
}) => {
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const {
    examTitle,
    loadExamTemplate,
    loadQuestionTags,
    initializeExam,
  } = useExamStore();

  // Carregar dados quando o componente montar ou examTemplateId mudar
  useEffect(() => {
    if (examTemplateId) {
      // Carregar template específico
      loadExamTemplate(examTemplateId);
    }

    // Carregar tags de perguntas
    loadQuestionTags();
  }, [examTemplateId, loadExamTemplate, loadQuestionTags, initializeExam]);

  const handleOpenTemplateDialog = () => {
    setOpenTemplateDialog(true);
  };

  const handleCloseTemplateDialog = () => {
    setOpenTemplateDialog(false);
  };

  return (
    <div className="flex flex-col h-full w-full box-border">
      <div className="px-2 w-full h-16 flex items-center box-border">
        <div className="flex flex-row gap-4 w-full items-center">
          <span className="text-4xl font-bold">{examTitle}</span>
          {isEditing && (
            <IconButton
              onClick={handleOpenTemplateDialog}
              className="text-white"
            >
              <SettingsIcon />
            </IconButton>
          )}
        </div>
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
  examTemplateId,
}: {
  isEditing?: boolean;
  examTemplateId?: number;
}) => {
  return <ExamContent isEditing={isEditing} examTemplateId={examTemplateId} />;
};
