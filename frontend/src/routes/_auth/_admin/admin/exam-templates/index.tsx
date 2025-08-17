import { createFileRoute } from '@tanstack/react-router';
import { Link, useNavigate } from '@tanstack/react-router';
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
  useExamTemplates,
  useQuestionTags,
  useCreateExamTemplate,
  useUpdateExamTemplate,
  useDeleteExamTemplate,
} from '../../../../../hooks';
import { ExamTemplate, QuestionTag } from '../../../../../services/latam/exam.service';
import toast from 'react-hot-toast';

type ExamTemplateFormData = {
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  examTemplateTags: Array<{ questionTagId: number; questionCount: number }>;
};

const ExamTemplates = () => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExamTemplate | null>(null);
  const [formData, setFormData] = useState<ExamTemplateFormData>({
    title: '',
    description: '',
    questionCount: 10,
    timeLimit: 30,
    passingScore: 70,
    isActive: true,
    examTemplateTags: [],
  });

  // Using custom hooks instead of direct useQuery/useMutation
  const { data: examTemplates, isLoading: examTemplatesLoading } = useExamTemplates();
  const { data: questionTags } = useQuestionTags();
  
  const createMutation = useCreateExamTemplate();
  const updateMutation = useUpdateExamTemplate();
  const deleteMutation = useDeleteExamTemplate();

  // Add success/error callbacks
  const handleCreateSuccess = (newTemplate: ExamTemplate) => {
    toast.success('Exam template created successfully');
    handleCloseDialog();
    // Navigate to exam page with the new template ID
    navigate({ 
      to: '/exam', 
      search: { templateId: newTemplate.id.toString() } 
    });
  };

  const handleUpdateSuccess = () => {
    toast.success('Exam template updated successfully');
    handleCloseDialog();
  };

  const handleDeleteSuccess = () => {
    toast.success('Exam template deleted successfully');
  };

  const handleError = (error: Error) => {
    toast.error(error.message || 'An error occurred');
  };

  const handleCreateTemplate = () => {
    // Create template with default values (0 questions initially)
    const defaultTemplate = {
      title: 'New Exam Template',
      description: 'Template created automatically',
      questionCount: 0,
      timeLimit: 30,
      passingScore: 70,
      isActive: true,
      examTemplateTags: [],
    };

    createMutation.mutate(defaultTemplate, { 
      onSuccess: handleCreateSuccess, 
      onError: handleError 
    });
  };

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

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({ 
        id: editingTemplate.id, 
        data: { 
          ...editingTemplate, 
          ...formData, 
          examTemplateTags: formData.examTemplateTags.map(tag => {
            const originalTag = editingTemplate.examTemplateTags.find(t => t.questionTagId === tag.questionTagId);
            return {
              ...tag,
              questionTagName: originalTag ? originalTag.questionTagName : '',
            };
          })
        } 
      }, { 
        onSuccess: handleUpdateSuccess, 
        onError: handleError 
      });
    } else {
      createMutation.mutate(formData, { 
        onSuccess: handleCreateSuccess, 
        onError: handleError 
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this exam template?')) {
      deleteMutation.mutate(id, { onSuccess: handleDeleteSuccess, onError: handleError });
    }
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

  const getTagName = (tagId: number) => {
    return questionTags?.find((tag: QuestionTag) => tag.id === tagId)?.name || 'Unknown';
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Templates</p>
              <p className="text-2xl font-bold text-purple-900">
                {examTemplates?.length || 0}
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
                {examTemplatesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading exam templates...</Typography>
                    </TableCell>
                  </TableRow>
                ) : examTemplates?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>No exam templates found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  examTemplates?.map((template) => (
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
                            <Link to={`/admin/exam-templates/${template.id}`}>
                              <IconButton
                                size="small"
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Link>
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