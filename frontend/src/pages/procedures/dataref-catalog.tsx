import { useMemo, useState } from 'react';
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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
import { Add, Delete, Edit, Inventory2, Memory } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useProcedurePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  useCreateDataref,
  useUpdateDataref,
  useDeleteDataref,
} from '../../hooks';
import type {
  AircraftPackage,
  Dataref,
} from '../../services/latam/procedures.service';

const AIRCRAFT_MODELS = ['A320', 'A321', 'A319', 'B737', 'B738'];
const VALUE_TYPES = ['float', 'int', 'bool'] as const;

const emptyPackageForm = { code: '', model: 'A320', author: '', description: '' };
const emptyDatarefForm = {
  alias: '',
  datarefName: '',
  valueType: 'float' as string,
  isArray: false,
  arrayIndex: 0,
  unit: '',
  description: '',
};

/**
 * Dataref Catalog manager: register aircraft packages and, inside each, the
 * datarefs the rules reference. Every dataref gets a friendly `alias` (the name
 * used in rule expressions), the real X-Plane `datarefName`, a value type, an
 * optional array index (for array datarefs), and an optional unit/description.
 *
 * Anything saved here shows up immediately in the rule builder's alias dropdown
 * (both read the same `['procedure-packages']` query).
 */
export function DatarefCatalogPage() {
  const { data: packages, isLoading } = useProcedurePackages();

  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const createDataref = useCreateDataref();
  const updateDataref = useUpdateDataref();
  const deleteDataref = useDeleteDataref();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = useMemo<AircraftPackage | null>(() => {
    if (!packages || packages.length === 0) return null;
    return packages.find((p) => p.id === selectedId) ?? packages[0];
  }, [packages, selectedId]);

  // ---- package dialog ----
  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgEditId, setPkgEditId] = useState<number | null>(null);
  const [pkgForm, setPkgForm] = useState(emptyPackageForm);

  const openNewPackage = () => {
    setPkgEditId(null);
    setPkgForm(emptyPackageForm);
    setPkgOpen(true);
  };
  const openEditPackage = (p: AircraftPackage) => {
    setPkgEditId(p.id);
    setPkgForm({
      code: p.code,
      model: p.model,
      author: p.author ?? '',
      description: p.description ?? '',
    });
    setPkgOpen(true);
  };
  const savePackage = () => {
    if (!pkgForm.code.trim() || !pkgForm.model.trim()) {
      toast.error('Code and model are required');
      return;
    }
    const data = {
      code: pkgForm.code.trim(),
      model: pkgForm.model.trim(),
      author: pkgForm.author.trim() || undefined,
      description: pkgForm.description.trim() || undefined,
    };
    if (pkgEditId != null) {
      updatePackage.mutate(
        { id: pkgEditId, data },
        { onSuccess: () => (toast.success('Package updated'), setPkgOpen(false)) }
      );
    } else {
      createPackage.mutate(data, {
        onSuccess: (created) => {
          toast.success('Package created');
          setPkgOpen(false);
          setSelectedId(created.id);
        },
      });
    }
  };

  // ---- dataref dialog ----
  const [drOpen, setDrOpen] = useState(false);
  const [drEditId, setDrEditId] = useState<number | null>(null);
  const [drForm, setDrForm] = useState(emptyDatarefForm);

  const openNewDataref = () => {
    setDrEditId(null);
    setDrForm(emptyDatarefForm);
    setDrOpen(true);
  };
  const openEditDataref = (d: Dataref) => {
    setDrEditId(d.id);
    setDrForm({
      alias: d.alias,
      datarefName: d.datarefName,
      valueType: d.valueType,
      isArray: d.arrayIndex != null,
      arrayIndex: d.arrayIndex ?? 0,
      unit: d.unit ?? '',
      description: d.description ?? '',
    });
    setDrOpen(true);
  };
  const saveDataref = () => {
    if (!selected) return;
    if (!drForm.alias.trim() || !drForm.datarefName.trim()) {
      toast.error('Alias and dataref name are required');
      return;
    }
    const data = {
      alias: drForm.alias.trim(),
      datarefName: drForm.datarefName.trim(),
      valueType: drForm.valueType,
      arrayIndex: drForm.isArray ? drForm.arrayIndex : undefined,
      unit: drForm.unit.trim() || undefined,
      description: drForm.description.trim() || undefined,
    };
    if (drEditId != null) {
      updateDataref.mutate(
        { id: drEditId, data },
        { onSuccess: () => (toast.success('Dataref updated'), setDrOpen(false)) }
      );
    } else {
      createDataref.mutate(
        { packageId: selected.id, ...data },
        { onSuccess: () => (toast.success('Dataref added'), setDrOpen(false)) }
      );
    }
  };

  // ---- delete confirmations ----
  const [delPkg, setDelPkg] = useState<AircraftPackage | null>(null);
  const [delDr, setDelDr] = useState<Dataref | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-bold">
            Dataref Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register the aircraft datarefs your validation rules reference
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          {packages && packages.length > 0 && (
            <FormControl size="small" className="min-w-[220px]">
              <InputLabel>Package</InputLabel>
              <Select
                value={selected?.id ?? ''}
                label="Package"
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {packages.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.code} · {p.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button variant="contained" startIcon={<Add />} onClick={openNewPackage}>
            New Package
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Typography>Loading catalog…</Typography>
      ) : !selected ? (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-8 text-center">
            <Inventory2 className="text-indigo-400" style={{ fontSize: 48 }} />
            <Typography variant="h6" className="mt-2">
              No aircraft package yet
            </Typography>
            <Typography color="text.secondary" className="mb-4">
              Create a package (e.g. “A320-ToLiss”) to start cataloguing its datarefs.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openNewPackage}>
              Create the first package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* selected package summary */}
          <Card>
            <CardContent className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Memory className="text-indigo-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <Typography variant="h6" className="font-semibold">
                      {selected.code}
                    </Typography>
                    <Chip label={selected.model} size="small" color="primary" />
                    <Chip
                      label={`${selected.datarefs.length} datarefs`}
                      size="small"
                      variant="outlined"
                    />
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    {selected.description || 'No description'}
                    {selected.author ? ` · by ${selected.author}` : ''}
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button startIcon={<Edit />} onClick={() => openEditPackage(selected)}>
                  Edit
                </Button>
                <Button
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDelPkg(selected)}
                >
                  Delete
                </Button>
                <Button variant="contained" startIcon={<Add />} onClick={openNewDataref}>
                  New Dataref
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* datarefs table */}
          <Card>
            <CardContent className="p-0">
              <TableContainer component={Paper} className="shadow-none">
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-semibold">Alias</TableCell>
                      <TableCell className="font-semibold">Dataref (X-Plane)</TableCell>
                      <TableCell className="font-semibold">Type</TableCell>
                      <TableCell className="font-semibold">Array idx</TableCell>
                      <TableCell className="font-semibold">Unit</TableCell>
                      <TableCell className="font-semibold">Description</TableCell>
                      <TableCell className="font-semibold" align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.datarefs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" className="py-4">
                            No datarefs yet — add the first one so rules can use it.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...selected.datarefs]
                        .sort((a, b) => a.alias.localeCompare(b.alias))
                        .map((d) => (
                          <TableRow key={d.id} hover>
                            <TableCell>
                              <code className="text-indigo-700 font-medium">{d.alias}</code>
                            </TableCell>
                            <TableCell>
                              <code className="text-gray-600 text-xs">{d.datarefName}</code>
                            </TableCell>
                            <TableCell>
                              <Chip label={d.valueType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {d.arrayIndex != null ? (
                                <Chip label={`[${d.arrayIndex}]`} size="small" color="secondary" />
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>{d.unit || <span className="text-gray-400">—</span>}</TableCell>
                            <TableCell className="max-w-[240px] truncate">
                              {d.description || <span className="text-gray-400">—</span>}
                            </TableCell>
                            <TableCell align="right">
                              <div className="flex justify-end">
                                <Tooltip title="Edit">
                                  <IconButton size="small" color="primary" onClick={() => openEditDataref(d)}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => setDelDr(d)}>
                                    <Delete fontSize="small" />
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
        </>
      )}

      {/* ---- package dialog ---- */}
      <Dialog open={pkgOpen} onClose={() => setPkgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{pkgEditId != null ? 'Edit Package' : 'New Aircraft Package'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              fullWidth
              label="Code"
              placeholder="A320-ToLiss"
              value={pkgForm.code}
              onChange={(e) => setPkgForm({ ...pkgForm, code: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Aircraft model</InputLabel>
              <Select
                value={pkgForm.model}
                label="Aircraft model"
                onChange={(e) => setPkgForm({ ...pkgForm, model: e.target.value })}
              >
                {AIRCRAFT_MODELS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Author (optional)"
              value={pkgForm.author}
              onChange={(e) => setPkgForm({ ...pkgForm, author: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              multiline
              minRows={2}
              value={pkgForm.description}
              onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPkgOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={savePackage}
            disabled={createPackage.isPending || updatePackage.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- dataref dialog ---- */}
      <Dialog open={drOpen} onClose={() => setDrOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{drEditId != null ? 'Edit Dataref' : 'New Dataref'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              fullWidth
              label="Alias (name used in rules)"
              placeholder="groundspeed_kt"
              value={drForm.alias}
              onChange={(e) => setDrForm({ ...drForm, alias: e.target.value })}
              helperText="Friendly name your rule expressions reference"
            />
            <TextField
              fullWidth
              label="Dataref name (X-Plane)"
              placeholder="sim/flightmodel2/position/groundspeed"
              value={drForm.datarefName}
              onChange={(e) => setDrForm({ ...drForm, datarefName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth>
                <InputLabel>Value type</InputLabel>
                <Select
                  value={drForm.valueType}
                  label="Value type"
                  onChange={(e) => setDrForm({ ...drForm, valueType: e.target.value })}
                >
                  {VALUE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Unit (optional)"
                placeholder="kt, ft, psi…"
                value={drForm.unit}
                onChange={(e) => setDrForm({ ...drForm, unit: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={drForm.isArray}
                    onChange={(e) => setDrForm({ ...drForm, isArray: e.target.checked })}
                  />
                }
                label="Array dataref"
              />
              {drForm.isArray && (
                <TextField
                  label="Array index"
                  type="number"
                  size="small"
                  value={drForm.arrayIndex}
                  onChange={(e) =>
                    setDrForm({ ...drForm, arrayIndex: parseInt(e.target.value) || 0 })
                  }
                  className="w-32"
                  helperText="Which element to read"
                />
              )}
            </div>
            <TextField
              fullWidth
              label="Description (optional)"
              multiline
              minRows={2}
              value={drForm.description}
              onChange={(e) => setDrForm({ ...drForm, description: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveDataref}
            disabled={createDataref.isPending || updateDataref.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- delete package ---- */}
      <Dialog open={delPkg != null} onClose={() => setDelPkg(null)}>
        <DialogTitle>Delete package?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <b>{delPkg?.code}</b> and all {delPkg?.datarefs.length} of its datarefs?
            Rules that reference those aliases will no longer resolve. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelPkg(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletePackage.isPending}
            onClick={() =>
              delPkg &&
              deletePackage.mutate(delPkg.id, {
                onSuccess: () => {
                  toast.success('Package deleted');
                  setSelectedId(null);
                  setDelPkg(null);
                },
                onError: () => setDelPkg(null),
              })
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- delete dataref ---- */}
      <Dialog open={delDr != null} onClose={() => setDelDr(null)}>
        <DialogTitle>Delete dataref?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete alias <code>{delDr?.alias}</code>? Rules using it will stop resolving.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDr(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteDataref.isPending}
            onClick={() =>
              delDr &&
              deleteDataref.mutate(delDr.id, {
                onSuccess: () => {
                  toast.success('Dataref deleted');
                  setDelDr(null);
                },
                onError: () => setDelDr(null),
              })
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
