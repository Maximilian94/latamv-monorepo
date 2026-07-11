import { useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { Add, Close, Delete, PlayArrow } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useUpdatePhase, useDeletePhase, useTestRule } from '../../hooks';
import type { Dataref, Phase } from '../../services/latam/procedures.service';
import { OPERATORS, parseSimpleExpr } from './constants';

type Connector = '&&' | '||';

interface Condition {
  alias: string;
  operator: string;
  value: string;
}

/** Round-trip a flat `a OP v && b OP w` / `|| ` expression into the guided
 *  builder. Anything nested/parenthesised/mixed returns null → advanced mode. */
function parsePhaseExpr(
  expr: string,
): { connector: Connector; conditions: Condition[] } | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;
  if (trimmed.includes('(') || trimmed.includes(')')) return null;
  const hasAnd = trimmed.includes('&&');
  const hasOr = trimmed.includes('||');
  if (hasAnd && hasOr) return null; // mixed precedence → advanced
  const connector: Connector = hasOr ? '||' : '&&';
  const parts = trimmed.split(connector === '||' ? '||' : '&&');
  const conditions: Condition[] = [];
  for (const part of parts) {
    const parsed = parseSimpleExpr(part);
    if (!parsed) return null;
    conditions.push(parsed);
  }
  return { connector, conditions };
}

export function PhaseEditor({
  phase,
  datarefs,
  readOnly,
  onDeleted,
}: {
  phase: Phase;
  datarefs: Dataref[];
  readOnly: boolean;
  onDeleted: () => void;
}) {
  const initial = parsePhaseExpr(phase.entryExpr ?? '');

  const [name, setName] = useState(phase.name);
  const [connector, setConnector] = useState<Connector>(
    initial?.connector ?? '&&',
  );
  const [conditions, setConditions] = useState<Condition[]>(
    initial?.conditions ?? [],
  );
  const [advanced, setAdvanced] = useState(
    !!phase.entryExpr && !initial, // only fall to advanced when we can't round-trip
  );
  const [advancedExpr, setAdvancedExpr] = useState(phase.entryExpr ?? '');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updatePhase = useUpdatePhase();
  const deletePhase = useDeletePhase();
  const testRule = useTestRule();

  const guidedExpr = useMemo(
    () =>
      conditions
        .filter((c) => c.alias)
        .map((c) => `${c.alias} ${c.operator} ${c.value}`)
        .join(` ${connector} `),
    [conditions, connector],
  );

  const effectiveExpr = advanced ? advancedExpr.trim() : guidedExpr;
  const isContainer = effectiveExpr.length === 0;

  // Aliases the condition actually mentions → the only fields the test needs.
  const citedAliases = useMemo(() => {
    if (!advanced) {
      return Array.from(
        new Set(conditions.map((c) => c.alias).filter(Boolean)),
      );
    }
    return datarefs
      .map((d) => d.alias)
      .filter((a) => new RegExp(`\\b${a.replace(/[[\]]/g, '\\$&')}\\b`).test(advancedExpr));
  }, [advanced, conditions, advancedExpr, datarefs]);

  const setCondition = (i: number, patch: Partial<Condition>) =>
    setConditions((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addCondition = () =>
    setConditions((cs) => [
      ...cs,
      { alias: datarefs[0]?.alias ?? '', operator: '==', value: '1' },
    ]);
  const removeCondition = (i: number) =>
    setConditions((cs) => cs.filter((_, idx) => idx !== i));

  const handleTest = () => {
    if (isContainer) {
      toast.error('Sem condição — nada para testar');
      return;
    }
    const frame: Record<string, number> = {};
    for (const a of citedAliases) frame[a] = Number(testValues[a] ?? 0) || 0;
    testRule.mutate({ expr: effectiveExpr, frame });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    updatePhase.mutate(
      { id: phase.id, data: { name: name.trim(), entryExpr: effectiveExpr } },
      { onSuccess: () => toast.success('Fase salva') },
    );
  };

  const handleDelete = () =>
    deletePhase.mutate(phase.id, {
      onSuccess: () => {
        toast.success('Fase removida');
        onDeleted();
      },
    });

  const testResult = testRule.data;

  return (
    <div className="border border-gray-200 rounded-xl bg-white flex flex-col">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span>Fase de voo</span>
          <span>·</span>
          <span>ordem {phase.order}</span>
        </div>
        <TextField
          fullWidth
          variant="standard"
          value={name}
          disabled={readOnly}
          onChange={(e) => setName(e.target.value)}
          InputProps={{ style: { fontSize: 24, fontWeight: 700 } }}
        />
        <div className="mt-2">
          {isContainer ? (
            <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-500">
              contêiner de checklist — não é um estado de voo
            </span>
          ) : (
            <span className="text-xs bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 text-indigo-600">
              estado de voo — o voo entra aqui quando a condição é verdadeira
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* guided builder */}
        <Section title="O voo entra nesta fase quando">
          {!advanced && (
            <div className="flex flex-col gap-2">
              {conditions.length === 0 && (
                <div className="text-sm text-gray-400">
                  Sem condição. A fase é só um contêiner de checklist. Adicione
                  uma condição para torná-la um estado de voo.
                </div>
              )}
              {conditions.map((c, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {i > 0 && (
                    <div className="flex items-center gap-2 pl-1">
                      <ConnectorToggle
                        value={connector}
                        disabled={readOnly}
                        onChange={setConnector}
                      />
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <FormControl size="small" className="min-w-[170px] flex-1">
                      <InputLabel>Dataref</InputLabel>
                      <Select
                        value={datarefs.some((d) => d.alias === c.alias) ? c.alias : ''}
                        label="Dataref"
                        disabled={readOnly}
                        onChange={(e) => setCondition(i, { alias: e.target.value })}
                      >
                        {datarefs.length === 0 && (
                          <MenuItem value="" disabled>
                            Catálogo vazio
                          </MenuItem>
                        )}
                        {datarefs.map((d) => (
                          <MenuItem key={d.id} value={d.alias}>
                            {d.alias}
                            {d.unit ? ` (${d.unit})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" className="min-w-[80px]">
                      <InputLabel>Op</InputLabel>
                      <Select
                        value={c.operator}
                        label="Op"
                        disabled={readOnly}
                        onChange={(e) => setCondition(i, { operator: e.target.value })}
                      >
                        {OPERATORS.map((op) => (
                          <MenuItem key={op} value={op}>
                            {op}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="Valor"
                      className="w-24"
                      value={c.value}
                      disabled={readOnly}
                      onChange={(e) => setCondition(i, { value: e.target.value })}
                    />
                    {!readOnly && (
                      <Tooltip title="Remover condição">
                        <IconButton size="small" onClick={() => removeCondition(i)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
              {!readOnly && (
                <div>
                  <Button size="small" startIcon={<Add />} onClick={addCondition}>
                    Adicionar condição
                  </Button>
                </div>
              )}
            </div>
          )}

          {advanced && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={advancedExpr}
              disabled={readOnly}
              placeholder="qpac_phase == 1 && (eng1_master == 1 || eng2_master == 1)"
              onChange={(e) => setAdvancedExpr(e.target.value)}
              InputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          )}

          {/* resulting expression + advanced toggle */}
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 truncate">
              {effectiveExpr || '— (contêiner, sem condição)'}
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              Avançado
              <Switch
                size="small"
                checked={advanced}
                disabled={readOnly}
                onChange={(e) => {
                  const on = e.target.checked;
                  if (on) {
                    // guided → advanced: carry the current expression across
                    if (!advancedExpr.trim()) setAdvancedExpr(guidedExpr);
                    setAdvanced(true);
                  } else {
                    // advanced → guided only if it round-trips
                    const p = parsePhaseExpr(advancedExpr);
                    if (!p && advancedExpr.trim()) {
                      toast.error(
                        'Expressão avançada demais para o construtor (parênteses ou && e || juntos). Mantendo modo avançado.',
                      );
                      return;
                    }
                    if (p) {
                      setConnector(p.connector);
                      setConditions(p.conditions);
                    } else {
                      setConditions([]);
                    }
                    setAdvanced(false);
                  }
                }}
              />
            </label>
          </div>
        </Section>

        {/* test */}
        <Section title="Testar">
          {citedAliases.length === 0 ? (
            <div className="text-sm text-gray-400">
              Defina uma condição para testar com valores de exemplo.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {citedAliases.map((a) => (
                <TextField
                  key={a}
                  size="small"
                  label={a}
                  className="w-32"
                  value={testValues[a] ?? ''}
                  placeholder="0"
                  onChange={(e) =>
                    setTestValues((v) => ({ ...v, [a]: e.target.value }))
                  }
                  InputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                />
              ))}
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleTest}
                disabled={testRule.isPending}
              >
                Testar
              </Button>
              {testResult && (
                <span
                  className={`inline-flex items-center gap-1 font-bold text-sm px-3 py-1 rounded ${
                    testResult.result
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {testResult.result ? '✓ está nesta fase' : '— não está nesta fase'}
                </span>
              )}
            </div>
          )}
          {testResult?.error && (
            <div className="text-xs text-red-500">{testResult.error}</div>
          )}
        </Section>
      </div>

      {/* footer */}
      {!readOnly && (
        <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-3">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updatePhase.isPending}
          >
            Salvar
          </Button>
          <div className="flex-1" />
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Remover a fase?</span>
              <Button size="small" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button
                size="small"
                color="error"
                variant="contained"
                onClick={handleDelete}
                disabled={deletePhase.isPending}
              >
                Remover
              </Button>
            </div>
          ) : (
            <Button
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => setConfirmDelete(true)}
            >
              Remover fase
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectorToggle({
  value,
  disabled,
  onChange,
}: {
  value: Connector;
  disabled?: boolean;
  onChange: (v: Connector) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs font-bold">
      {(['&&', '||'] as Connector[]).map((c) => (
        <button
          key={c}
          disabled={disabled}
          onClick={() => onChange(c)}
          className={`px-3 py-1 ${
            value === c
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          } disabled:opacity-60`}
        >
          {c === '&&' ? 'E' : 'OU'}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
        {title}
        <span className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  );
}
