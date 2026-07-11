import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit, Publish, Rule, ContentCopy, Memory } from '@mui/icons-material';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useProcedureVersions,
  useCreateProcedureVersion,
  useDeleteProcedureVersion,
  usePublishProcedureVersion,
  useNewDraftFromPublished,
} from '../../../../../hooks';
import { useProcedureStore } from '../../../../../store/procedure.store';
import { ProceduresThemeProvider } from '../../../../../pages/procedures/procedures-theme';
import type {
  ProcedureStatus,
  ProcedureVersionSummary,
} from '../../../../../services/latam/procedures.service';

const AIRCRAFT_MODELS = ['A320', 'A321', 'A319', 'B737', 'B738'];

const statusColor: Record<ProcedureStatus, 'default' | 'success' | 'warning'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
};

const ProceduresIndex = () => {
  const navigate = useNavigate();
  const { aircraftModelCode, setAircraftModelCode } = useProcedureStore();

  const { data: versions, isLoading } = useProcedureVersions(aircraftModelCode);
  const createMutation = useCreateProcedureVersion();
  const deleteMutation = useDeleteProcedureVersion();
  const publishMutation = usePublishProcedureVersion();
  const newDraftMutation = useNewDraftFromPublished();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    aircraftModelCode: aircraftModelCode,
    baseScore: 100,
    passingScore: 80,
  });
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const openEditor = (id: number) =>
    navigate({ to: '/admin/procedures/$procedureVersionId', params: { procedureVersionId: String(id) } });

  const handleCreate = () => {
    createMutation.mutate(
      {
        aircraftModelCode: form.aircraftModelCode,
        baseScore: form.baseScore,
        passingScore: form.passingScore,
      },
      {
        onSuccess: (created) => {
          toast.success('Draft version created');
          setCreateOpen(false);
          setAircraftModelCode(created.aircraftModelCode);
          openEditor(created.id);
        },
      }
    );
  };

  const handlePublish = (id: number) => {
    publishMutation.mutate(id, {
      onSuccess: () => toast.success('Version published'),
    });
  };

  const handleNewDraft = (id: number) => {
    newDraftMutation.mutate(id, {
      onSuccess: (draft) => {
        toast.success('New draft created from published version');
        openEditor(draft.id);
      },
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget == null) return;
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success('Version deleted');
        setDeleteTarget(null);
      },
      onError: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Procedures
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage validation procedure versions per aircraft model
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <FormControl size="small" className="min-w-[160px]">
            <InputLabel>Aircraft model</InputLabel>
            <Select
              value={aircraftModelCode}
              label="Aircraft model"
              onChange={(e) => setAircraftModelCode(e.target.value)}
            >
              {AIRCRAFT_MODELS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Memory />}
            onClick={() => navigate({ to: '/admin/procedures/catalog' })}
          >
            Dataref Catalog
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setForm((f) => ({ ...f, aircraftModelCode }));
              setCreateOpen(true);
            }}
          >
            New Draft
          </Button>
        </div>
      </div>

      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">
                Versions for {aircraftModelCode}
              </p>
              <p className="text-2xl font-bold text-indigo-900">
                {versions?.length ?? 0}
              </p>
            </div>
            <Rule className="text-indigo-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TableContainer component={Paper} className="shadow-none">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold">Version</TableCell>
                  <TableCell className="font-semibold">Model</TableCell>
                  <TableCell className="font-semibold">Status</TableCell>
                  <TableCell className="font-semibold">Base / Passing</TableCell>
                  <TableCell className="font-semibold">Published At</TableCell>
                  <TableCell className="font-semibold">Updated</TableCell>
                  <TableCell className="font-semibold" align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>Loading versions…</Typography>
                    </TableCell>
                  </TableRow>
                ) : !versions || versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>No procedure versions found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((v: ProcedureVersionSummary) => (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          v{v.version}
                        </Typography>
                      </TableCell>
                      <TableCell>{v.aircraftModelCode}</TableCell>
                      <TableCell>
                        <Chip
                          label={v.status}
                          color={statusColor[v.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {v.baseScore} / {v.passingScore}
                      </TableCell>
                      <TableCell>
                        {v.publishedAt
                          ? new Date(v.publishedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(v.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end space-x-1">
                          <Tooltip title="Open editor">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditor(v.id)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          {v.status === 'DRAFT' && (
                            <Tooltip title="Publish">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handlePublish(v.id)}
                                disabled={publishMutation.isPending}
                              >
                                <Publish />
                              </IconButton>
                            </Tooltip>
                          )}
                          {v.status === 'PUBLISHED' && (
                            <Tooltip title="New draft from this version">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleNewDraft(v.id)}
                                disabled={newDraftMutation.isPending}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(v.id)}
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Procedure Draft</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth>
              <InputLabel>Aircraft model</InputLabel>
              <Select
                value={form.aircraftModelCode}
                label="Aircraft model"
                onChange={(e) =>
                  setForm({ ...form, aircraftModelCode: e.target.value })
                }
              >
                {AIRCRAFT_MODELS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Base score"
                type="number"
                value={form.baseScore}
                onChange={(e) =>
                  setForm({ ...form, baseScore: parseInt(e.target.value) || 0 })
                }
              />
              <TextField
                fullWidth
                label="Passing score"
                type="number"
                value={form.passingScore}
                onChange={(e) =>
                  setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget != null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this procedure version? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/procedures/')({
  component: () => (
    <ProceduresThemeProvider>
      <ProceduresIndex />
    </ProceduresThemeProvider>
  ),
});
