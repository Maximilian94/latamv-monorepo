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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  School,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useState } from 'react';
import { 
  getQuestions, 
  getQuestionTags,
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  Question,
} from '../../../../services/latam/exam.service';
import toast from 'react-hot-toast';

const Questions = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    tagId: '',
    statement: '',
    imageUrl: '',
    videoUrl: '',
    explanation: '',
    difficulty: 3,
    isActive: true,
    alternatives: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const queryClient = useQueryClient();

  const questions = useQuery({
    queryKey: ['questions'],
    queryFn: () => getQuestions(),
    staleTime: 5 * 60 * 1000,
  });

  const questionTags = useQuery({
    queryKey: ['question-tags'],
    queryFn: getQuestionTags,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question created successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create question');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Question }) => updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question updated successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update question');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete question');
    },
  });

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        tagId: question.tagId.toString(),
        statement: question.statement,
        imageUrl: question.imageUrl || '',
        videoUrl: question.videoUrl || '',
        explanation: question.explanation || '',
        difficulty: question.difficulty,
        isActive: question.isActive,
        alternatives: question.alternatives.map(alt => ({
          text: alt.text,
          isCorrect: alt.isCorrect,
        })),
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        tagId: '',
        statement: '',
        imageUrl: '',
        videoUrl: '',
        explanation: '',
        difficulty: 3,
        isActive: true,
        alternatives: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate statement
    if (!formData.statement.trim()) {
      toast.error('Question statement is required');
      return;
    }
    
    // Validate tag
    if (!formData.tagId) {
      toast.error('Please select a tag');
      return;
    }
    
    // Validate alternatives
    const validAlternatives = formData.alternatives.filter(alt => alt.text.trim() !== '');
    if (validAlternatives.length < 2) {
      toast.error('At least 2 alternatives are required');
      return;
    }
    
    const correctCount = validAlternatives.filter(alt => alt.isCorrect).length;
    if (correctCount !== 1) {
      toast.error('Exactly one alternative must be marked as correct');
      return;
    }

    const submitData = {
      ...formData,
      tagId: parseInt(formData.tagId),
      alternatives: validAlternatives,
    };

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: submitData as any });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAlternativeChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newAlternatives = [...formData.alternatives];
    if (field === 'isCorrect') {
      // Only one alternative can be correct
      newAlternatives.forEach((alt, i) => {
        alt.isCorrect = i === index ? (value as boolean) : false;
      });
    } else {
      newAlternatives[index][field] = value as string;
    }
    setFormData({ ...formData, alternatives: newAlternatives });
  };

  const getTagName = (tagId: number) => {
    return questionTags.data?.data?.find(tag => tag.id === tagId)?.name || 'Unknown';
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'success';
      case 2: return 'info';
      case 3: return 'warning';
      case 4: return 'error';
      case 5: return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Questions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage exam questions and alternatives
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Question
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Questions</p>
              <p className="text-2xl font-bold text-blue-900">
                {questions.data?.data?.length || 0}
              </p>
            </div>
            <School className="text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardContent className="p-0">
          <TableContainer component={Paper} className="shadow-none">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">ID</TableCell>
                  <TableCell className="font-semibold">Statement</TableCell>
                  <TableCell className="font-semibold">Tag</TableCell>
                  <TableCell className="font-semibold">Difficulty</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Alternatives</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>Loading questions...</Typography>
                    </TableCell>
                  </TableRow>
                ) : questions.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">
                        Error loading questions. Please try again.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : questions.data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>No questions found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.data?.data?.map((question) => (
                    <TableRow key={question.id} hover>
                      <TableCell>{question.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium max-w-xs truncate">
                          {question.statement}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTagName(question.tagId)} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`Level ${question.difficulty}`}
                          color={getDifficultyColor(question.difficulty) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={question.isActive ? 'Active' : 'Inactive'}
                          color={question.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {question.alternatives.length} alternatives
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(question)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(question.id)}
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
            {editingQuestion ? 'Edit Question' : 'Create Question'}
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-2">
              <FormControl fullWidth>
                <InputLabel>Tag</InputLabel>
                <Select
                  value={formData.tagId}
                  label="Tag"
                  onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                  required
                >
                  {questionTags.data?.data?.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Question Statement"
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                multiline
                rows={3}
                required
              />

              <TextField
                fullWidth
                label="Image URL (optional)"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />

              <TextField
                fullWidth
                label="Video URL (optional)"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />

              <TextField
                fullWidth
                label="Explanation (optional)"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                multiline
                rows={2}
              />

              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  label="Difficulty"
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as number })}
                >
                  <MenuItem value={1}>Level 1 - Very Easy</MenuItem>
                  <MenuItem value={2}>Level 2 - Easy</MenuItem>
                  <MenuItem value={3}>Level 3 - Medium</MenuItem>
                  <MenuItem value={4}>Level 4 - Hard</MenuItem>
                  <MenuItem value={5}>Level 5 - Very Hard</MenuItem>
                </Select>
              </FormControl>

              <div>
                <Typography variant="h6" className="mb-2">
                  Alternatives
                </Typography>
                {formData.alternatives.map((alternative, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <IconButton
                      size="small"
                      onClick={() => handleAlternativeChange(index, 'isCorrect', !alternative.isCorrect)}
                    >
                      {alternative.isCorrect ? <CheckCircle color="success" /> : <RadioButtonUnchecked />}
                    </IconButton>
                    <TextField
                      fullWidth
                      label={`Alternative ${index + 1}`}
                      value={alternative.text}
                      onChange={(e) => handleAlternativeChange(index, 'text', e.target.value)}
                      size="small"
                    />
                  </div>
                ))}
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
              {editingQuestion ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/questions')({
  component: () => <Questions />,
});