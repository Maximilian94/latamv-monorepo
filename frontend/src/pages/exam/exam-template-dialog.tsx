import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { 
  useExamTemplate,
  useUpdateExamTemplate,
  useQuestionTags,
} from '../../hooks';
import { QuestionTag } from '../../services/latam/exam.service';
import toast from 'react-hot-toast';

interface ExamTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  examTemplateId?: number;
}

export const ExamTemplateDialog = ({ 
  open, 
  onClose, 
  examTemplateId 
}: ExamTemplateDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionCount: 0,
    timeLimit: 30,
    passingScore: 70,
    isActive: true,
    examTemplateTags: [] as Array<{ questionTagId: number; questionCount: number }>,
  });

  const { data: examTemplate, isLoading } = useExamTemplate(examTemplateId || 0);
  const { data: questionTags } = useQuestionTags();
  const updateMutation = useUpdateExamTemplate();

  // Load template data when dialog opens
  useEffect(() => {
    if (examTemplate && open) {
      setFormData({
        title: examTemplate.title,
        description: examTemplate.description || '',
        questionCount: examTemplate.questionCount,
        timeLimit: examTemplate.timeLimit,
        passingScore: examTemplate.passingScore,
        isActive: examTemplate.isActive,
        examTemplateTags: examTemplate.examTemplateTags.map(tag => ({
          questionTagId: tag.questionTagId,
          questionCount: tag.questionCount,
        })),
      });
    }
  }, [examTemplate, open]);

  const handleSubmit = () => {
    if (!examTemplateId) return;

    // Validate that total question count matches
    const totalTagQuestions = formData.examTemplateTags.reduce((sum, tag) => sum + tag.questionCount, 0);
    if (totalTagQuestions !== formData.questionCount) {
      toast.error(`Total question count (${formData.questionCount}) must match the sum of tag question counts (${totalTagQuestions})`);
      return;
    }

    if (formData.examTemplateTags.length === 0) {
      toast.error('At least one tag must be selected');
      return;
    }

    const updatedTemplate = {
      ...examTemplate!,
      ...formData,
      examTemplateTags: formData.examTemplateTags.map(tag => {
        const originalTag = examTemplate!.examTemplateTags.find(t => t.questionTagId === tag.questionTagId);
        return {
          ...tag,
          questionTagName: originalTag ? originalTag.questionTagName : '',
        };
      })
    };

    updateMutation.mutate(
      { id: examTemplateId, data: updatedTemplate },
      {
        onSuccess: () => {
          toast.success('Exam template updated successfully');
          onClose();
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update exam template');
        },
      }
    );
  };

  const addTag = () => {
    if (questionTags?.length) {
      const availableTags = questionTags.filter(
        (tag: QuestionTag) => !formData.examTemplateTags.find(t => t.questionTagId === tag.id)
      );
      if (availableTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          examTemplateTags: [...prev.examTemplateTags, { questionTagId: availableTags[0].id, questionCount: 1 }]
        }));
      }
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examTemplateTags: prev.examTemplateTags.filter((_, i) => i !== index)
    }));
  };

  const updateTag = (index: number, field: 'questionTagId' | 'questionCount', value: number) => {
    setFormData(prev => ({
      ...prev,
      examTemplateTags: prev.examTemplateTags.map((tag, i) => 
        i === index ? { ...tag, [field]: value } : tag
      )
    }));
  };


  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>Loading template...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Exam Template</DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-2">
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <TextField
            fullWidth
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
          />

          <div className="grid grid-cols-3 gap-4">
            <TextField
              fullWidth
              label="Total Questions"
              type="number"
              value={formData.questionCount}
              onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
              required
              inputProps={{ min: 0 }}
            />

            <TextField
              fullWidth
              label="Time Limit (minutes)"
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
              required
              inputProps={{ min: 1 }}
            />

            <TextField
              fullWidth
              label="Passing Score (%)"
              type="number"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
              required
              inputProps={{ min: 0, max: 100 }}
            />
          </div>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Typography variant="h6">Question Tags</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={addTag}
                disabled={!questionTags?.length}
              >
                Add Tag
              </Button>
            </div>

            {formData.examTemplateTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <FormControl size="small" className="flex-1">
                  <InputLabel>Tag</InputLabel>
                  <Select
                    value={tag.questionTagId}
                    label="Tag"
                    onChange={(e) => updateTag(index, 'questionTagId', e.target.value as number)}
                  >
                    {questionTags?.map((questionTag) => (
                      <MenuItem key={questionTag.id} value={questionTag.id}>
                        {questionTag.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Questions"
                  type="number"
                  value={tag.questionCount}
                  onChange={(e) => updateTag(index, 'questionCount', parseInt(e.target.value))}
                  inputProps={{ min: 1 }}
                  className="w-24"
                />

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeTag(index)}
                >
                  <Delete />
                </IconButton>
              </div>
            ))}

            {formData.examTemplateTags.length > 0 && (
              <div className="mt-2">
                <Typography variant="body2" color="text.secondary">
                  Total: {formData.examTemplateTags.reduce((sum, tag) => sum + tag.questionCount, 0)} questions
                </Typography>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
