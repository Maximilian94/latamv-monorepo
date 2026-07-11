import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Close, PlayArrow } from '@mui/icons-material';
import toast from 'react-hot-toast';
import SeverityIcon from '../../components/severity/severityIcon/severityIcon';
import {
  useCreateRule,
  useUpdateRule,
  useUpdateEvent,
  useUpdateItem,
  useTestRule,
} from '../../hooks';
import type {
  ChecklistItem,
  Dataref,
  ProcedureEvent,
  ValidationRuleType,
  Verifiability,
} from '../../services/latam/procedures.service';
import {
  OPERATORS,
  parseSimpleExpr,
  RULE_TYPES,
  SEVERITY_META,
  SEVERITY_OPTIONS,
  VERIFIABILITY_OPTIONS,
} from './constants';

export function RuleEditor({
  event,
  item,
  phaseName,
  subPhaseName,
  phaseNames,
  datarefs,
  readOnly,
}: {
  event: ProcedureEvent;
  item: ChecklistItem;
  phaseName: string;
  subPhaseName: string;
  phaseNames: string[];
  datarefs: Dataref[];
  readOnly: boolean;
}) {
  const existingRule = event.validationRules[0];
  const parsed = existingRule ? parseSimpleExpr(existingRule.expr) : null;

  const [ruleType, setRuleType] = useState<ValidationRuleType>(
    existingRule?.type ?? 'SNAPSHOT'
  );
  const [phase, setPhase] = useState<string>(
    existingRule?.phase ?? phaseNames[0] ?? phaseName
  );
  const [alias, setAlias] = useState<string>(
    parsed?.alias ?? datarefs[0]?.alias ?? ''
  );
  const [operator, setOperator] = useState<string>(parsed?.operator ?? '>');
  const [value, setValue] = useState<string>(parsed?.value ?? '0');
  const [graceMs, setGraceMs] = useState<string>(
    existingRule?.params && typeof existingRule.params.graceMs === 'number'
      ? String(existingRule.params.graceMs)
      : '0'
  );
  const [severityId, setSeverityId] = useState<number>(event.severityId);
  const [verifiability, setVerifiability] = useState<Verifiability>(
    item.verifiability
  );
  const [advanced, setAdvanced] = useState<boolean>(!parsed && !!existingRule);
  const [details, setDetails] = useState<string[]>(
    Array.isArray(existingRule?.details)
      ? (existingRule?.details as string[])
      : []
  );
  const [advancedExpr, setAdvancedExpr] = useState<string>(
    existingRule?.expr ?? ''
  );
  const [frameJson, setFrameJson] = useState<string>(
    '{\n  "phase": 0,\n  "' + (alias || 'value') + '": 0\n}'
  );

  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const updateEvent = useUpdateEvent();
  const updateItem = useUpdateItem();
  const testRule = useTestRule();

  const effectiveExpr = useMemo(
    () => (advanced ? advancedExpr : `${alias} ${operator} ${value}`),
    [advanced, advancedExpr, alias, operator, value]
  );

  const aliases = useMemo(() => {
    const base = advanced ? details : [alias, ...details];
    return Array.from(new Set(base.filter(Boolean)));
  }, [advanced, alias, details]);

  const selectedDataref = datarefs.find((d) => d.alias === alias);
  const severityMeta = SEVERITY_META[severityId];

  const addDetail = (a: string) =>
    setDetails((d) => (d.includes(a) ? d : [...d, a]));
  const removeDetail = (a: string) =>
    setDetails((d) => d.filter((x) => x !== a));

  const handleTest = () => {
    let frame: Record<string, number>;
    try {
      frame = JSON.parse(frameJson);
    } catch {
      toast.error('Invalid JSON frame');
      return;
    }
    testRule.mutate({ expr: effectiveExpr, frame });
  };

  const handleSave = () => {
    const params = { graceMs: Number(graceMs) || 0 };

    const afterRule = () => toast.success('Rule saved');

    // 1. severity change on the event
    if (severityId !== event.severityId) {
      updateEvent.mutate({ id: event.id, data: { severityId } });
    }
    // 2. verifiability change on the item
    if (verifiability !== item.verifiability) {
      updateItem.mutate({ id: item.id, data: { verifiability } });
    }
    // 3. create or update the rule
    const rulePayload = {
      type: ruleType,
      phase,
      aliases,
      expr: effectiveExpr,
      params,
      details,
    };
    if (existingRule) {
      updateRule.mutate(
        { id: existingRule.id, data: rulePayload },
        { onSuccess: afterRule }
      );
    } else {
      createRule.mutate(
        { eventId: event.id, ...rulePayload },
        { onSuccess: afterRule }
      );
    }
  };

  const testResult = testRule.data;

  return (
    <div className="border border-gray-200 rounded-xl bg-white flex flex-col">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap mb-1">
          <b className="text-gray-500">{phaseName}</b>
          <span>›</span>
          <b className="text-gray-500">{subPhaseName}</b>
          <span>›</span>
          <b className="text-gray-500">{item.name}</b>
          <span>›</span>
          <span>Event</span>
        </div>
        <Typography variant="h5" className="font-bold">
          {event.name}
        </Typography>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`flex items-center gap-1 text-sm ${severityMeta?.text}`}>
            <SeverityIcon severity={severityId} />
            {severityMeta?.label}
            {event.severity && (
              <span className="text-gray-400"> · {event.severity.points} pt</span>
            )}
          </span>
          <span className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-600">
            {item.source}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* rule type */}
        <Section title="Rule type">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RULE_TYPES.map((rt) => {
              const active = ruleType === rt.value;
              return (
                <button
                  key={rt.value}
                  disabled={readOnly}
                  onClick={() => setRuleType(rt.value)}
                  className={`text-left rounded-lg border p-3 transition ${
                    active
                      ? 'border-indigo-500 bg-indigo-50 shadow-[inset_0_0_0_1px_#6366f1]'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
                  } disabled:opacity-60`}
                >
                  <div
                    className={`font-mono text-xs font-bold ${
                      active ? 'text-indigo-700' : 'text-gray-800'
                    }`}
                  >
                    {rt.label}
                  </div>
                  <div className="text-[11px] text-gray-500 leading-tight mt-1">
                    {rt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* guided builder */}
        <Section title="Guided builder">
          <div className="flex flex-wrap items-end gap-3">
            <FormControl size="small" className="min-w-[150px]">
              <InputLabel>Phase (armed in)</InputLabel>
              <Select
                value={phase}
                label="Phase (armed in)"
                disabled={readOnly}
                onChange={(e) => setPhase(e.target.value)}
              >
                {(phaseNames.length ? phaseNames : [phase]).map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <span className="text-xs text-gray-400 pb-2">while</span>
            <FormControl size="small" className="min-w-[180px] flex-1">
              <InputLabel>Dataref (alias)</InputLabel>
              <Select
                value={datarefs.some((d) => d.alias === alias) ? alias : ''}
                label="Dataref (alias)"
                disabled={readOnly || advanced}
                onChange={(e) => setAlias(e.target.value)}
              >
                {datarefs.length === 0 && (
                  <MenuItem value="" disabled>
                    No datarefs in catalog
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
            <FormControl size="small" className="min-w-[90px]">
              <InputLabel>Op</InputLabel>
              <Select
                value={operator}
                label="Op"
                disabled={readOnly || advanced}
                onChange={(e) => setOperator(e.target.value)}
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
              label="Value"
              className="w-24"
              value={value}
              disabled={readOnly || advanced}
              onChange={(e) => setValue(e.target.value)}
            />
            {selectedDataref?.unit && (
              <span className="text-xs text-gray-400 pb-2">{selectedDataref.unit}</span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3 mt-2">
            <FormControl size="small" className="min-w-[220px]">
              <InputLabel>Event severity</InputLabel>
              <Select
                value={severityId}
                label="Event severity"
                disabled={readOnly}
                onChange={(e) => setSeverityId(Number(e.target.value))}
              >
                {SEVERITY_OPTIONS.map((id) => (
                  <MenuItem key={id} value={id}>
                    {SEVERITY_META[id].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Noise tolerance (graceMs)"
              className="w-40"
              value={graceMs}
              disabled={readOnly}
              onChange={(e) => setGraceMs(e.target.value)}
            />
          </div>
        </Section>

        {/* details */}
        <Section title="Data recorded on event (details)">
          <div className="flex flex-wrap gap-2 items-center">
            {details.map((d) => (
              <Chip
                key={d}
                label={d}
                onDelete={readOnly ? undefined : () => removeDetail(d)}
                deleteIcon={<Close />}
                size="small"
                className="font-mono"
              />
            ))}
            {!readOnly && (
              <FormControl size="small" className="min-w-[180px]">
                <InputLabel>+ add dataref</InputLabel>
                <Select
                  value=""
                  label="+ add dataref"
                  onChange={(e) => addDetail(e.target.value)}
                >
                  {datarefs
                    .filter((d) => !details.includes(d.alias))
                    .map((d) => (
                      <MenuItem key={d.id} value={d.alias}>
                        {d.alias}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          </div>
        </Section>

        {/* item & evaluation */}
        <Section title="Item & evaluation">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Item verifiability</div>
              <div className="text-xs text-gray-500">
                Only AUTO items own a rule and score on their own
              </div>
            </div>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              {VERIFIABILITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  disabled={readOnly}
                  onClick={() => setVerifiability(o.value)}
                  className={`text-xs font-semibold px-3 py-1.5 ${
                    verifiability === o.value
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <div>
              <div className="font-semibold">Advanced expression</div>
              <div className="text-xs text-gray-500">
                Edit the mini-DSL directly (multiple conditions)
              </div>
            </div>
            <Switch
              checked={advanced}
              disabled={readOnly}
              onChange={(e) => {
                const on = e.target.checked;
                setAdvanced(on);
                if (on && !advancedExpr) setAdvancedExpr(effectiveExpr);
              }}
            />
          </div>

          {advanced ? (
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={advancedExpr}
              disabled={readOnly}
              onChange={(e) => setAdvancedExpr(e.target.value)}
              InputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
              className="mt-2"
            />
          ) : (
            <div className="mt-2 font-mono text-sm bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
              {effectiveExpr}
            </div>
          )}
        </Section>

        {/* test */}
        <Section title="Test rule">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs text-gray-500">
                Example frame (paste a JSON snapshot)
              </span>
              <div className="flex-1" />
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleTest}
                disabled={testRule.isPending}
              >
                Test
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-3 border-b md:border-b-0 md:border-r border-gray-200">
                <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                  Input frame
                </h4>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={frameJson}
                  onChange={(e) => setFrameJson(e.target.value)}
                  InputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
                />
              </div>
              <div className="p-3">
                <h4 className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                  Result
                </h4>
                {!testResult && (
                  <div className="text-sm text-gray-400">Run the test to see the result.</div>
                )}
                {testResult && (
                  <div>
                    <span
                      className={`inline-flex items-center gap-2 font-bold px-3 py-1 rounded ${
                        testResult.result
                          ? 'bg-red-50 text-red-500'
                          : 'bg-green-50 text-green-500'
                      }`}
                    >
                      {testResult.result ? '⚑ FIRES' : 'OK — does not fire'}
                    </span>
                    {testResult.error && (
                      <div className="text-xs text-red-500 mt-2">{testResult.error}</div>
                    )}
                    <pre className="text-[11px] font-mono text-gray-500 mt-2 overflow-x-auto">
                      {JSON.stringify(testResult.resolved, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* footer */}
      {!readOnly && (
        <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-3">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createRule.isPending || updateRule.isPending}
          >
            Save draft
          </Button>
          <div className="flex-1" />
          {existingRule && (
            <span className="text-xs text-gray-400">Rule #{existingRule.id}</span>
          )}
        </div>
      )}
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
