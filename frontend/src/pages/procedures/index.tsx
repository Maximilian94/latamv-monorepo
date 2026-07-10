import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
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
  Typography,
} from '@mui/material';
import { ArrowBack, Publish } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useProcedurePackages,
  useProcedureVersion,
  useProcedureVersions,
  usePublishProcedureVersion,
} from '../../hooks';
import { useProcedureStore } from '../../store/procedure.store';
import type {
  ChecklistItem,
  Phase,
  ProcedureEvent,
  ProcedureVersionTree,
  SubPhase,
} from '../../services/latam/procedures.service';
import { ProcedureTree } from './procedure-tree';
import { RuleEditor } from './rule-editor';

interface EventLocation {
  event: ProcedureEvent;
  item: ChecklistItem;
  subPhase: SubPhase;
  phase: Phase;
}

function findEvent(
  version: ProcedureVersionTree,
  eventId: string
): EventLocation | null {
  for (const phase of version.phases) {
    for (const subPhase of phase.subPhases) {
      for (const item of subPhase.items) {
        for (const event of item.events) {
          if (event.id === eventId) return { event, item, subPhase, phase };
        }
      }
    }
  }
  return null;
}

interface ValidationProblem {
  message: string;
}

function collectProblems(version: ProcedureVersionTree): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  for (const phase of version.phases) {
    if (phase.subPhases.length === 0)
      problems.push({ message: `Phase "${phase.name}" has no subphases` });
    for (const subPhase of phase.subPhases) {
      for (const item of subPhase.items) {
        for (const event of item.events) {
          if (item.verifiability === 'AUTO' && event.validationRules.length === 0)
            problems.push({
              message: `AUTO event "${event.name}" has no validation rule`,
            });
        }
      }
    }
  }
  return problems;
}

export function ProceduresEditorPage({ versionId }: { versionId: number }) {
  const navigate = useNavigate();
  const { selectedEventId } = useProcedureStore();

  const { data: version, isLoading } = useProcedureVersion(versionId);
  const { data: versions } = useProcedureVersions(version?.aircraftModelCode);
  const { data: packages } = useProcedurePackages();
  const publishMutation = usePublishProcedureVersion();

  const [publishOpen, setPublishOpen] = useState(false);

  const datarefs = useMemo(() => {
    if (!version || !packages) return [];
    return packages
      .filter((p) => p.model === version.aircraftModelCode)
      .flatMap((p) => p.datarefs);
  }, [packages, version]);

  const problems = useMemo(
    () => (version ? collectProblems(version) : []),
    [version]
  );

  if (isLoading || !version) {
    return <div className="p-6">Loading procedure version…</div>;
  }

  const readOnly = version.status !== 'DRAFT';
  const location = selectedEventId ? findEvent(version, selectedEventId) : null;

  const totalEvents = version.phases.reduce(
    (acc, p) =>
      acc +
      p.subPhases.reduce(
        (a, s) => a + s.items.reduce((x, i) => x + i.events.length, 0),
        0
      ),
    0
  );
  const totalRules = version.phases.reduce(
    (acc, p) =>
      acc +
      p.subPhases.reduce(
        (a, s) =>
          a +
          s.items.reduce(
            (x, i) => x + i.events.reduce((y, e) => y + e.validationRules.length, 0),
            0
          ),
        0
      ),
    0
  );

  const publishedVersion = versions?.find((v) => v.status === 'PUBLISHED');

  const handlePublish = () => {
    publishMutation.mutate(versionId, {
      onSuccess: () => {
        toast.success('Version published');
        setPublishOpen(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top bar */}
      <div className="flex items-center gap-4 px-5 h-14 bg-white border-b border-gray-200 sticky top-0 z-20">
        <Link to="/admin/procedures" className="flex items-center text-gray-600">
          <ArrowBack fontSize="small" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Admin</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">Procedures</span>
        </div>
        <div className="flex-1" />
        <FormControl size="small" className="min-w-[110px]">
          <InputLabel>Aircraft</InputLabel>
          <Select value={version.aircraftModelCode} label="Aircraft" disabled>
            <MenuItem value={version.aircraftModelCode}>
              {version.aircraftModelCode}
            </MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" className="min-w-[150px]">
          <InputLabel>Version</InputLabel>
          <Select
            value={versionId}
            label="Version"
            onChange={(e) =>
              navigate({
                to: '/admin/procedures/$procedureVersionId',
                params: { procedureVersionId: String(e.target.value) },
              })
            }
          >
            {(versions ?? []).map((v) => (
              <MenuItem key={v.id} value={v.id}>
                v{v.version} · {v.status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Publish />}
          disabled={readOnly}
          onClick={() => setPublishOpen(true)}
        >
          Publish…
        </Button>
      </div>

      {/* status strip */}
      <div className="flex items-center gap-3 flex-wrap px-5 py-2 bg-white border-b border-gray-200 text-xs text-gray-500">
        <Chip
          size="small"
          label={`${version.status} v${version.version}`}
          color={version.status === 'DRAFT' ? 'warning' : 'success'}
        />
        {publishedVersion && (
          <span className="text-gray-500">
            Published: v{publishedVersion.version}
          </span>
        )}
        <span className="text-gray-300">·</span>
        <span>
          {totalEvents} events · {totalRules} rules
        </span>
        {problems.length > 0 && (
          <span className="text-yellow-500 font-semibold">
            · {problems.length} validation warnings
          </span>
        )}
        <div className="flex-1" />
        {readOnly && (
          <span className="text-gray-400">
            Read-only — {version.status.toLowerCase()} versions cannot be edited
          </span>
        )}
      </div>

      {/* workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,38%)_1fr] gap-4 p-5 items-start">
        <ProcedureTree version={version} readOnly={readOnly} datarefs={datarefs} />

        {location ? (
          <RuleEditor
            key={location.event.id}
            event={location.event}
            item={location.item}
            phaseName={location.phase.name}
            subPhaseName={location.subPhase.name}
            phaseNames={version.phases.map((p) => p.name)}
            datarefs={datarefs}
            readOnly={readOnly}
          />
        ) : (
          <div className="border border-gray-200 rounded-xl bg-white p-10 text-center text-gray-400">
            Select an event on the left to edit its validation rule.
          </div>
        )}
      </div>

      {/* version history */}
      <div className="px-5 pb-8">
        <Typography variant="subtitle2" className="uppercase tracking-wide text-gray-500 font-bold mb-2">
          Version history
        </Typography>
        <div className="flex flex-col gap-1">
          {(versions ?? []).map((v) => (
            <Link
              key={v.id}
              to="/admin/procedures/$procedureVersionId"
              params={{ procedureVersionId: String(v.id) }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                v.id === versionId
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold">v{v.version}</span>
              <Chip
                size="small"
                label={v.status}
                color={
                  v.status === 'DRAFT'
                    ? 'warning'
                    : v.status === 'PUBLISHED'
                      ? 'success'
                      : 'default'
                }
              />
              <span className="text-gray-400">
                updated {new Date(v.updatedAt).toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* publish dialog */}
      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish v{version.version}</DialogTitle>
        <DialogContent>
          <Typography className="mb-3">
            Publishing makes this version live for the next flight. It replaces
            the current published version for {version.aircraftModelCode}.
          </Typography>
          {problems.length === 0 ? (
            <div className="text-green-600 text-sm">No validation problems found.</div>
          ) : (
            <div>
              <Typography variant="subtitle2" className="text-yellow-600 mb-1">
                {problems.length} validation warning(s):
              </Typography>
              <ul className="list-disc pl-5 text-sm text-gray-600 max-h-52 overflow-y-auto">
                {problems.map((p, i) => (
                  <li key={i}>{p.message}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? 'Publishing…' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
