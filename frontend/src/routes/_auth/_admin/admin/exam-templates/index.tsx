import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Quiz,
} from '@mui/icons-material';
import { useState } from 'react';
import { 
  getExamTemplates, 
  getQuestionTags,
  createExamTemplate, 
  updateExamTemplate, 
  deleteExamTemplate,
  ExamTemplate,
} from '../../../../../services/latam/exam.service';
import toast from 'react-hot-toast';

const ExamTemplates = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExamTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questionCount: 10,
    timeLimit: 30,
    passingScore: 70,
    isActive: true,
    examTemplateTags: [] as Array<{ questionTagId: number; questionCount: number }>,
  });

  const queryClient = useQueryClient();

  const examTemplates = useQuery({
    queryKey: ['exam-templates'],
    queryFn: getExamTemplates,
    staleTime: 5 * 60 * 1000,
  });

  const questionTags = useQuery({
    queryKey: ['question-tags'],
    queryFn: getQuestionTags,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createExamTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
      toast.success('Exam template created successfully');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.response?.data?.message || 'Failed to create exam template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExamTemplate }) => updateExamTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
      toast.success('Exam template updated successfully');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.response?.data?.message || 'Failed to update exam template');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExamTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
      toast.success('Exam template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete exam template');
    },
  });

  const handleOpenDialog = (template?: ExamTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description || '',
        questionCount: template.questionCount,
        timeLimit: template.timeLimit,
        passingScore: template.passingScore,
        isActive: template.isActive,
        examTemplateTags: template.examTemplateTags.map(tag => ({
          questionTagId: tag.questionTagId,
          questionCount: tag.questionCount,
        })),
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        title: '',
        description: '',
        questionCount: 10,
        timeLimit: 30,
        passingScore: 70,
        isActive: true,
        examTemplateTags: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this exam template?')) {
      deleteMutation.mutate(id);
    }
  };

  const addTag = () => {
    if (questionTags.data?.data?.length) {
      const availableTags = questionTags.data.data.filter(
        tag => !formData.examTemplateTags.find(t => t.questionTagId === tag.id)
      );
      if (availableTags.length > 0) {
        setFormData({
          ...formData,
          examTemplateTags: [
            ...formData.examTemplateTags,
            { questionTagId: availableTags[0].id, questionCount: 1 }
          ]
        });
      }
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      examTemplateTags: formData.examTemplateTags.filter((_, i) => i !== index)
    });
  };

  const updateTag = (index: number, field: 'questionTagId' | 'questionCount', value: number) => {
    const newTags = [...formData.examTemplateTags];
    newTags[index][field] = value;
    setFormData({ ...formData, examTemplateTags: newTags });
  };

  const getTagName = (tagId: number) => {
    return questionTags.data?.data?.find(tag => tag.id === tagId)?.name || 'Unknown';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Exam Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage exam templates
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Template
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Templates</p>
              <p className="text-2xl font-bold text-purple-900">
                {examTemplates.data?.data?.length || 0}
              </p>
            </div>
            <Quiz className="text-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Exam Templates Table */}
      <Card>
        <CardContent className="p-0">
          <TableContainer component={Paper} className="shadow-none">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">ID</TableCell>
                  <TableCell className="font-semibold">Title</TableCell>
                  <TableCell className="font-semibold">Questions</TableCell>
                  <TableCell className="font-semibold">Time Limit</TableCell>
                  <TableCell className="font-semibold">Passing Score</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Tags</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examTemplates.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading exam templates...</Typography>
                    </TableCell>
                  </TableRow>
                ) : examTemplates.isError ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        Error loading exam templates. Please try again.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : examTemplates.data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>No exam templates found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  examTemplates.data?.data?.map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>{template.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          {template.title}
                        </Typography>
                        {template.description && (
                          <Typography variant="body2" color="text.secondary" className="text-xs">
                            {template.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {template.questionCount} questions
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {template.timeLimit} minutes
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {template.passingScore}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={template.isActive ? 'Active' : 'Inactive'}
                          color={template.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.examTemplateTags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={`${getTagName(tag.questionTagId)} (${tag.questionCount})`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(template)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(template.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTemplate ? 'Edit Exam Template' : 'Create Exam Template'}
          </DialogTitle>
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
                  inputProps={{ min: 1 }}
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="h6">Question Tags</Typography>
                  <Button size="small" onClick={addTag}>
                    Add Tag
                  </Button>
                </div>
                
                {formData.examTemplateTags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <FormControl size="small" className="min-w-[200px]">
                      <InputLabel>Tag</InputLabel>
                      <Select
                        value={tag.questionTagId}
                        label="Tag"
                        onChange={(e) => updateTag(index, 'questionTagId', e.target.value as number)}
                      >
                        {questionTags.data?.data?.map((questionTag) => (
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
                  <Typography variant="body2" color="text.secondary" className="mt-2">
                    Total: {formData.examTemplateTags.reduce((sum, tag) => sum + tag.questionCount, 0)} questions
                  </Typography>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/exam-templates/')({
  component: () => <ExamTemplates />,
});