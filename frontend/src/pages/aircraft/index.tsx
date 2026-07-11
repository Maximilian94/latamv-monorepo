import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createAircraft,
  getAircraftModels,
  getAircrafts,
  updateAircraft,
  type Aircraft,
} from '../../services/latam/aircraft.service';

const isNeo = (code: string) => /N$/i.test(code);

interface FormState {
  open: boolean;
  mode: 'create' | 'edit';
  registration: string;
  aircraftModelCode: string;
  type: string;
  engine: string;
  active: boolean;
}

const emptyForm: FormState = {
  open: false,
  mode: 'create',
  registration: '',
  aircraftModelCode: '',
  type: '',
  engine: '',
  active: true,
};

export function AircraftAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modelFilter, setModelFilter] = useState<string>('');

  const aircraftQuery = useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircrafts,
    staleTime: 60 * 1000,
  });
  const modelsQuery = useQuery({
    queryKey: ['aircraft-models'],
    queryFn: getAircraftModels,
    staleTime: 10 * 60 * 1000,
  });

  const aircrafts = useMemo(
    () => aircraftQuery.data?.data ?? [],
    [aircraftQuery.data]
  );
  const models = modelsQuery.data?.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    queryClient.invalidateQueries({ queryKey: ['aircraft-options'] });
  };

  const createMut = useMutation({
    mutationFn: createAircraft,
    onSuccess: () => {
      toast.success('Aeronave criada');
      invalidate();
      setForm(emptyForm);
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ registration, data }: { registration: string; data: Partial<Aircraft> }) =>
      updateAircraft(registration, data),
    onSuccess: () => invalidate(),
  });

  const toggleActive = (a: Aircraft) =>
    updateMut.mutate(
      { registration: a.registration, data: { active: !a.active } },
      { onSuccess: () => toast.success(`${a.registration} ${!a.active ? 'ativada' : 'desativada'}`) }
    );

  const openCreate = () =>
    setForm({ ...emptyForm, open: true, mode: 'create' });
  const openEdit = (a: Aircraft) =>
    setForm({
      open: true,
      mode: 'edit',
      registration: a.registration,
      aircraftModelCode: a.aircraftModelCode,
      type: a.type,
      engine: a.engine ?? '',
      active: a.active,
    });

  const submit = () => {
    if (!form.registration.trim() || !form.aircraftModelCode || !form.type.trim()) {
      toast.error('Matrícula, modelo e tipo são obrigatórios');
      return;
    }
    if (form.mode === 'create') {
      createMut.mutate({
        registration: form.registration.trim(),
        aircraftModelCode: form.aircraftModelCode,
        type: form.type.trim(),
        engine: form.engine.trim(),
        active: form.active,
      });
    } else {
      updateMut.mutate(
        {
          registration: form.registration,
          data: {
            aircraftModelCode: form.aircraftModelCode,
            type: form.type.trim(),
            engine: form.engine.trim(),
            active: form.active,
          },
        },
        {
          onSuccess: () => {
            toast.success('Aeronave atualizada');
            setForm(emptyForm);
          },
        }
      );
    }
  };

  const filtered = useMemo(
    () =>
      modelFilter
        ? aircrafts.filter((a) => a.aircraftModelCode === modelFilter)
        : aircrafts,
    [aircrafts, modelFilter]
  );

  const countByCode = useMemo(() => {
    const m: Record<string, { total: number; active: number }> = {};
    for (const a of aircrafts) {
      m[a.aircraftModelCode] ??= { total: 0, active: 0 };
      m[a.aircraftModelCode].total++;
      if (a.active) m[a.aircraftModelCode].active++;
    }
    return m;
  }, [aircrafts]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <Typography variant="h5" className="font-bold">
            Aeronaves
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie o efetivo — adicione, edite e ative/desative aeronaves.
          </Typography>
        </div>
        <div className="flex-1" />
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Adicionar aeronave
        </Button>
      </div>

      {/* per-model summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip
          label={`Todas · ${aircrafts.length}`}
          color={modelFilter === '' ? 'primary' : 'default'}
          onClick={() => setModelFilter('')}
          variant={modelFilter === '' ? 'filled' : 'outlined'}
        />
        {Object.entries(countByCode)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, c]) => (
            <Chip
              key={code}
              label={`${code}${isNeo(code) ? ' NEO' : ''} · ${c.active}/${c.total} ativas`}
              color={modelFilter === code ? 'primary' : 'default'}
              variant={modelFilter === code ? 'filled' : 'outlined'}
              onClick={() => setModelFilter(code)}
            />
          ))}
      </div>

      {aircraftQuery.isLoading && <Typography>Carregando…</Typography>}
      {aircraftQuery.isError && (
        <Typography color="error">
          Não foi possível carregar as aeronaves. Atualize a página.
        </Typography>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
              <th className="px-3 py-2">Matrícula</th>
              <th className="px-3 py-2">Modelo</th>
              <th className="px-3 py-2">Variante</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Motor</th>
              <th className="px-3 py-2">Ativa</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.registration} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-semibold">{a.registration}</td>
                <td className="px-3 py-2">
                  {a.aircraftModel?.model ?? a.aircraftModelCode}
                </td>
                <td className="px-3 py-2">
                  <Chip
                    size="small"
                    label={isNeo(a.aircraftModelCode) ? 'NEO' : 'CEO'}
                    color={isNeo(a.aircraftModelCode) ? 'success' : 'default'}
                    variant="outlined"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-gray-600">{a.type}</td>
                <td className="px-3 py-2 text-gray-600">{a.engine || '—'}</td>
                <td className="px-3 py-2">
                  <Switch
                    checked={a.active}
                    onChange={() => toggleActive(a)}
                    size="small"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="small" startIcon={<Edit />} onClick={() => openEdit(a)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {!aircraftQuery.isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  Nenhuma aeronave.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* create / edit dialog */}
      <Dialog open={form.open} onClose={() => setForm(emptyForm)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.mode === 'create' ? 'Adicionar aeronave' : `Editar ${form.registration}`}
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4 pt-2">
            <TextField
              label="Matrícula"
              value={form.registration}
              disabled={form.mode === 'edit'}
              onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value.toUpperCase() }))}
              placeholder="PR-XBA"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Modelo</InputLabel>
              <Select
                label="Modelo"
                value={form.aircraftModelCode}
                onChange={(e) => setForm((f) => ({ ...f, aircraftModelCode: e.target.value }))}
              >
                {models.map((m) => (
                  <MenuItem key={m.code} value={m.code}>
                    {m.model} ({m.code}){isNeo(m.code) ? ' · NEO' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Tipo (designador Airbus/Boeing)"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="320-271N"
              fullWidth
            />
            <TextField
              label="Motor (opcional)"
              value={form.engine}
              onChange={(e) => setForm((f) => ({ ...f, engine: e.target.value }))}
              fullWidth
            />
            <label className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <span>Ativa (disponível para escalas)</span>
            </label>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(emptyForm)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={createMut.isPending || updateMut.isPending}
          >
            {form.mode === 'create' ? 'Criar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
