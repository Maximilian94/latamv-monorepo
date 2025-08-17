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
import { useExamStore } from '../../store/exam.store';
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
  const { updateExamTemplateOptimistically } = useExamStore();

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
    if (!examTemplateId || !examTemplate) return;

    // Validate that total question count matches
    const totalTagQuestions = formData.examTemplateTags.reduce((sum, tag) => sum + tag.questionCount, 0);
    if (totalTagQuestions !== formData.questionCount) {
      toast.error(`Total question count (${formData.questionCount}) must match the sum of tag question counts (${totalTagQuestions})`);
      return;
    }

    // Only require tags if template is active
    if (formData.isActive && formData.examTemplateTags.length === 0) {
      toast.error('At least one tag must be selected for active templates');
      return;
    }

    // Prepare the API payload (only fields that should be sent)
    const apiPayload = {
      title: formData.title,
      description: formData.description,
      questionCount: formData.questionCount,
      timeLimit: formData.timeLimit,
      passingScore: formData.passingScore,
      isActive: formData.isActive,
      examTemplateTags: formData.examTemplateTags.map(tag => ({
        questionTagId: tag.questionTagId,
        questionCount: tag.questionCount,
      })),
    };

    // Prepare the optimistic update (full template structure)
    const optimisticUpdate = {
      ...examTemplate,
      title: formData.title,
      description: formData.description,
      questionCount: formData.questionCount,
      timeLimit: formData.timeLimit,
      passingScore: formData.passingScore,
      isActive: formData.isActive,
      examTemplateTags: formData.examTemplateTags.map(tag => {
        const originalTag = examTemplate.examTemplateTags.find(t => t.questionTagId === tag.questionTagId);
        return {
          ...tag,
          questionTagName: originalTag ? originalTag.questionTagName : '',
        };
      }),
    };

    // Optimistic update - update the store immediately
    updateExamTemplateOptimistically(optimisticUpdate);

    // Close the dialog immediately for better UX
    onClose();

    // Show success message
    toast.success('Exam template updated successfully');

    // Update in the background
    updateMutation.mutate(
      { id: examTemplateId, data: apiPayload },
      {
        onError: (error: Error) => {
          // Revert optimistic update on error
          updateExamTemplateOptimistically(examTemplate);
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
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#1e1b4b', // indigo-950
            color: 'white',
            borderRadius: '12px',
          }
        }}
      >
        <DialogContent>
          <Typography>Loading template...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#1e1b4b', // indigo-950
          color: 'white',
          borderRadius: '12px',
        }
      }}
    >
      <DialogTitle className="text-2xl font-bold text-white border-b border-indigo-700 pb-4">
        Edit Exam Template
      </DialogTitle>
      <DialogContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#4f46e5', // indigo-600
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1', // indigo-500
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1', // indigo-500
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#a5b4fc', // indigo-300
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />

            <TextField
              fullWidth
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#a5b4fc',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <TextField
              fullWidth
              label="Total Questions"
              type="number"
              value={formData.questionCount}
              onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
              required
              inputProps={{ min: 0 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#a5b4fc',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />

            <TextField
              fullWidth
              label="Time Limit (minutes)"
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
              required
              inputProps={{ min: 1 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#a5b4fc',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />

            <TextField
              fullWidth
              label="Passing Score (%)"
              type="number"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
              required
              inputProps={{ min: 0, max: 100 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#a5b4fc',
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                },
              }}
            />
          </div>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#6366f1',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#6366f1',
                  },
                }}
              />
            }
            label="Active"
            sx={{ color: 'white' }}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Typography variant="h6" className="text-white font-semibold">
                Question Tags
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={addTag}
                disabled={!questionTags?.length}
                sx={{
                  color: '#6366f1',
                  borderColor: '#6366f1',
                  '&:hover': {
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                Add Tag
              </Button>
            </div>

            {formData.examTemplateTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-indigo-600 rounded-lg bg-indigo-900/50">
                <FormControl size="small" className="flex-1">
                  <InputLabel sx={{ color: '#a5b4fc' }}>Tag</InputLabel>
                  <Select
                    value={tag.questionTagId}
                    label="Tag"
                    onChange={(e) => updateTag(index, 'questionTagId', e.target.value as number)}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4f46e5',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#a5b4fc',
                      },
                    }}
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
                  className="w-32"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#4f46e5',
                      },
                      '&:hover fieldset': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#6366f1',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#a5b4fc',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeTag(index)}
                  sx={{
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </div>
            ))}

            {formData.examTemplateTags.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-800/50 rounded-lg border border-indigo-600">
                <Typography variant="body2" className="text-indigo-200">
                  Total: {formData.examTemplateTags.reduce((sum, tag) => sum + tag.questionCount, 0)} questions
                </Typography>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions className="p-6 border-t border-indigo-700">
        <Button 
          onClick={onClose}
          sx={{
            color: '#a5b4fc',
            '&:hover': {
              backgroundColor: 'rgba(165, 180, 252, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={updateMutation.isPending}
          sx={{
            backgroundColor: '#6366f1',
            '&:hover': {
              backgroundColor: '#5855eb',
            },
            '&:disabled': {
              backgroundColor: '#4f46e5',
              color: '#a5b4fc',
            },
          }}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
