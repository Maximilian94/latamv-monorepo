import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
  Tag,
} from '@mui/icons-material';
import { useState } from 'react';
import { 
  getQuestionTags, 
  createQuestionTag, 
  updateQuestionTag, 
  deleteQuestionTag,
  QuestionTag 
} from '../../../../services/latam/exam.service';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

type ApiErr = AxiosError<{ message?: string }>;

const QuestionTags = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<QuestionTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const queryClient = useQueryClient();

  const questionTags = useQuery({
    queryKey: ['question-tags'],
    queryFn: getQuestionTags,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createQuestionTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
      toast.success('Question tag created successfully');
      handleCloseDialog();
    },
    onError: (error: ApiErr) => {
      toast.error(error.response?.data?.message || 'Failed to create question tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateQuestionTag>[1] }) =>
      updateQuestionTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
      toast.success('Question tag updated successfully');
      handleCloseDialog();
    },
    onError: (error: ApiErr) => {
      toast.error(error.response?.data?.message || 'Failed to update question tag');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestionTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
      toast.success('Question tag deleted successfully');
    },
    onError: (error: ApiErr) => {
      toast.error(error.response?.data?.message || 'Failed to delete question tag');
    },
  });

  const handleOpenDialog = (tag?: QuestionTag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || '',
        color: tag.color,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this question tag?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Question Tags
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage question categories and tags
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Tag
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Question Tags</p>
              <p className="text-2xl font-bold text-blue-900">
                {questionTags.data?.data?.length || 0}
              </p>
            </div>
            <Tag className="text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Question Tags Table */}
      <Card>
        <CardContent className="p-0">
          <TableContainer component={Paper} className="shadow-none">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">Color</TableCell>
                  <TableCell className="font-semibold">Name</TableCell>
                  <TableCell className="font-semibold">Description</TableCell>
                  <TableCell className="font-semibold">Created</TableCell>
                  <TableCell className="font-semibold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questionTags.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>Loading question tags...</Typography>
                    </TableCell>
                  </TableRow>
                ) : questionTags.isError ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="error">
                        Error loading question tags. Please try again.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : questionTags.data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>No question tags found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questionTags.data?.data?.map((tag) => (
                    <TableRow key={tag.id} hover>
                      <TableCell>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: tag.color }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          {tag.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tag.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(tag.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(tag)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(tag.id)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTag ? 'Edit Question Tag' : 'Create Question Tag'}
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-2">
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
              <div>
                <Typography variant="body2" className="mb-2">
                  Color
                </Typography>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded border border-gray-300"
                />
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
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/question-tags')({
  component: () => <QuestionTags />,
});