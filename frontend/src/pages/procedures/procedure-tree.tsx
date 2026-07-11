import { useState } from 'react';
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import toast from 'react-hot-toast';
import SeverityIcon from '../../components/severity/severityIcon/severityIcon';
import { useProcedureStore } from '../../store/procedure.store';
import {
  useCreatePhase,
  useUpdatePhase,
  useDeletePhase,
  useCreateSubPhase,
  useUpdateSubPhase,
  useDeleteSubPhase,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../../hooks';
import type {
  ChecklistItem,
  Phase,
  ProcedureEvent,
  ProcedureItemSource,
  ProcedureVersionTree,
  SubPhase,
  Verifiability,
} from '../../services/latam/procedures.service';
import { SEVERITY_META, SEVERITY_OPTIONS, SOURCE_OPTIONS, VERIFIABILITY_OPTIONS } from './constants';

type Level = 'phase' | 'subphase' | 'item' | 'event';

interface DialogState {
  open: boolean;
  level: Level;
  mode: 'create' | 'edit';
  parentId: number;
  targetId: number | string;
  name: string;
  severityId: number;
  reference: string;
  description: string;
  verifiability: Verifiability;
  source: ProcedureItemSource;
}

const emptyDialog: DialogState = {
  open: false,
  level: 'phase',
  mode: 'create',
  parentId: 0,
  targetId: 0,
  name: '',
  severityId: 3,
  reference: '',
  description: '',
  verifiability: 'AUTO',
  source: 'FCOM',
};

interface DeleteState {
  level: Level;
  id: number | string;
}

export function ProcedureTree({
  version,
  readOnly,
}: {
  version: ProcedureVersionTree;
  readOnly: boolean;
}) {
  const { expandedNodes, toggleNode, selectedEventId, selectEvent, selectedNode, selectPhase } =
    useProcedureStore();

  const [dialog, setDialog] = useState<DialogState>(emptyDialog);
  const [toDelete, setToDelete] = useState<DeleteState | null>(null);

  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const deletePhase = useDeletePhase();
  const createSubPhase = useCreateSubPhase();
  const updateSubPhase = useUpdateSubPhase();
  const deleteSubPhase = useDeleteSubPhase();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const isExpanded = (key: string) => expandedNodes[key] ?? false;

  const openCreate = (level: Level, parentId: number) =>
    setDialog({ ...emptyDialog, open: true, mode: 'create', level, parentId });

  // Phase editing lives in the side panel (guided condition builder), not a modal.
  const openEditPhase = (p: Phase) => selectPhase(p.id);

  const openEditSubPhase = (s: SubPhase) =>
    setDialog({
      ...emptyDialog,
      open: true,
      mode: 'edit',
      level: 'subphase',
      parentId: s.phaseId,
      targetId: s.id,
      name: s.name,
    });

  const openEditItem = (it: ChecklistItem) =>
    setDialog({
      ...emptyDialog,
      open: true,
      mode: 'edit',
      level: 'item',
      parentId: it.subPhaseId,
      targetId: it.id,
      name: it.name,
      verifiability: it.verifiability,
      source: it.source,
    });

  const openEditEvent = (ev: ProcedureEvent, itemId: number) =>
    setDialog({
      ...emptyDialog,
      open: true,
      mode: 'edit',
      level: 'event',
      parentId: itemId,
      targetId: ev.id,
      name: ev.name,
      severityId: ev.severityId,
      reference: ev.reference ?? '',
      description: ev.description ?? '',
    });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleSubmit = () => {
    const { level, mode, parentId, targetId, name } = dialog;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const done = () => {
      toast.success('Saved');
      closeDialog();
    };

    if (level === 'phase') {
      // New phases start as checklist containers; the entry condition is set
      // afterwards in the side-panel builder.
      if (mode === 'create')
        createPhase.mutate(
          { procedureVersionId: parentId, name },
          { onSuccess: done }
        );
      else
        updatePhase.mutate(
          { id: targetId as number, data: { name } },
          { onSuccess: done }
        );
    } else if (level === 'subphase') {
      if (mode === 'create')
        createSubPhase.mutate({ phaseId: parentId, name }, { onSuccess: done });
      else
        updateSubPhase.mutate(
          { id: targetId as number, data: { name } },
          { onSuccess: done }
        );
    } else if (level === 'item') {
      if (mode === 'create')
        createItem.mutate(
          {
            subPhaseId: parentId,
            name,
            verifiability: dialog.verifiability,
            source: dialog.source,
          },
          { onSuccess: done }
        );
      else
        updateItem.mutate(
          {
            id: targetId as number,
            data: {
              name,
              verifiability: dialog.verifiability,
              source: dialog.source,
            },
          },
          { onSuccess: done }
        );
    } else {
      // event
      if (mode === 'create')
        createEvent.mutate(
          {
            checklistItemId: parentId,
            name,
            severityId: dialog.severityId,
            reference: dialog.reference || undefined,
            description: dialog.description || undefined,
          },
          { onSuccess: done }
        );
      else
        updateEvent.mutate(
          {
            id: targetId as string,
            data: {
              name,
              severityId: dialog.severityId,
              reference: dialog.reference || undefined,
              description: dialog.description || undefined,
            },
          },
          { onSuccess: done }
        );
    }
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    const done = () => {
      toast.success('Deleted');
      setToDelete(null);
    };
    const fail = () => setToDelete(null);
    const opts = { onSuccess: done, onError: fail };
    switch (toDelete.level) {
      case 'phase':
        deletePhase.mutate(toDelete.id as number, opts);
        break;
      case 'subphase':
        deleteSubPhase.mutate(toDelete.id as number, opts);
        break;
      case 'item':
        deleteItem.mutate(toDelete.id as number, opts);
        break;
      case 'event':
        deleteEvent.mutate(toDelete.id as string, opts);
        break;
    }
  };

  const Caret = ({ open }: { open: boolean }) =>
    open ? (
      <KeyboardArrowDownIcon fontSize="small" className="text-gray-400" />
    ) : (
      <KeyboardArrowRightIcon fontSize="small" className="text-gray-400" />
    );

  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <Typography variant="subtitle2" className="uppercase tracking-wide text-gray-600 font-bold">
          Procedures {version.aircraftModelCode}
        </Typography>
        <span className="text-xs text-gray-400">{version.phases.length} phases</span>
        <div className="flex-1" />
        {!readOnly && (
          <Button size="small" startIcon={<Add />} onClick={() => openCreate('phase', version.id)}>
            Phase
          </Button>
        )}
      </div>

      <div className="p-2">
        {version.phases.length === 0 && (
          <div className="p-4 text-sm text-gray-400">No phases yet.</div>
        )}
        {version.phases.map((phase) => {
          const pKey = `phase-${phase.id}`;
          const pOpen = isExpanded(pKey);
          const pSelected =
            selectedNode?.type === 'phase' && selectedNode.id === phase.id;
          return (
            <div key={pKey}>
              <div
                className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer font-bold ${
                  pSelected
                    ? 'bg-indigo-50 shadow-[inset_2px_0_0_#6366f1]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span onClick={() => toggleNode(pKey)} className="flex items-center">
                  <Caret open={pOpen} />
                </span>
                <span className="flex-1 truncate" onClick={() => toggleNode(pKey)}>
                  {phase.name}
                  <span className="ml-2 text-[10px] uppercase text-gray-400 font-bold">
                    · {phase.subPhases.length} subphases
                  </span>
                  {phase.entryExpr ? (
                    <span
                      className="ml-2 font-mono text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1 py-0.5 normal-case"
                      title="Condição de entrada da fase"
                    >
                      {phase.entryExpr}
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] uppercase text-gray-300 font-bold">
                      · container
                    </span>
                  )}
                </span>
                {!readOnly && (
                  <NodeActions
                    onAdd={() => openCreate('subphase', phase.id)}
                    onEdit={() => openEditPhase(phase)}
                    onDelete={() => setToDelete({ level: 'phase', id: phase.id })}
                  />
                )}
              </div>

              <Collapse in={pOpen} timeout="auto" unmountOnExit>
                {phase.subPhases.map((sub) => {
                  const sKey = `subphase-${sub.id}`;
                  const sOpen = isExpanded(sKey);
                  return (
                    <div key={sKey}>
                      <div className="group flex items-center gap-1 rounded-md pl-6 pr-2 py-1.5 hover:bg-gray-50 cursor-pointer font-semibold">
                        <span onClick={() => toggleNode(sKey)} className="flex items-center">
                          <Caret open={sOpen} />
                        </span>
                        <span className="flex-1 truncate" onClick={() => toggleNode(sKey)}>
                          {sub.name}
                        </span>
                        {!readOnly && (
                          <NodeActions
                            onAdd={() => openCreate('item', sub.id)}
                            onEdit={() => openEditSubPhase(sub)}
                            onDelete={() => setToDelete({ level: 'subphase', id: sub.id })}
                          />
                        )}
                      </div>

                      <Collapse in={sOpen} timeout="auto" unmountOnExit>
                        {sub.items.map((item) => {
                          const iKey = `item-${item.id}`;
                          const iOpen = isExpanded(iKey);
                          return (
                            <div key={iKey}>
                              <div className="group flex items-center gap-1 rounded-md pl-12 pr-2 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700">
                                <span onClick={() => toggleNode(iKey)} className="flex items-center">
                                  <Caret open={iOpen} />
                                </span>
                                <span className="flex-1 truncate" onClick={() => toggleNode(iKey)}>
                                  {item.name}
                                  <span className="ml-2 text-[10px] uppercase text-gray-400">
                                    {item.verifiability}
                                  </span>
                                </span>
                                {!readOnly && (
                                  <NodeActions
                                    onAdd={() => openCreate('event', item.id)}
                                    onEdit={() => openEditItem(item)}
                                    onDelete={() => setToDelete({ level: 'item', id: item.id })}
                                  />
                                )}
                              </div>

                              <Collapse in={iOpen} timeout="auto" unmountOnExit>
                                {item.events.map((ev) => {
                                  const selected = selectedEventId === ev.id;
                                  return (
                                    <div
                                      key={ev.id}
                                      onClick={() => selectEvent(ev.id)}
                                      className={`group flex items-center gap-2 rounded-md pl-[4.5rem] pr-2 py-1.5 cursor-pointer ${
                                        selected
                                          ? 'bg-indigo-50 shadow-[inset_2px_0_0_#6366f1]'
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className="text-sm">
                                        <SeverityIcon severity={ev.severityId} />
                                      </span>
                                      <span
                                        className={`flex-1 truncate text-sm ${
                                          selected ? 'text-indigo-700 font-semibold' : 'text-gray-600'
                                        }`}
                                      >
                                        {ev.name}
                                      </span>
                                      {ev.validationRules.map((r) => (
                                        <span
                                          key={r.id}
                                          className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded px-1"
                                        >
                                          {r.type.toLowerCase()}
                                        </span>
                                      ))}
                                      {!readOnly && (
                                        <NodeActions
                                          onEdit={() => openEditEvent(ev, item.id)}
                                          onDelete={() =>
                                            setToDelete({ level: 'event', id: ev.id })
                                          }
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </Collapse>
                            </div>
                          );
                        })}
                      </Collapse>
                    </div>
                  );
                })}
              </Collapse>
            </div>
          );
        })}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'create' ? 'Create' : 'Edit'} {dialog.level}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              fullWidth
              label="Name"
              value={dialog.name}
              onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
              required
            />

            {dialog.level === 'item' && (
              <div className="grid grid-cols-2 gap-4">
                <FormControl fullWidth>
                  <InputLabel>Verifiability</InputLabel>
                  <Select
                    value={dialog.verifiability}
                    label="Verifiability"
                    onChange={(e) =>
                      setDialog({
                        ...dialog,
                        verifiability: e.target.value as Verifiability,
                      })
                    }
                  >
                    {VERIFIABILITY_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={dialog.source}
                    label="Source"
                    onChange={(e) =>
                      setDialog({
                        ...dialog,
                        source: e.target.value as ProcedureItemSource,
                      })
                    }
                  >
                    {SOURCE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

            {dialog.level === 'event' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={dialog.severityId}
                    label="Severity"
                    onChange={(e) =>
                      setDialog({ ...dialog, severityId: Number(e.target.value) })
                    }
                  >
                    {SEVERITY_OPTIONS.map((id) => (
                      <MenuItem key={id} value={id}>
                        {SEVERITY_META[id].label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Reference (optional)"
                  value={dialog.reference}
                  onChange={(e) =>
                    setDialog({ ...dialog, reference: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={dialog.description}
                  onChange={(e) =>
                    setDialog({ ...dialog, description: e.target.value })
                  }
                  multiline
                  rows={2}
                />
              </>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {dialog.mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete this {toDelete?.level}? Children are removed too. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function NodeActions({
  onAdd,
  onEdit,
  onDelete,
}: {
  onAdd?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <span className="flex items-center opacity-0 group-hover:opacity-100">
      {onAdd && (
        <Tooltip title="Add child">
          <IconButton size="small" onClick={stop(onAdd)}>
            <Add fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Edit">
        <IconButton size="small" onClick={stop(onEdit)}>
          <Edit fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton size="small" color="error" onClick={stop(onDelete)}>
          <Delete fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  );
}
