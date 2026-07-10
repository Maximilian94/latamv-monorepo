import { useState } from 'react';
import {
  Button,
  Chip,
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
  useTestRule,
} from '../../hooks';
import type {
  ChecklistItem,
  Dataref,
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
  entryExpr: string;
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
  entryExpr: '',
};

interface DeleteState {
  level: Level;
  id: number | string;
}

export function ProcedureTree({
  version,
  readOnly,
  datarefs = [],
}: {
  version: ProcedureVersionTree;
  readOnly: boolean;
  datarefs?: Dataref[];
}) {
  const { expandedNodes, toggleNode, selectedEventId, selectEvent } =
    useProcedureStore();

  const [dialog, setDialog] = useState<DialogState>(emptyDialog);
  const [toDelete, setToDelete] = useState<DeleteState | null>(null);
  const [phaseFrame, setPhaseFrame] = useState<string>('{}');
  const testRule = useTestRule();

  // A sample telemetry snapshot for the "Test" button: every catalog alias at 0.
  // The user edits the few values relevant to the phase they are describing.
  const buildPhaseFrame = () =>
    JSON.stringify(
      Object.fromEntries(datarefs.map((d) => [d.alias, 0])),
      null,
      2,
    );

  const handleTestPhase = () => {
    let frame: Record<string, number>;
    try {
      frame = JSON.parse(phaseFrame);
    } catch {
      toast.error('Invalid JSON frame');
      return;
    }
    if (!dialog.entryExpr.trim()) {
      toast.error('Empty condition — nothing to test');
      return;
    }
    testRule.mutate({ expr: dialog.entryExpr.trim(), frame });
  };

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

  const openCreate = (level: Level, parentId: number) => {
    testRule.reset();
    if (level === 'phase') setPhaseFrame(buildPhaseFrame());
    setDialog({ ...emptyDialog, open: true, mode: 'create', level, parentId });
  };

  const openEditPhase = (p: Phase) => {
    testRule.reset();
    setPhaseFrame(buildPhaseFrame());
    setDialog({
      ...emptyDialog,
      open: true,
      mode: 'edit',
      level: 'phase',
      parentId: version.id,
      targetId: p.id,
      name: p.name,
      entryExpr: p.entryExpr ?? '',
    });
  };

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
      // Empty string clears the condition (phase becomes a checklist container).
      const entryExpr = dialog.entryExpr.trim();
      if (mode === 'create')
        createPhase.mutate(
          { procedureVersionId: parentId, name, entryExpr: entryExpr || undefined },
          { onSuccess: done }
        );
      else
        updatePhase.mutate(
          { id: targetId as number, data: { name, entryExpr } },
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
          return (
            <div key={pKey}>
              <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-gray-50 cursor-pointer font-bold">
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

            {dialog.level === 'phase' && (
              <div className="space-y-3">
                <TextField
                  fullWidth
                  label="Entry condition (mini-DSL)"
                  placeholder="e.g. qpac_phase == 3"
                  value={dialog.entryExpr}
                  onChange={(e) =>
                    setDialog({ ...dialog, entryExpr: e.target.value })
                  }
                  multiline
                  minRows={2}
                  InputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                  helperText="O voo entra nesta fase quando isto for verdadeiro (usa a fase de maior ordem que casa). Vazio = só contêiner de checklist, não é um estado de voo."
                />

                {datarefs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] uppercase tracking-wide text-gray-400 font-bold mr-1">
                      Aliases
                    </span>
                    {datarefs.map((d) => (
                      <Tooltip
                        key={d.id}
                        title={`${d.datarefName}${d.unit ? ` (${d.unit})` : ''}`}
                      >
                        <Chip
                          label={d.alias}
                          size="small"
                          variant="outlined"
                          className="font-mono"
                          onClick={() =>
                            setDialog((prev) => ({
                              ...prev,
                              entryExpr: prev.entryExpr
                                ? `${prev.entryExpr} ${d.alias}`
                                : d.alias,
                            }))
                          }
                        />
                      </Tooltip>
                    ))}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs text-gray-500">
                      Testar com um frame de exemplo
                    </span>
                    <div className="flex-1" />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleTestPhase}
                      disabled={testRule.isPending}
                    >
                      Testar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-3 border-b md:border-b-0 md:border-r border-gray-200">
                      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                        Frame de entrada
                      </h4>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={10}
                        value={phaseFrame}
                        onChange={(e) => setPhaseFrame(e.target.value)}
                        InputProps={{
                          style: { fontFamily: 'monospace', fontSize: 12 },
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                        Resultado
                      </h4>
                      {!testRule.data && (
                        <div className="text-sm text-gray-400">
                          Rode o teste para ver o resultado.
                        </div>
                      )}
                      {testRule.data && (
                        <div>
                          <span
                            className={`inline-flex items-center gap-2 font-bold px-3 py-1 rounded ${
                              testRule.data.result
                                ? 'bg-green-50 text-green-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {testRule.data.result
                              ? '✓ está nesta fase'
                              : '— não está nesta fase'}
                          </span>
                          {testRule.data.error && (
                            <div className="text-xs text-red-500 mt-2">
                              {testRule.data.error}
                            </div>
                          )}
                          <pre className="text-[11px] font-mono text-gray-500 mt-2 overflow-x-auto">
                            {JSON.stringify(testRule.data.resolved, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
