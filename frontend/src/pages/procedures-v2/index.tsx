import {
  useState,
  useEffect,
  useMemo,
  useRef,
  createContext,
  useContext,
} from 'react';
import { Dialog } from '@mui/material';
import toast from 'react-hot-toast';
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  MenuBook,
  TipsAndUpdates,
  WarningAmber,
  ReportProblem,
  InfoOutlined,
  Sensors,
  PanTool,
  Block,
  Close,
} from '@mui/icons-material';
import {
  useProcedureVersions,
  useProcedureVersion,
  useProcedurePackages,
  useCreateEvent,
  useCreateRule,
  useUpdateRule,
  useUpdateEvent,
  useUpdateItem,
  useTestRule,
} from '../../hooks/procedure/useProcedures';
import type {
  ProcedureVersionTree,
  ProcedureVersionSummary,
  ChecklistItem as ApiChecklistItem,
  ValidationRule as ApiValidationRule,
  ProcedureEvent as ApiProcedureEvent,
  Dataref as ApiDataref,
} from '../../services/latam/procedures.service';
import { OPERATORS, SEVERITY_META, parseSimpleExpr } from '../procedures/constants';

// Provided by the page in real+draft mode; lets the deep VerifBlock trigger the
// rule editor for a given backend item without threading callbacks by hand.
const AuthoringContext = createContext<{
  onAuthorRule?: (item: ApiChecklistItem) => void;
  onTestRule?: (item: ApiChecklistItem) => void;
  onDowngrade?: (item: ApiChecklistItem) => void;
}>({});

// ============================================================================
// MOCK DATA — hard-coded for now. Structure:
//   Session  ->  Group (panel)  ->  System  ->  Item (verification)
// Each item's row title comes from the QRH; the expanded detail is a faithful,
// verbatim reproduction of the FCOM PRO-NOR-SOP-04 "Preliminary Cockpit
// Preparation" (12 pages), plus FCTM technique notes.
// ============================================================================

type Crew = 'CM1' | 'CM2' | 'PF' | 'PM' | 'BOTH';
type Side = 'left' | 'right' | 'both';

// Mirrors the backend `Verifiability` enum: AUTO = has a ValidationRule and
// scores automatically (i.e. ACARS-monitored); MANUAL = self-attested;
// NOT_SIMULATED = does not exist in the sim.
type Verifiability = 'AUTO' | 'MANUAL' | 'NOT_SIMULATED';

// Reading "altitude": how much depth is opened by default across the tree.
type Lens = 'flow' | 'telemetry' | 'study';

// The ACARS validation rule behind an AUTO item — which datarefs the sim
// watches and the condition it grades. Mirrors backend ValidationRule
// (expr/type/phase/aliases + severity).
interface AcarsRule {
  cond: [string, string][]; // [dataref alias, human-readable condition]
  type: 'SNAPSHOT' | 'CONTINUOUS' | 'PRECONDITION' | 'SEQUENCE';
  phases: string[]; // the flight phase(s) the rule is armed in
  graceMs?: number; // CONTINUOUS: how long the condition must hold
  dref: string;
  sev: string; // severity label (free-form on the backend)
}

// A faithful, verbatim reproduction of the FCOM's own nested line structure.
// The FCOM is not a flat list: it nests context headers ("On the DOOR SD
// page:"), conditional branches ("If the OXY pressure is half boxed in
// amber:"), dotted action lines, explanatory lines and Note/WARNING/CAUTION
// boxes. This tree preserves that structure instead of flattening it.
type FcomLineKind =
  | 'context' // "On the DOOR SD page:"
  | 'condition' // "If the OXY pressure is half boxed in amber:"
  | 'action' // dotted action line: LABEL ..... ACTION
  | 'text' // explanatory line under an action
  | 'note' // "Note: ..."
  | 'warning'
  | 'caution';

interface FcomNode {
  kind: FcomLineKind;
  text?: string; // context / condition / text / note / warning / caution
  label?: string; // action label
  action?: string; // action value
  star?: boolean; // asterisk item (only step repeated after transit stop)
  children?: FcomNode[];
}

// The FCTM is training prose, not a checklist: it nests headings ("OBJECTIVES",
// "FMGS PROGRAMMING"), sub-headings, paragraphs and bullet lists. This tree
// reproduces that structure verbatim.
interface FctmNode {
  kind: 'heading' | 'subheading' | 'text' | 'bullet';
  text: string;
  children?: FctmNode[];
}

interface MockItem {
  label: string; // QRH row title, e.g. "ECAM OXY PRESS / HYD QTY / ENG OIL QTY"
  action: string; // QRH row action, e.g. "CHECK"
  crew: Crew; // who performs it
  fcomTitle?: string; // the FCOM's own sub-section heading (e.g. "ECAM PAGES")
  detail?: FcomNode[]; // faithful FCOM reproduction
  fctmTitle?: string; // the FCTM's own sub-section heading (e.g. "OBJECTIVES")
  fctmDetail?: FctmNode[]; // faithful FCTM reproduction
  fctm?: string | string[]; // simple FCTM paragraph(s) (legacy / short notes)
  ref?: string; // FCOM reference, e.g. "PRO-NOR-SOP-04 P2/12"
  fctmRef?: string; // FCTM reference, e.g. "NO-020 P5/20"
  verifiability?: Verifiability; // unset defaults to MANUAL (self-attested)
  acars?: AcarsRule; // present only when a validation rule has been authored
  apiItem?: ApiChecklistItem; // the backend item (real data only) — enables authoring
}

interface MockSystem {
  name: string;
  items: MockItem[];
}

interface MockGroup {
  name: string;
  systems: MockSystem[];
}

interface MockSession {
  name: string;
  intro?: string; // section-level general note
  groups: MockGroup[];
}

// Crew metadata: label + colors + full meaning (used in badge and legend).
const CREW_META: Record<
  Crew,
  { label: string; cls: string; full: string }
> = {
  CM1: {
    label: 'CM1',
    cls: 'bg-blue-100 text-blue-800 border-blue-300',
    full: 'Captain — left seat',
  },
  CM2: {
    label: 'CM2',
    cls: 'bg-violet-100 text-violet-800 border-violet-300',
    full: 'First Officer — right seat',
  },
  PF: {
    label: 'PF',
    cls: 'bg-teal-100 text-teal-800 border-teal-300',
    full: 'Pilot Flying — follows the toggle',
  },
  PM: {
    label: 'PM',
    cls: 'bg-amber-100 text-amber-900 border-amber-300',
    full: 'Pilot Monitoring — opposite side of PF',
  },
  BOTH: {
    label: '1+2',
    cls: 'bg-slate-200 text-slate-700 border-slate-300',
    full: 'Both crew members (full width)',
  },
};

// CM1 fixed left, CM2 fixed right; PF follows the toggle, PM takes the opposite.
function resolveSide(crew: Crew, pfSide: 'left' | 'right'): Side {
  switch (crew) {
    case 'CM1':
      return 'left';
    case 'CM2':
      return 'right';
    case 'PF':
      return pfSide;
    case 'PM':
      return pfSide === 'left' ? 'right' : 'left';
    case 'BOTH':
      return 'both';
  }
}

// ---------------------------------------------------------------------------
// Verifiability / ACARS monitoring
// ---------------------------------------------------------------------------

type VerifState = 'auto' | 'gap' | 'manual' | 'ns';

// Effective verifiability: an unset item is self-attested until it is wired.
function verifOf(item: MockItem): Verifiability {
  return item.verifiability ?? 'MANUAL';
}

// A gap = marked AUTO but no rule was ever authored, so it silently never
// scores. The single most important signal for the editor on this page.
function isGap(item: MockItem): boolean {
  return verifOf(item) === 'AUTO' && !item.acars;
}

function verifState(item: MockItem): VerifState {
  if (isGap(item)) return 'gap';
  const v = verifOf(item);
  return v === 'AUTO' ? 'auto' : v === 'NOT_SIMULATED' ? 'ns' : 'manual';
}

// Tailwind tokens per state (light palette, in tune with the page).
const VERIF_META: Record<
  VerifState,
  { label: string; rail: string; chip: string }
> = {
  auto: {
    label: 'ACARS',
    rail: 'bg-cyan-500',
    chip: 'text-cyan-700 bg-cyan-50 border-cyan-300',
  },
  gap: {
    label: 'NO RULE',
    rail: 'bg-orange-500',
    chip: 'text-orange-700 bg-orange-50 border-orange-300',
  },
  manual: {
    label: 'MANUAL',
    rail: 'bg-amber-400',
    chip: 'text-amber-800 bg-amber-50 border-amber-300',
  },
  ns: {
    label: 'N/S',
    rail: 'bg-gray-300',
    chip: 'text-gray-500 bg-gray-50 border-gray-300',
  },
};

function flattenItems(sessions: MockSession[]): MockItem[] {
  return sessions.flatMap((s) =>
    s.groups.flatMap((g) => g.systems.flatMap((sy) => sy.items))
  );
}

// ---------------------------------------------------------------------------
// "When" — the flight phase window (rule.phase) × the trigger type (rule.type)
// ---------------------------------------------------------------------------

type TriggerType = AcarsRule['type'];
type PhaseGroup = 'pre' | 'to' | 'air' | 'land' | 'post';

// One Tailwind pill class per flight segment (light palette).
const GROUP_PILL: Record<PhaseGroup, string> = {
  pre: 'bg-indigo-500',
  to: 'bg-orange-500',
  air: 'bg-sky-500',
  land: 'bg-teal-500',
  post: 'bg-slate-500',
};

// Human label + segment for each flight phase. Ids match the phase FSM
// (ported from acars-v5). "taxing" = taxi out (departure); "taxi-out" = taxi
// in (arrival) — the labels here untangle that.
const PHASE_META: Record<string, { label: string; group: PhaseGroup }> = {
  cockpit_preparation: { label: 'Cockpit prep', group: 'pre' },
  'push-back_engine-start': { label: 'Pushback / start', group: 'pre' },
  'after-start': { label: 'After start', group: 'pre' },
  taxing: { label: 'Taxi out', group: 'pre' },
  'taking-off-starting': { label: 'T/O roll', group: 'to' },
  'taking-off-after-80kt': { label: 'T/O · 80 kt', group: 'to' },
  'taking-off-lift-off': { label: 'Lift-off', group: 'to' },
  'taking-off-thrust-reduction': { label: 'Thrust red.', group: 'to' },
  climb: { label: 'Climb', group: 'air' },
  cruise: { label: 'Cruise', group: 'air' },
  descent: { label: 'Descent', group: 'air' },
  approach: { label: 'Approach', group: 'air' },
  'landing-about-2000ft': { label: 'Landing · 2000 ft', group: 'land' },
  'landing-about-1000ft': { label: 'Landing · 1000 ft', group: 'land' },
  'touch-down': { label: 'Touchdown', group: 'land' },
  'taxi-out': { label: 'Taxi in', group: 'post' },
  parking: { label: 'Parking', group: 'post' },
  'securing-aircraft': { label: 'Securing', group: 'post' },
};

function phaseMeta(id: string): { label: string; group: PhaseGroup } {
  return PHASE_META[id] ?? { label: id, group: 'pre' };
}

// Plain-language timing per trigger type — exactly what rule-engine.ts evaluates.
const TRIGGER_META: Record<TriggerType, { label: string; when: string }> = {
  SNAPSHOT: {
    label: 'Snapshot',
    when: 'fires the instant the condition flips true, while in the phase.',
  },
  CONTINUOUS: {
    label: 'Continuous',
    when: 'fires once the condition has held true for a grace time within the phase.',
  },
  PRECONDITION: {
    label: 'Precondition',
    when: 'checked on entering the phase — fails if not already true by then.',
  },
  SEQUENCE: {
    label: 'Sequence',
    when: 'fires only after every earlier rule in the same phase has fired.',
  },
};

// A small glyph whose shape encodes the trigger's timing semantics. Uses
// explicit width/height (not a CSS class) so it stays small even inside the
// MUI Dialog portal, where the Tailwind sizing utility does not reach the svg.
function TriggerGlyph({ type, size = 13 }: { type: TriggerType; size?: number }) {
  const p = {
    viewBox: '0 0 16 16',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'shrink-0',
  };
  switch (type) {
    case 'SNAPSHOT':
      return (
        <svg {...p}>
          <path d="M2 12h5V4h7" />
          <circle cx="7" cy="4" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'CONTINUOUS':
      return (
        <svg {...p}>
          <path d="M3 8h10" />
          <path d="M3 5v6" />
          <path d="M13 5v6" />
        </svg>
      );
    case 'PRECONDITION':
      return (
        <svg {...p}>
          <path d="M3 2v12" />
          <path d="M6 8.5l2.2 2.2L14 5" />
        </svg>
      );
    case 'SEQUENCE':
      return (
        <svg {...p}>
          <path d="M3 4l4 4l-4 4" />
          <path d="M9 4l4 4l-4 4" />
        </svg>
      );
  }
}

// "3 s" / "1.5 s" / "250 ms"
function formatGrace(ms: number): string {
  return ms % 1000 === 0 ? `${ms / 1000} s` : `${ms} ms`;
}

// A colored phase pill (the flight segment gives the color).
function PhasePill({ phaseId }: { phaseId: string }) {
  const pm = phaseMeta(phaseId);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white align-middle ${GROUP_PILL[pm.group]}`}
    >
      {pm.label}
    </span>
  );
}

// "A", "A and B", "A, B and C"
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function phaseLabels(ids: string[]): string {
  return joinAnd(ids.map((id) => phaseMeta(id).label));
}

// One or more phase pills, joined "A and B" / "A, B and C".
function PhasePills({ phases }: { phases: string[] }) {
  return (
    <>
      {phases.map((id, i) => (
        <span key={id}>
          {i > 0 && (
            <span className="text-gray-500">
              {i === phases.length - 1 ? ' and ' : ', '}
            </span>
          )}
          <PhasePill phaseId={id} />
        </span>
      ))}
    </>
  );
}

// Natural-language "when", as one sentence (for tooltips / plain text):
//   "Precondition · checked as Cockpit prep begins — this step must already be done"
//   "Continuous · monitored every 3 s throughout Cockpit prep and Taxi out"
function whenText(acars: AcarsRule): string {
  const phases = phaseLabels(acars.phases);
  const grace = acars.graceMs ? formatGrace(acars.graceMs) : null;
  switch (acars.type) {
    case 'SNAPSHOT':
      return `Snapshot · checked once, when this step is done, during ${phases}`;
    case 'CONTINUOUS':
      return grace
        ? `Continuous · monitored every ${grace} throughout ${phases}`
        : `Continuous · monitored throughout ${phases}`;
    case 'PRECONDITION':
      return `Precondition · checked as ${phases} begins — this step must already be done`;
    case 'SEQUENCE':
      return `Sequence · checked when this step is done during ${phases}, after the earlier steps`;
  }
}

// The row's compact mark: phase color + trigger glyph, sentence in the tooltip.
function WhenMark({ acars }: { acars: AcarsRule }) {
  const pm = phaseMeta(acars.phases[0]);
  return (
    <span
      title={whenText(acars)}
      className={`shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${GROUP_PILL[pm.group]}`}
    >
      <TriggerGlyph type={acars.type} />
    </span>
  );
}

// The detail's "when" — reads as a sentence led by the trigger, phases inline.
function WhenLine({ acars }: { acars: AcarsRule }) {
  const grace = acars.graceMs ? formatGrace(acars.graceMs) : null;
  const pills = <PhasePills phases={acars.phases} />;

  let clause: React.ReactNode;
  switch (acars.type) {
    case 'SNAPSHOT':
      clause = <>checked once, when this step is done, during {pills}</>;
      break;
    case 'CONTINUOUS':
      clause = grace ? (
        <>
          monitored every <b className="text-gray-800">{grace}</b> throughout{' '}
          {pills}
        </>
      ) : (
        <>monitored throughout {pills}</>
      );
      break;
    case 'PRECONDITION':
      clause = (
        <>
          checked as {pills} begins — this step must already be done
        </>
      );
      break;
    case 'SEQUENCE':
      clause = (
        <>checked when this step is done during {pills}, after the earlier steps</>
      );
      break;
  }

  return (
    <div className="text-xs leading-relaxed text-gray-700">
      <span className="mr-1 inline-flex items-center gap-1 align-middle font-bold text-gray-900">
        <TriggerGlyph type={acars.type} /> {TRIGGER_META[acars.type].label}
      </span>
      <span className="align-middle text-gray-600">· {clause}</span>
    </div>
  );
}

// Source: A319/A320/A321 QRH — NORMAL PROCEDURES (crew flow), with each item's
// detail reproduced verbatim from the full A320 FCOM PRO-NOR-SOP-04
// (Preliminary Cockpit Preparation, 12 pages) and FCTM PR-NP-SOP (PRE START).
const SESSIONS: MockSession[] = [
  {
    name: 'Safety Exterior Inspection',
    groups: [
      {
        name: 'EXTERIOR INSPECTION',
        systems: [
          {
            name: 'GROUND CHECK',
            items: [
              {
                label: 'WHEEL CHOCKS',
                action: 'CHECK',
                crew: 'CM1',
                fctmTitle: 'SAFETY EXTERIOR INSPECTION',
                fctmRef: 'NO-020 P4/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'Safety exterior inspection is performed to ensure that the aircraft and its surroundings are safe for operations. Items that should be checked include:',
                  },
                  { kind: 'bullet', text: 'Chocks in place' },
                  { kind: 'bullet', text: 'Doors status' },
                  { kind: 'bullet', text: 'Ground crew present' },
                  { kind: 'bullet', text: 'Aircraft environment' },
                ],
              },
              { label: 'L/G DOORS', action: 'CHECK POSITION', crew: 'CM1' },
              { label: 'APU AREA', action: 'CHECK', crew: 'CM1' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Preliminary Cockpit Preparation',
    intro:
      'GENERAL — Items marked with an asterisk (*) are the only steps to be completed after ' +
      'a transit stop without flight crew change. Otherwise, the new flight crew performs all ' +
      'the items. The following procedure ensures that all the required checks are performed ' +
      'before applying electrical power to avoid inadvertent operation of systems and danger ' +
      'to the aircraft and personnel. The APU start and the establishment of electrical and ' +
      'pneumatic power are included.',
    groups: [
      {
        name: 'PRELIMINARY COCKPIT PREPARATION',
        systems: [
          {
            name: 'AIRCRAFT SETUP',
            items: [
              {
                label: 'ENG MASTERS / ENG MODE selector',
                action: 'CHECK',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P1/12',
                fcomTitle: 'AIRCRAFT SETUP · ENG',
                verifiability: 'AUTO',
                acars: {
                  cond: [
                    ['AirbusFBW/ENGMasterSwitchArray[0]', '== 0 (OFF)'],
                    ['AirbusFBW/ENGMasterSwitchArray[1]', '== 0 (OFF)'],
                    ['AirbusFBW/ENGModeSwitch', '== 1 (NORM)'],
                  ],
                  type: 'PRECONDITION',
                  phases: ['cockpit_preparation'],
                  dref: 'AirbusFBW/ENGMasterSwitchArray[0..1], AirbusFBW/ENGModeSwitch',
                  sev: 'MAJOR',
                },
                detail: [
                  {
                    kind: 'warning',
                    text: 'Do not pressurize the hydraulic systems until clearance is obtained from ground personnel.',
                  },
                  { kind: 'action', label: 'ENG MASTERS 1, 2', action: 'OFF' },
                  { kind: 'action', label: 'ENG MODE selector', action: 'NORM' },
                ],
              },
              {
                label: 'WEATHER RADAR',
                action: 'OFF',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P1/12',
                fcomTitle: 'AIRCRAFT SETUP · WEATHER RADAR',
                verifiability: 'AUTO', // marked AUTO but no acars rule yet → gap
                detail: [
                  { kind: 'action', star: true, label: 'RADAR sw', action: 'OFF' },
                  {
                    kind: 'action',
                    star: true,
                    label: 'WINDSHEAR / PWS sw',
                    action: 'OFF',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'GAIN knob',
                    action: 'AUTO/CAL',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'MODE selector',
                    action: 'AS RQRD',
                  },
                ],
              },
              {
                label: 'L/G lever',
                action: 'DOWN',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P1/12',
                fcomTitle: 'AIRCRAFT SETUP · L/G',
                verifiability: 'AUTO',
                acars: {
                  cond: [
                    ['sim/cockpit2/controls/gear_handle_down', '== 1 (DOWN)'],
                  ],
                  type: 'CONTINUOUS',
                  phases: ['cockpit_preparation', 'taxing'],
                  graceMs: 3000,
                  dref: 'sim/cockpit2/controls/gear_handle_down',
                  sev: 'MAJOR',
                },
                detail: [{ kind: 'action', label: 'L/G lever', action: 'DOWN' }],
              },
              {
                label: 'Both WIPER selectors',
                action: 'OFF',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P1/12',
                fcomTitle: 'AIRCRAFT SETUP · WIPERS',
                detail: [
                  {
                    kind: 'action',
                    label: 'Both WIPER selectors',
                    action: 'OFF',
                  },
                ],
              },
            ],
          },
          {
            name: 'ELECTRICAL / APU',
            items: [
              {
                label: 'BAT',
                action: 'CHECK/AUTO',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P2/12',
                fcomTitle: 'BATTERY CHECK/SETUP',
                verifiability: 'AUTO',
                acars: {
                  cond: [
                    ['AirbusFBW/BatVolts[0]', '>= 25.5'],
                    ['AirbusFBW/BatVolts[1]', '>= 25.5'],
                  ],
                  type: 'SNAPSHOT',
                  phases: ['cockpit_preparation'],
                  dref: 'AirbusFBW/BatVolts[0..1]',
                  sev: 'MAJOR',
                },
                detail: [
                  {
                    kind: 'condition',
                    text: 'If the aircraft has not been electrically supplied for 6 h or more, perform the following check:',
                    children: [
                      {
                        kind: 'action',
                        label: 'BAT 1 pb and BAT 2 pb',
                        action: 'CHECK OFF',
                      },
                      {
                        kind: 'action',
                        label: 'BAT 1 and 2 VOLTAGE',
                        action: 'CHECK ABOVE 25.5 V',
                      },
                      {
                        kind: 'text',
                        text: 'Battery voltage above 25.5 V ensures a charge above 50 %.',
                      },
                      {
                        kind: 'condition',
                        text: 'If the battery voltage is at or below 25.5 V:',
                        children: [
                          {
                            kind: 'text',
                            text: 'A charging cycle of about 20 min is required.',
                          },
                          {
                            kind: 'action',
                            label: 'BAT 1 pb and BAT 2 pb',
                            action: 'AUTO',
                          },
                          { kind: 'action', label: 'EXT PWR pb-sw', action: 'ON' },
                          {
                            kind: 'text',
                            text: 'Check on ELEC SD page, that the battery contactor is closed and the batteries are charging.',
                          },
                          {
                            kind: 'condition',
                            text: 'After 20 min:',
                            children: [
                              {
                                kind: 'action',
                                label: 'BAT 1 + 2 pb',
                                action: 'OFF',
                              },
                              {
                                kind: 'action',
                                label: 'BAT 1 and 2 VOLTAGE',
                                action: 'CHECK ABOVE 25.5 V',
                              },
                              {
                                kind: 'action',
                                label: 'BAT 1 + 2 pb',
                                action: 'AUTO',
                              },
                            ],
                          },
                        ],
                      },
                      {
                        kind: 'condition',
                        text: 'If the battery voltage is above 25.5 V:',
                        children: [
                          {
                            kind: 'action',
                            label: 'BAT 1 pb and BAT 2 pb',
                            action: 'AUTO',
                          },
                          {
                            kind: 'text',
                            text: 'If the APU is started on batteries only, it should be started within 30 min after the selection of batteries to AUTO (35 min after battery selection to AUTO, the battery charge is less than 25 % of maximum capacity).',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    kind: 'condition',
                    text: 'If the aircraft has been electrically supplied during the last 6 h:',
                    children: [
                      {
                        kind: 'action',
                        label: 'BAT 1 pb and BAT 2 pb',
                        action: 'AUTO',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'EXT PWR pb-sw',
                action: 'AS RQRD',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P2/12',
                fcomTitle: 'BATTERY CHECK/SETUP',
                detail: [
                  {
                    kind: 'condition',
                    text: 'If the AVAIL light is on:',
                    children: [
                      { kind: 'action', label: 'EXT PWR pb-sw', action: 'ON' },
                    ],
                  },
                ],
              },
              {
                label: 'APU FIRE',
                action: 'CHECK/TEST',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P3/12',
                fcomTitle: 'APU FIRE TEST/APU START · APU FIRE',
                detail: [
                  {
                    kind: 'action',
                    label: 'APU FIRE pb-sw',
                    action: 'CHECK IN and GUARDED',
                  },
                  {
                    kind: 'action',
                    label: 'APU AGENT light',
                    action: 'CHECK OFF',
                  },
                  {
                    kind: 'action',
                    label: 'APU FIRE TEST pb',
                    action: 'PRESS and MAINTAIN',
                  },
                  {
                    kind: 'context',
                    text: 'TEST RESULT',
                    children: [
                      {
                        kind: 'text',
                        text: 'Check that the APU fire detection and extinguishing system is operative:',
                      },
                      {
                        kind: 'text',
                        text: '- APU FIRE warning on (if AC power available):',
                        children: [
                          { kind: 'text', text: '- ECAM' },
                          { kind: 'text', text: '- CRC' },
                          { kind: 'text', text: '- MASTER WARN light' },
                        ],
                      },
                      {
                        kind: 'text',
                        text: '- APU FIRE pb-sw lighted red (lighted partially if AC power not available)',
                      },
                      {
                        kind: 'text',
                        text: '- SQUIB light and DISCH light on',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'APU',
                action: 'START',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P4/12',
                fcomTitle: 'APU FIRE TEST/APU START · APU START',
                detail: [
                  {
                    kind: 'condition',
                    text: 'If the EXT PWR pb-sw ON light is on:',
                    children: [
                      {
                        kind: 'action',
                        label: 'APU MASTER SW pb-sw',
                        action: 'ON',
                      },
                      { kind: 'action', label: 'APU START pb-sw', action: 'ON' },
                      {
                        kind: 'note',
                        text: 'Wait at least 3 s before selecting APU START pb-sw.',
                      },
                      {
                        kind: 'text',
                        text: 'For more information on the APU start, refer to DSC-49-20 Overhead Panel - Illustration. For APU starter limitations and operations during refueling, refer to LIM-APU APU Start and LIM-APU APU Start/Shutdown during Refueling/Defueling.',
                      },
                    ],
                  },
                  {
                    kind: 'condition',
                    text: 'If the EXT PWR pb-sw ON light is off:',
                    children: [
                      {
                        kind: 'action',
                        label: 'APU MASTER SW pb-sw',
                        action: 'ON',
                      },
                      { kind: 'action', label: 'APU START pb-sw', action: 'ON' },
                      {
                        kind: 'note',
                        text: 'Wait at least 3 s before selecting APU START pb-sw.',
                      },
                      {
                        kind: 'text',
                        text: 'For more information on the APU start, refer to DSC-49-20 Overhead Panel - Illustration. For APU starter limitations and operations during refueling, refer to LIM-APU APU Start and LIM-APU APU Start/Shutdown during Refueling/Defueling.',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'EXT PWR pb-sw (when APU AVAIL)',
                action: 'AS RQRD',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P4/12',
                fcomTitle: 'APU FIRE TEST/APU START · APU START',
                detail: [
                  {
                    kind: 'condition',
                    text: 'If the EXT PWR pb-sw ON light is on:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'EXT PWR pb-sw',
                        action: 'AS RQRD',
                      },
                      {
                        kind: 'text',
                        text: 'The flight crew should keep ON the external power units to reduce the APU load, particularly in hot weather conditions.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'AIR COND / CARGO / LIGHTS',
            items: [
              {
                label: 'AIR COND panel',
                action: 'SET',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P5/12',
                fcomTitle: 'AIR COND',
                detail: [
                  {
                    kind: 'condition',
                    text: 'When the APU is AVAIL:',
                    children: [
                      { kind: 'action', label: 'APU BLEED pb-sw', action: 'ON' },
                      {
                        kind: 'text',
                        text: 'Do not use APU BLEED, if the ground personnel confirms that a LP or HP ground air unit is connected to the aircraft.',
                      },
                      {
                        kind: 'text',
                        text: 'To determine if an HP ground air unit is connected, the flight crew should also check on the BLEED SD page, if there is pressure in the bleed air system.',
                      },
                      {
                        kind: 'action',
                        label: 'ALL WHITE LIGHTS',
                        action: 'OFF',
                      },
                      {
                        kind: 'action',
                        label: 'X BLEED selector',
                        action: 'AUTO',
                      },
                      {
                        kind: 'action',
                        label: 'Zone temperature selectors',
                        action: 'AS RQRD',
                      },
                      {
                        kind: 'text',
                        text: 'Full range temperature 24 ± 6 °C (75 ± 11 °F).',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'CARGO HEAT',
                action: 'AS RQRD',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P5/12',
                fcomTitle: 'CARGO HEAT',
                detail: [
                  {
                    kind: 'action',
                    label: 'TEMPERATURE selector',
                    action: 'AS RQRD',
                  },
                ],
              },
              {
                label: 'COCKPIT LIGHT',
                action: 'AS RQRD',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P5/12',
                fcomTitle: 'COCKPIT LIGHTS',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'COCKPIT LIGHTS',
                    action: 'AS RQRD',
                  },
                  {
                    kind: 'text',
                    text: 'Set INT LT, FLOOD LT, INTEG LT (included glareshield and FCU).',
                  },
                ],
              },
            ],
          },
          {
            name: 'EFB / ACARS / FMGS',
            items: [
              {
                label: 'EFB',
                action: 'SET',
                crew: 'CM1',
                ref: 'PRO-NOR-SOP-04 P6/12',
                fcomTitle: 'EFB/ACARS (IF INSTALLED) INITIALIZATION',
                detail: [
                  {
                    kind: 'context',
                    text: 'EFB START',
                    children: [
                      { kind: 'action', label: 'ALL EFB', action: 'START' },
                      {
                        kind: 'condition',
                        text: "In accordance with the Operator's policy or if required by operational regulation:",
                        children: [
                          {
                            kind: 'action',
                            label: 'EFB/eQRH VERSION',
                            action: 'CHECK',
                          },
                          {
                            kind: 'text',
                            text: "If required, the flight crew performs this check unless a specific procedure is established as per Operator's policy to ensure that the correct version is onboard.",
                          },
                          {
                            kind: 'text',
                            text: 'On the EFB STATUS page and the eQRH My aircraft page, check the EFB VERSION number and compare it with the valid version number given as reference by the Operator (e.g. on the company flight plan).',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    kind: 'context',
                    text: 'ACARS INITIALIZATION',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'ACARS',
                        action: 'INITIALIZE',
                      },
                      {
                        kind: 'text',
                        text: 'Initialize ACARS if not done automatically, as per company policy.',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'EFB',
                action: 'SET',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P6/12',
                fcomTitle: 'EFB/ACARS (IF INSTALLED) INITIALIZATION',
                detail: [
                  {
                    kind: 'context',
                    text: 'EFB START',
                    children: [
                      { kind: 'action', label: 'ALL EFB', action: 'START' },
                      {
                        kind: 'condition',
                        text: "In accordance with the Operator's policy or if required by operational regulation:",
                        children: [
                          {
                            kind: 'action',
                            label: 'EFB/eQRH VERSION',
                            action: 'CHECK',
                          },
                          {
                            kind: 'text',
                            text: "If required, the flight crew performs this check unless a specific procedure is established as per Operator's policy to ensure that the correct version is onboard.",
                          },
                          {
                            kind: 'text',
                            text: 'On the EFB STATUS page and the eQRH My aircraft page, check the EFB VERSION number and compare it with the valid version number given as reference by the Operator (e.g. on the company flight plan).',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    kind: 'context',
                    text: 'ACARS INITIALIZATION',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'ACARS',
                        action: 'INITIALIZE',
                      },
                      {
                        kind: 'text',
                        text: 'Initialize ACARS if not done automatically, as per company policy.',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'FMGS PRE-INITIALIZATION',
                action: 'PERFORM',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P6-7/12',
                fcomTitle: 'FMGS PRE-INITIALIZATION',
                detail: [
                  {
                    kind: 'text',
                    text: 'Perform FMGS Pre-Initialization in the case of ACARS operations or EFB operations with SYNCHRO AVIONICS.',
                  },
                  {
                    kind: 'note',
                    text: 'At electrical power-up, the FMGSs and FCU run through various internal tests. Allow enough time (3 min) for tests’ completion, and do not start to press pushbuttons until the tests are over. If the "PLEASE WAIT" message appears, do not press any MCDU key until the message clears.',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'ENGINE & AIRCRAFT TYPE',
                    action: 'CHECK',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'FM database validity',
                    action: 'CHECK',
                    children: [
                      {
                        kind: 'text',
                        text: '- Check DATA BASE validity and stored WPT/NAVAIDS/RWY/ROUTES, if any. If applicable, review the stored data for deletion decision.',
                      },
                      {
                        kind: 'text',
                        text: '- On Thales FMS, if the "CHECK DATA BASE CYCLE" message triggers, the active database is no longer valid. Therefore, on Day 1 of AIRAC Cycle #2, select AIRAC Cycle #2 prior to the first flight of the day.',
                      },
                    ],
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'FLT NBR',
                    action: 'INSERT/CHECK',
                    children: [
                      {
                        kind: 'text',
                        text: 'Insert FLT NBR only if the company flight plan is not received via ACARS.',
                      },
                    ],
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'FROM/TO',
                    action: 'INSERT/CHECK',
                    children: [
                      {
                        kind: 'text',
                        text: 'Insert FROM/TO only if the company flight plan is not received via ACARS.',
                      },
                    ],
                  },
                  {
                    kind: 'context',
                    text: 'EFB STATUS PAGE',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'EFB SYNCHRO AVIONICS',
                        action: 'CLICK',
                      },
                      {
                        kind: 'action',
                        star: true,
                        label: 'EFB STATUS page',
                        action: 'INSERT/CHECK',
                      },
                      {
                        kind: 'text',
                        text: 'On the EFB STATUS page, each flight crewmember checks or, inserts and checks (if no EFB SYNCHRO AVIONICS):',
                        children: [
                          { kind: 'text', text: '- ACFT TYPE and ACFT REG' },
                          {
                            kind: 'text',
                            text: '- FLT NBR and FROM/TO (in agreement with the FMS ACTIVE/INIT page).',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'ECAM / LOGBOOK CHECK',
            items: [
              {
                label: 'ECAM RCL pb',
                action: 'PRESS 3 s',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P7/12',
                fcomTitle: 'ECAM/LOGBOOK CHECK',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'RCL pb',
                    action: 'PRESS 3 s',
                  },
                  {
                    kind: 'text',
                    text: 'This action recalls all the warnings that the flight crew cleared or cancelled during the last flight.',
                  },
                ],
                fctmTitle: 'PRELIMINARY COCKPIT PREPARATION · OBJECTIVES',
                fctmRef: 'NO-020 P3-4/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'To ensure that all safety checks are performed before applying electrical power:',
                  },
                  {
                    kind: 'bullet',
                    text: 'The RCL pb is pressed for at least 3 s to display the cautions and warnings from the previous flight.',
                  },
                  {
                    kind: 'bullet',
                    text: 'The technical logbook and MEL are checked at this stage.',
                  },
                  {
                    kind: 'text',
                    text: 'During the preliminary cockpit preparation, the flight crew should press the RCL pb for at least 3 s, in order to recall any previous alerts that were cleared or cancelled. The flight crew must also consult the technical logbook to confirm that the alerts are compatible with the MEL.',
                  },
                ],
              },
              {
                label: 'LOGBOOK',
                action: 'CHECK',
                crew: 'CM1',
                ref: 'PRO-NOR-SOP-04 P7/12',
                fcomTitle: 'ECAM/LOGBOOK CHECK',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'LOGBOOK',
                    action: 'CHECK',
                  },
                  {
                    kind: 'text',
                    text: '- In the logbook check the technical condition of the aircraft (deferred defect list) with regard to airworthiness, acceptability of the MEL, or the Configuration Deviation List (CDL), and influence on the flight plan.',
                  },
                  { kind: 'text', text: '- Crosscheck with ECAM recall.' },
                ],
              },
              {
                label: 'MEL/CDL ITEMS (dispatch)',
                action: 'CHECK DISPATCH CONDITIONS',
                crew: 'CM1',
                ref: 'PRO-NOR-SOP-04 P7/12',
                fcomTitle: 'ECAM/LOGBOOK CHECK',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'MEL/CDL ITEMS (as appropriate)',
                    action: 'CHECK DISPATCH CONDITIONS',
                  },
                  {
                    kind: 'text',
                    text: 'Access the MEL and CDL items via the Ops Library Browser.',
                  },
                  {
                    kind: 'text',
                    text: 'As appropriate, check and activate MEL and CDL items. The activated MEL and CDL items are sent to the performance applications.',
                  },
                ],
              },
              {
                label: 'AIRCRAFT ACCEPTANCE',
                action: 'PERFORM',
                crew: 'CM1',
                ref: 'PRO-NOR-SOP-04 P7/12',
                fcomTitle: 'ECAM/LOGBOOK CHECK',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'AIRCRAFT ACCEPTANCE',
                    action: 'PERFORM',
                  },
                  {
                    kind: 'note',
                    text: 'The aircraft acceptance can be performed later, but must be completed at the end of the Cockpit Preparation.',
                  },
                ],
              },
            ],
          },
          {
            name: 'PRELIMINARY PERFORMANCE DETERMINATION',
            items: [
              {
                label: 'AIRFIELD DATA',
                action: 'OBTAIN',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'PRELIMINARY PERFORMANCE DETERMINATION',
                detail: [
                  {
                    kind: 'text',
                    text: 'For more information, refer to FCTM/PR-NP-SOP Preliminary Cockpit Preparation - Preliminary Takeoff Performance Computation.',
                  },
                  {
                    kind: 'text',
                    text: 'Each flight crewmember independently computes the preliminary performance data in accordance with the technical condition of the aircraft and/or any other criteria that may impact the aircraft performance (e.g. NOTAM, runway condition, aircraft configuration).',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'AIRFIELD DATA',
                    action: 'OBTAIN',
                  },
                  {
                    kind: 'text',
                    text: 'Obtain data needed for initializing the system, preparing the cockpit and for preliminary takeoff performance computation. The airfield data should include: RUNWAY IN USE, ALTIMETER SETTING, and WEATHER DATA.',
                  },
                ],
              },
              {
                label: 'PRELIMINARY LOADING',
                action: 'COMPUTE AND CROSSCHECK',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'PRELIMINARY PERFORMANCE DETERMINATION',
                detail: [
                  {
                    kind: 'condition',
                    text: 'If the LOADSHEET application is used:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'PRELIMINARY LOADING',
                        action: 'COMPUTE AND CROSSCHECK',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'MEL/CDL ITEMS (activated)',
                action: 'CHECK ACTIVATED',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'PRELIMINARY PERFORMANCE DETERMINATION',
                detail: [
                  {
                    kind: 'condition',
                    text: 'If dispatch under MEL and in accordance with the logbook:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'MEL/CDL ITEMS (as appropriate)',
                        action: 'CHECK ACTIVATED',
                      },
                      {
                        kind: 'text',
                        text: 'As appropriate, check that the MEL and CDL items are activated in the applicable T.O PERF application.',
                      },
                    ],
                  },
                ],
              },
              {
                label: 'PRELIMINARY TAKEOFF PERF DATA',
                action: 'COMPUTE',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'PRELIMINARY PERFORMANCE DETERMINATION',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'PRELIMINARY TAKEOFF PERF DATA',
                    action: 'COMPUTE',
                  },
                  {
                    kind: 'text',
                    text: 'The PF and the PM independently compute the preliminary takeoff performance data.',
                  },
                ],
              },
              {
                label: 'PRELIMINARY TAKEOFF PERF DATA',
                action: 'CROSSCHECK',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'PRELIMINARY PERFORMANCE DETERMINATION',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'PRELIMINARY TAKEOFF PERF DATA',
                    action: 'CROSSCHECK',
                  },
                  {
                    kind: 'text',
                    text: 'The PF and the PM compare and ensure that the computations are the same.',
                  },
                ],
              },
              {
                label: 'OEB',
                action: 'CHECK',
                crew: 'BOTH',
                ref: 'PRO-NOR-SOP-04 P8/12',
                fcomTitle: 'OPERATION ENGINEERING BULLETINS (OEB)',
                detail: [
                  { kind: 'action', star: true, label: 'OEB', action: 'CHECK' },
                  {
                    kind: 'text',
                    text: 'Go to the OEB section of the QRH and review all OEBs (particularly red OEBs) that are applicable to the aircraft.',
                  },
                  {
                    kind: 'note',
                    text: 'If there is a transfer of duties during this flight, the flight crew must remind the incoming flight crew of the applicable OEB(s) during the briefing that is done when transferring the duties.',
                  },
                ],
                fctmTitle: 'PRELIMINARY COCKPIT PREPARATION · OBJECTIVES',
                fctmRef: 'NO-020 P4/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'During the Preliminary Cockpit Preparation, the flight crew must also review all OEBs applicable to the aircraft. The flight crew must pay a particular attention to the red OEBs, and more particularly to the red OEBs that must be applied before the ECAM procedure.',
                  },
                ],
              },
            ],
          },
          {
            name: 'BEFORE WALKAROUND',
            items: [
              {
                label: 'ECAM OXY PRESS / HYD QTY / ENG OIL QTY',
                action: 'CHECK',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P9-10/12',
                fcomTitle: 'BEFORE WALKAROUND · ECAM PAGES',
                detail: [
                  {
                    kind: 'context',
                    text: 'On the DOOR SD page:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'OXY',
                        action: 'CHECK PRESSURE',
                      },
                      {
                        kind: 'condition',
                        text: 'If the OXY pressure is half boxed in amber:',
                        children: [
                          {
                            kind: 'action',
                            label: 'MIN FLT CREW OXY CHART',
                            action: 'CHECK PRESSURE',
                          },
                          {
                            kind: 'text',
                            text: 'Verify that the pressure is sufficient for the scheduled flight (Refer to LIM-OXY Minimum Flight Crew Oxygen Pressure).',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    kind: 'context',
                    text: 'On the HYD SD page:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'RESERVOIR FLUID LEVEL',
                        action: 'CHECK WITHIN NORMAL RANGE',
                      },
                      {
                        kind: 'note',
                        text: 'The volume of the hydraulic fluid in the reservoirs may change with Outside Air Temperature. As a result, the reservoir fluid level that appears on the HYD SD page may be outside of the normal range with no HYD RSVR LO AIR PR or HYD RSVR LO LVL warning. If the fluid level is outside of the normal range, contact maintenance to determine if service is required.',
                      },
                    ],
                  },
                  {
                    kind: 'context',
                    text: 'On the ENG SD page:',
                    children: [
                      {
                        kind: 'action',
                        star: true,
                        label: 'ENG OIL QUANTITY',
                        action: 'CHECK',
                      },
                      {
                        kind: 'text',
                        text: 'Check that the oil quantity is above the minimum. Refer to LIM-ENG Oil.',
                      },
                      {
                        kind: 'note',
                        text: 'If the ENG oil quantity indication does not appear on the ENG SD page, press the ENG 1 and 2 FADEC GND PWR pb-sw on the overhead maintenance panel. After the check of the ENG oil quantity, press again the ENG 1 and 2 FADEC GND PWR pb-sw.',
                      },
                    ],
                  },
                ],
                fctmTitle: 'PRELIMINARY COCKPIT PREPARATION · OBJECTIVES / OXYGEN',
                fctmRef: 'NO-020 P4-5/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'To check the liquid levels i.e. oil, hydraulic and oxygen pressure using:',
                  },
                  {
                    kind: 'bullet',
                    text: 'The HYD pb is pressed to check the hydraulic level',
                  },
                  {
                    kind: 'bullet',
                    text: 'The ENG pb is pressed to check engine oil level (Refer to FCOM/PRO-NOR-SOP-04 ECAM)',
                  },
                  {
                    kind: 'bullet',
                    text: 'The DOOR pb is pressed, to check the oxygen pressure level',
                  },
                  { kind: 'heading', text: 'OXYGEN' },
                  {
                    kind: 'text',
                    text: 'The ECAM S/D DOOR page displays the oxygen pressure. When the oxygen pressure is below a defined threshold, an amber half box highlights the value. This advises the flight crew that the bottle should be refilled. The flight crew should refer to the minimum flight crew oxygen pressure (Refer to FCOM/LIM-35 Cockpit Fixed Oxygen System). The prolonged dispatch of the aircraft in such condition is not recommended.',
                  },
                ],
              },
              {
                label: 'FLAPS',
                action: 'CHECK POSITION',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P10/12',
                fcomTitle: 'BEFORE WALKAROUND · F/CTL',
                detail: [
                  {
                    kind: 'action',
                    label: 'FLAPS',
                    action: 'CHECK POSITION',
                  },
                  {
                    kind: 'text',
                    text: 'Check the upper ECAM display to confirm that the FLAPS position agrees with the handle position.',
                  },
                  {
                    kind: 'warning',
                    text: 'If flight control surface positions do not agree with the control handle positions, check with the maintenance crew before applying hydraulic power.',
                  },
                ],
                fctmTitle: 'PRELIMINARY COCKPIT PREPARATION · OBJECTIVES',
                fctmRef: 'NO-020 P5/20',
                fctmDetail: [
                  {
                    kind: 'bullet',
                    text: 'To check the position of surface control levers e.g. slats/flaps, parking brake.',
                  },
                ],
              },
              {
                label: 'SPD BRK lever',
                action: 'CHECK RET AND DISARMED',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P10/12',
                fcomTitle: 'BEFORE WALKAROUND · F/CTL',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'SPEEDBRAKE lever',
                    action: 'CHECK RETRACTED and DISARMED',
                  },
                  {
                    kind: 'warning',
                    text: 'If flight control surface positions do not agree with the control handle positions, check with the maintenance crew before applying hydraulic power.',
                  },
                ],
              },
            ],
          },
          {
            name: 'PARKING BRAKE / EMER EQPT / MISC',
            items: [
              {
                label: 'PARKING BRAKE',
                action: 'ON',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P11/12',
                fcomTitle: 'PARKING BRAKE',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'ACCU PRESS indicator',
                    action: 'CHECK',
                  },
                  {
                    kind: 'text',
                    text: 'The ACCU PRESS indication must be in the green band. If required use the electric pump on yellow hydraulic system to recharge the brake accumulator.',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'PARKING BRAKE handle',
                    action: 'ON',
                  },
                  {
                    kind: 'text',
                    text: 'When one brake temperature is above 500 °C, avoid applying the parking brake, unless operationally necessary.',
                  },
                  {
                    kind: 'action',
                    star: true,
                    label: 'BRAKES PRESS indicator',
                    action: 'CHECK',
                  },
                  { kind: 'text', text: 'Check for normal indications.' },
                  {
                    kind: 'warning',
                    text: 'Yellow and green hydraulic systems are pressurized from yellow electric pump. Get ground crew clearance before using the electric pump.',
                  },
                ],
              },
              {
                label: 'ALTN BRAKING',
                action: 'CHECK',
                crew: 'CM2',
              },
              {
                label: 'EMER EQPT',
                action: 'CHECK',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P11/12',
                fcomTitle: 'EMERGENCY EQUIPMENT',
                detail: [
                  { kind: 'action', label: 'EMER EQPT', action: 'CHECK' },
                  {
                    kind: 'text',
                    text: 'Check the emergency equipments as follows:',
                    children: [
                      { kind: 'text', text: '- Life jackets stowed' },
                      { kind: 'text', text: '- Axe stowed' },
                      {
                        kind: 'text',
                        text: '- Smoke hoods or portable oxygen equipment and full face masks stowed and serviceable',
                      },
                      {
                        kind: 'text',
                        text: '- Portable fire extinguisher lockwired and pressure in the green area',
                      },
                      {
                        kind: 'text',
                        text: '- Smoke goggles stowed (smoke hoods)',
                      },
                      { kind: 'text', text: '- Oxygen masks stowed' },
                      { kind: 'text', text: '- Flashlights stowed' },
                      { kind: 'text', text: '- Escape ropes stowed' },
                    ],
                  },
                ],
              },
              {
                label: 'RAIN REPELLENT',
                action: 'CHECK',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P11/12',
                fcomTitle: 'RAIN REPELLENT',
                detail: [
                  {
                    kind: 'action',
                    label: 'RAIN RPLNT indicators',
                    action: 'CHECK PRESSURE and QUANTITY',
                  },
                  {
                    kind: 'caution',
                    text: 'Never use rain repellent to wash the windshield and never use it on a dry windshield.',
                  },
                ],
              },
              {
                label: 'C/B PANELS',
                action: 'CHECK',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P11/12',
                fcomTitle: 'REAR AND OVERHEAD CIRCUIT BREAKERS PANELS',
                detail: [
                  {
                    kind: 'action',
                    label: 'REAR and OVERHEAD CIRCUIT BREAKERS panels',
                    action: 'CHECK',
                  },
                  {
                    kind: 'text',
                    text: 'Check that all circuit breakers are set. Reset as necessary.',
                  },
                ],
              },
              {
                label: 'GEAR PINS and COVERS',
                action: 'CHECK ONBOARD/STOWED',
                crew: 'CM2',
                ref: 'PRO-NOR-SOP-04 P12/12',
                fcomTitle: 'LANDING GEAR PINS AND COVERS',
                detail: [
                  {
                    kind: 'action',
                    star: true,
                    label: 'GEAR PINS and COVERS',
                    action: 'CHECK ONBOARD and STOWED',
                  },
                  {
                    kind: 'text',
                    text: 'Check that three are on board and stowed.',
                  },
                ],
              },
              {
                label: 'EXTERIOR WALKAROUND',
                action: 'PERFORM',
                crew: 'CM1',
                fctmTitle: 'EXTERIOR INSPECTION',
                fctmRef: 'NO-020 P5-6/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'Standard Operating Procedures (SOP) outline the various elements that the flight crew must review in greater detail. The objectives of the exterior inspection are:',
                  },
                  {
                    kind: 'bullet',
                    text: 'To obtain a global assessment of the aircraft status. Any missing parts or panels will be checked against the Configuration Deviation List (CDL) for possible dispatch and any potential operational consequences.',
                  },
                  {
                    kind: 'bullet',
                    text: 'To ensure that main aircraft surfaces are in adequate position relative to surface control levers.',
                  },
                  {
                    kind: 'bullet',
                    text: 'To check that there are no leaks e.g. engine drain mast, hydraulic lines.',
                  },
                  {
                    kind: 'bullet',
                    text: 'To check the status of the essential visible sensors i.e. AOA, pitot and static probes.',
                  },
                  {
                    kind: 'bullet',
                    text: 'To observe any possible abnormalities on the landing gear status:',
                    children: [
                      {
                        kind: 'bullet',
                        text: 'Wheels and tires status (cut, wear, cracks)',
                      },
                      { kind: 'bullet', text: 'Safety pins are removed' },
                      {
                        kind: 'bullet',
                        text: 'Brakes status (Brake wear pin length with parking brake ON)',
                      },
                      {
                        kind: 'bullet',
                        text: 'Length of oleo. Any difference between the two main landing gears shall be reported.',
                      },
                    ],
                  },
                  {
                    kind: 'bullet',
                    text: 'To observe any possible abnormality on the engines:',
                    children: [
                      {
                        kind: 'bullet',
                        text: 'Fan blades, turbine exhaust, engine cowl and pylon status',
                      },
                      { kind: 'bullet', text: 'Access door closed' },
                      {
                        kind: 'bullet',
                        text: 'Correct closure/latching condition of the fan cowl doors.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'MMEL / MEL',
            items: [
              {
                label: 'MMEL / MEL',
                action: 'REVIEW',
                crew: 'BOTH',
                fctmTitle: 'MMEL / MEL',
                fctmRef: 'NO-020 P1-2/20',
                fctmDetail: [
                  { kind: 'heading', text: 'INTRODUCTION TO THE MMEL' },
                  {
                    kind: 'text',
                    text: 'The Master Minimum Equipment List (MMEL) is developed to improve the aircraft use and thereby to provide more convenient and economic air transportation for the public.',
                  },
                  {
                    kind: 'text',
                    text: 'The MMEL is a document that lists the system, function, or equipment which may be temporarily inoperative, subject to certain conditions, while maintaining an acceptable level of safety. It does not contain obviously required items such as wings, flaps, and rudders.',
                  },
                  {
                    kind: 'text',
                    text: 'ALL ITEMS RELATED TO THE AIRWORTHINESS OF THE AIRCRAFT AND NOT INCLUDED IN THE MMEL ARE AUTOMATICALLY REQUIRED TO BE OPERATIVE FOR DISPATCH.',
                  },
                  {
                    kind: 'text',
                    text: 'Non-safety related equipment such as galley equipment and passenger convenience items do not need to be listed.',
                  },
                  {
                    kind: 'text',
                    text: "The MMEL is the basis for the development of individual Operator's MEL which takes into consideration the Operator's particular aircraft equipment configuration and operational conditions. In order to maintain an acceptable level of safety and reliability, the MMEL establishes limitations on the duration and on conditions for operation with inoperative item.",
                  },
                  { kind: 'heading', text: 'INTRODUCTION TO THE MEL' },
                  {
                    kind: 'text',
                    text: "The Minimum Equipment List (MEL) is based on the MMEL. An Operator's MEL may differ in format from the MMEL, but cannot be less restrictive than the MMEL.",
                  },
                  {
                    kind: 'text',
                    text: 'The MEL shall not deviate from any applicable Airworthiness Directive or any other Mandatory Requirement.',
                  },
                  {
                    kind: 'text',
                    text: 'The MEL is intended to permit operation with inoperative system, function, or equipment for a period of time until repairs can be accomplished. It is important that repairs be accomplished at the earliest opportunity.',
                  },
                  {
                    kind: 'text',
                    text: 'Suitable conditions and limitations in the form of placards, maintenance procedures, crew operational procedures, and other restrictions are necessary in the MEL to ensure that an acceptable level of safety is maintained.',
                  },
                  {
                    kind: 'text',
                    text: "The MEL takes into consideration the Operator's particular aircraft equipment, configuration and operational conditions, routes being flown, and requirements set by the appropriate Authority.",
                  },
                  {
                    kind: 'text',
                    text: 'When an item is discovered to be inoperative, it is reported by making an entry in the technical logbook. The item is then either rectified or may be deferred per the MEL before further operation. MEL conditions and limitations do not relieve the Operator from determining that the aircraft is in a correct condition for safe operation with items inoperative.',
                  },
                  {
                    kind: 'text',
                    text: 'The provisions of the MEL are applicable until the aircraft starts the flight. Any decision to continue a flight following a failure or unserviceability must be subject to flight crew judgment and good airmanship. The Commander may continue to make reference to the MEL and use it as appropriate.',
                  },
                  {
                    kind: 'text',
                    text: 'By approval of the MEL, the Authority permits dispatch of the aircraft for revenue, ferry, or training flights with certain items inoperative provided an acceptable level of safety is maintained:',
                  },
                  {
                    kind: 'bullet',
                    text: 'By use of appropriate operational or maintenance procedures or',
                  },
                  {
                    kind: 'bullet',
                    text: 'By transfer of the function to another operating system or',
                  },
                  {
                    kind: 'bullet',
                    text: 'By reference to other instruments or systems providing the required information.',
                  },
                ],
              },
              {
                label: 'MMEL NUMBERING / CONTENTS / OPERATIONAL USE',
                action: 'REVIEW',
                crew: 'BOTH',
                fctmTitle: 'MMEL / MEL',
                fctmRef: 'NO-020 P2-4/20',
                fctmDetail: [
                  { kind: 'heading', text: 'MMEL ITEM NUMBERING' },
                  {
                    kind: 'text',
                    text: 'A code of three or four pairs of digits identifies each MMEL item. The three first digits of this numbering system follow the ATA Spec 2200.',
                  },
                  {
                    kind: 'text',
                    text: 'For practical reasons, the second pair of digit also follows the below Airbus organization:',
                  },
                  {
                    kind: 'bullet',
                    text: '01 refers to items located on the overhead panels',
                  },
                  { kind: 'bullet', text: '05 refers to indications on the PFD' },
                  { kind: 'bullet', text: '06 refers to indications on the ND' },
                  {
                    kind: 'bullet',
                    text: '07 refers to indications on the SD pages',
                  },
                  { kind: 'bullet', text: '08 refers to indications on the EWD' },
                  { kind: 'bullet', text: '09 refers to ECAM alerts' },
                  { kind: 'bullet', text: '10 to 95 follow the ATA Spec 2200' },
                  { kind: 'heading', text: 'MMEL CONTENTS' },
                  { kind: 'text', text: 'The MMEL has four sections:' },
                  {
                    kind: 'bullet',
                    text: 'How to Use (HOW): This section contains general information and describes the organization of the manual.',
                  },
                  {
                    kind: 'bullet',
                    text: 'MMEL Entries (ME): This section lists all the ECAM alerts and gives a link to the associated MMEL item (if any) to be applied for the dispatch. This section is a user-friendly entry point for the flight crew and the maintenance personnel when an ECAM alert reports a system failure.',
                  },
                  {
                    kind: 'bullet',
                    text: 'MMEL Items (MI): This section is approved by the EASA and lists all the MMEL items with the associated dispatch conditions.',
                  },
                  {
                    kind: 'bullet',
                    text: 'MMEL Operational Procedures (MO): This section gives the operational procedures that are associated with the MMEL items.',
                  },
                  {
                    kind: 'text',
                    text: 'Note: The MMEL Maintenance Procedures are published in the Aircraft Maintenance Manual (AMM).',
                  },
                  { kind: 'heading', text: 'OPERATIONAL USE OF THE MEL' },
                  {
                    kind: 'text',
                    text: 'The provisions of the MEL are applicable until the aircraft starts the flight. Any decision to continue a flight following a failure or unserviceability must be subject to flight crew judgment and good airmanship. The Commander may continue to make reference to the MEL and use it as appropriate.',
                  },
                  {
                    kind: 'text',
                    text: 'Airbus recommends that the Operator establishes guidelines in their own MEL, on how the flight crew should handle failures occurring during taxi out, depending on:',
                  },
                  {
                    kind: 'bullet',
                    text: 'Departure and destination airports: e.g. main base, outstation',
                  },
                  {
                    kind: 'bullet',
                    text: 'The type of flight: e.g. livestock transportation, maximum altitude, airspace, flight time, weather',
                  },
                  {
                    kind: 'bullet',
                    text: 'The operational impacts: flight crew workload, navigation, communication, landing capability.',
                  },
                  {
                    kind: 'text',
                    text: 'During the preliminary cockpit preparation, the flight crew should press the RCL pb for at least 3 s, in order to recall any previous alerts that were cleared or cancelled. The flight crew must also consult the technical logbook to confirm that the alerts are compatible with the MEL.',
                  },
                  {
                    kind: 'text',
                    text: 'The purpose of the MEL Entries section is to help the flight crew to determine the MEL entry point. It provides the relationship between the failure symptom (i.e. ECAM alerts), and the MEL items, if applicable.',
                  },
                  {
                    kind: 'text',
                    text: 'If a failed item does not appear in the MEL, it is not possible to dispatch the aircraft, except if the item is not related to airworthiness or to operating requirements (e.g. galley equipment, entertainment systems, or passenger convenience items). The dispatch applicability of these items is not relevant to the MEL.',
                  },
                  {
                    kind: 'text',
                    text: 'If the failed item appears in the MEL, the dispatch of the aircraft is permitted, provided that all of the dispatch conditions are satisfied:',
                  },
                  {
                    kind: 'bullet',
                    text: 'Check on the technical logbook that the repair interval time did not expire. For more information on the repair interval, Refer to MMEL/MI-PRE-RI Repair interval.',
                  },
                  {
                    kind: 'bullet',
                    text: 'Consider location and when the repair is possible',
                  },
                  {
                    kind: 'bullet',
                    text: 'Placard means that an INOP placard is required',
                  },
                  {
                    kind: 'bullet',
                    text: '(o) means that a specific operational procedure or limitation is required',
                  },
                  {
                    kind: 'bullet',
                    text: '(m) means that a specific maintenance procedure is required.',
                  },
                  {
                    kind: 'text',
                    text: 'When the aircraft performs several flights with the same inoperative MEL item:',
                  },
                  {
                    kind: 'bullet',
                    text: 'The operational procedure (if any) should be repeated before each flight, unless differently specified. The flight crew usually applies the operational procedure during the cockpit preparation, but some actions can be applicable during other flight phases.',
                  },
                  {
                    kind: 'bullet',
                    text: 'The maintenance procedure (if any) is normally a one-time action that must be applied before the first MEL dispatch. However the dispatch condition may specify a periodicity for repetitive actions. In this case the maintenance procedure must be applied before the first MEL dispatch and must be repeated at the defined periodicity.',
                  },
                  {
                    kind: 'text',
                    text: 'In the case of failures occurring during flight, the MEL is not applicable. For in-flight failures, the flight crew should follow the ECAM alerts. The only exception to this rule is when an operational procedure in the MEL requires flight crew action during the flight, since it can deviate from usual flight crew action.',
                  },
                  {
                    kind: 'text',
                    text: 'However, the flight crew can consult the MEL, in flight, following a failure, to plan effectively the end of the flight. Are there maintenance personnel available at destination for deactivation? Is there a need for a spare part to be ordered?',
                  },
                ],
              },
              {
                label: 'SECURED AND TRANSIT STOP',
                action: 'IDENTIFY',
                crew: 'BOTH',
                fctmTitle: 'SECURED AND TRANSIT STOP',
                fctmRef: 'NO-020 P4/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'If the last checklist performed by the flight crew is SECURING THE AIRCRAFT C/L, the aircraft is in SECURED STOP. After a SECURED STOP, the flight crew must perform all items in the Standard Operations Procedure (SOP), for the next flight.',
                  },
                  {
                    kind: 'text',
                    text: 'If the last checklist performed by the flight crew is PARKING C/L, the aircraft is in TRANSIT STOP. After a TRANSIT STOP, items indicated by (*), are the only steps to be completed for TRANSIT PREPARATION. i.e. SAFETY EXTERIOR INSPECTION, PRELIMINARY COCKPIT PREPARATION, EXTERIOR INSPECTION, and COCKPIT PREPARATION.',
                  },
                ],
              },
            ],
          },
          {
            name: 'ADIRS',
            items: [
              {
                label: 'ADIRS ALIGNMENT OR REALIGNMENT',
                action: 'ALIGN',
                crew: 'BOTH',
                fctmTitle: 'ADIRS ALIGNMENT OR REALIGNMENT',
                fctmRef: 'NO-020 P6-7/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'For operational procedures associated to ADIRS, Refer to FCOM/PRO-SUP-34 IRS Alignment Conditions.',
                  },
                  {
                    kind: 'text',
                    text: 'The flight crew performs the alignment or realignment of IRS during the cockpit preparation. This action enables IRS to operate in NAV mode and to provide continuously the aircraft position.',
                  },
                  { kind: 'text', text: 'The flight crew performs:' },
                  {
                    kind: 'bullet',
                    text: 'The IRS alignment at the aircraft power up, and',
                  },
                  {
                    kind: 'bullet',
                    text: 'The IRS realignment in transit when the IRS are already in NAV mode and the flight crew wants to reset them for better navigation accuracy.',
                  },
                  { kind: 'text', text: 'The flight crew can perform:' },
                  {
                    kind: 'bullet',
                    text: 'An alignment or a realignment of IRS with a complete IRS alignment procedure, or',
                  },
                  {
                    kind: 'bullet',
                    text: 'A realignment of IRS with a Fast IRS alignment procedure.',
                  },
                  {
                    kind: 'text',
                    text: 'The IRS alignment or realignment includes the following two steps:',
                  },
                  { kind: 'bullet', text: 'Alignment,' },
                  { kind: 'bullet', text: 'Position Initialization.' },
                  { kind: 'heading', text: 'ALIGNMENT STEP' },
                  {
                    kind: 'text',
                    text: 'During a complete alignment, IRS use the gravity and earth rotation to determine aircraft attitude and true heading, and IRS estimate the current aircraft latitude.',
                  },
                  {
                    kind: 'text',
                    text: 'During a fast alignment, IRS reset the ground speed and some internal filters to 0, but IRS do not estimate the aircraft latitude.',
                  },
                  { kind: 'heading', text: 'POSITION INITIALIZATION STEP' },
                  {
                    kind: 'text',
                    text: 'To finish alignment or realignment, the flight crew initialized IRS to a navigation starting point.',
                  },
                  {
                    kind: 'subheading',
                    text: 'AUTOMATIC POSITION INITIALIZATION (AIRCRAFT WITH MP P8194)',
                  },
                  {
                    kind: 'text',
                    text: "When the GPS is available: IRS are automatically initialized with the GPS position. However, the flight crew can override the automatic position initialization. Therefore, IRS crosschecks the flight crew's manual entry with the GPS position.",
                  },
                  {
                    kind: 'text',
                    text: 'When the GPS is not available, the flight crew must performed a manual position initialization.',
                  },
                  {
                    kind: 'subheading',
                    text: 'MANUAL POSITION INITIALIZATION (AIRCRAFT WITH OR WITHOUT MP P8194)',
                  },
                  {
                    kind: 'text',
                    text: 'The coordinates of the departure Airport Reference Point (ARP) are displayed on the MCDU INIT page. However, the most appropriate coordinates for IRS position initialization are the gate coordinates.',
                  },
                  {
                    kind: 'text',
                    text: 'In this case, and in order to avoid entry errors, the flight crew should use the slew keys successively for latitude and longitude, instead of inserting the coordinates on the scratchpad.',
                  },
                  { kind: 'heading', text: 'CHECK OF ADIRS MODE' },
                  {
                    kind: 'text',
                    text: 'During the BEFORE START checklist, the flight crew checks that IRS are in NAV mode on the MCDU.',
                  },
                  {
                    kind: 'text',
                    text: 'During taxi, a good way to check the global consistency of FMGC entries (Position and flight plan) is to check the runway and the SID on the ND, in comparison to the aircraft symbol that indicates the current aircraft position. To do so, set the ND in ARC or NAV mode with a range 10 NM.',
                  },
                ],
              },
            ],
          },
          {
            name: 'COCKPIT PREPARATION',
            items: [
              {
                label: 'FLOW PATTERN',
                action: 'SCAN',
                crew: 'BOTH',
                fctmTitle: 'COCKPIT PREPARATION · FLOW PATTERN',
                fctmRef: 'NO-020 P8/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'The scan pattern varies, depending on the pilot status, i.e PF, PM, CM1, or CM2, and the areas of responsibility:',
                  },
                  { kind: 'bullet', text: '1. Overhead panel' },
                  { kind: 'bullet', text: '2. Center instrument panel' },
                  { kind: 'bullet', text: '3. Pedestal' },
                  {
                    kind: 'bullet',
                    text: '4. FMGS preparation, and when both pilots are seated:',
                  },
                  { kind: 'bullet', text: '5. Glareshield' },
                  {
                    kind: 'bullet',
                    text: '6. Lateral consoles and CM1/CM2 panels',
                  },
                ],
              },
              {
                label: 'FMGS PROGRAMMING',
                action: 'PROGRAM',
                crew: 'BOTH',
                fctmTitle: 'COCKPIT PREPARATION · FMGS PROGRAMMING',
                fctmRef: 'NO-020 P9-11/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'FMGS programming involves inserting navigation data, then performance data. It is to be noted that:',
                  },
                  { kind: 'bullet', text: 'Boxed fields must be filled' },
                  {
                    kind: 'bullet',
                    text: 'Blue fields inform the crew that entry is permitted',
                  },
                  {
                    kind: 'bullet',
                    text: 'Green fields are used for FMS generated data, and cannot be changed',
                  },
                  {
                    kind: 'bullet',
                    text: 'Magenta characters identify limits (altitude, speed or time), that FMS will attempt to meet',
                  },
                  {
                    kind: 'bullet',
                    text: 'Yellow characters indicate a temporary flight plan display',
                  },
                  {
                    kind: 'bullet',
                    text: 'Amber characters signify that the item being displayed is important and requires immediate action',
                  },
                  {
                    kind: 'bullet',
                    text: 'Small font signifies that data is FMS computed',
                  },
                  {
                    kind: 'bullet',
                    text: 'Large font signifies manually entered data.',
                  },
                  {
                    kind: 'text',
                    text: 'This sequence of entry is the most practical. INIT B should not be filled immediately after INIT A, because the FMGS would begin to compute F-PLN predictions. These computations would slow down the entry procedure.',
                  },
                  {
                    kind: 'text',
                    text: 'To obtain correct predictions, the fields of the various pages must be completed correctly, with available planned data for the flight:',
                  },
                  { kind: 'subheading', text: 'DATA' },
                  {
                    kind: 'text',
                    text: 'The database validity, NAVAIDs and waypoints (possibly stored in previous flight), and PERF FACTOR must be checked on the STATUS page.',
                  },
                  { kind: 'subheading', text: 'INIT A' },
                  {
                    kind: 'text',
                    text: 'The INIT A page provides access to aircraft present position. The flight crew will check that it corresponds to the real aircraft position (Refer to NO-020 ADIRS Alignment or Realignment). The history wind is the vertical wind profile that has been encountered during the previous descent and should be entered at this stage if it is representative of the vertical wind profile for the next flight.',
                  },
                  { kind: 'subheading', text: 'F-PLN' },
                  {
                    kind: 'text',
                    text: 'The F-PLN A page is to be completed thoroughly including:',
                  },
                  { kind: 'bullet', text: 'The take-off runway' },
                  { kind: 'bullet', text: 'SID' },
                  { kind: 'bullet', text: 'Altitude and speed constraints' },
                  {
                    kind: 'bullet',
                    text: 'Correct transition to the cruise waypoint',
                  },
                  {
                    kind: 'bullet',
                    text: 'Intended step climb/descents, according to the Computerized Flight Plan (CFP).',
                  },
                  {
                    kind: 'text',
                    text: 'If time permits, the wind profile along the flight plan may be inserted using vertical revision through wind prompt. The flight crew should also check the overall route distance (6th line of the F-PLN page), versus CFP distance.',
                  },
                  { kind: 'subheading', text: 'SEC F-PLN' },
                  {
                    kind: 'text',
                    text: 'The SEC F-PLN should be used to consider an alternate runway for take-off, a return to departure airfield or a routing to a take-off alternate.',
                  },
                  { kind: 'subheading', text: 'RAD NAV' },
                  {
                    kind: 'text',
                    text: 'The RAD NAV page is checked, and any required NAVAID should be manually entered using ident. If a NAVAID is reported on NOTAM as unreliable, it must be deselected on the MCDU DATA/POSITION MONITOR/SEL NAVAID page.',
                  },
                  { kind: 'subheading', text: 'INIT B' },
                  { kind: 'text', text: 'The flight crew:' },
                  {
                    kind: 'bullet',
                    text: 'Inserts the expected ZFWCG/ZFW, and block fuel to initialize a F-PLN computation.',
                  },
                  {
                    kind: 'bullet',
                    text: 'Checks fuel figures consistent with flight preparation fuel figures.',
                  },
                  {
                    kind: 'text',
                    text: 'The flight crew will update weight and CG on receipt of the load sheet. The FMS uses the trip wind for the entire flight from origin to destination. The trip wind is an average wind component that may be extracted from the CFP. The trip wind facility is available if the wind profile has not already been entered. After Engine start, the INIT B page is no longer available. The flight crew should use the FUEL PRED page for weight and fuel data insertion, if required.',
                  },
                  { kind: 'subheading', text: 'PERF' },
                  {
                    kind: 'text',
                    text: 'The thrust reduction altitude/acceleration altitude (THR RED /ACC) are set to default at 1 500 ft, or at a value defined by airline policy. The THR RED/ACC may be changed in the PERF TAKE-OFF page, if required. The flight crew should consider the applicable noise abatement procedure.',
                  },
                  {
                    kind: 'text',
                    text: 'The one-engine-out acceleration altitude must:',
                  },
                  {
                    kind: 'bullet',
                    text: 'Be at least 400 ft above airport altitude',
                  },
                  {
                    kind: 'bullet',
                    text: 'Ensure that the net flight path is 35 ft above obstacles',
                  },
                  {
                    kind: 'bullet',
                    text: 'Ensure that the maximum time for takeoff thrust is not exceeded.',
                  },
                  {
                    kind: 'text',
                    text: 'Therefore, there are generally a minimum and a maximum one engine out acceleration altitude values. The minimum value satisfies the first two criteria. The maximum value satisfies the last one. Any value between those two may be retained. The one engine out acceleration altitude is usually defaulted to 1 500 ft AGL and will be updated as required.',
                  },
                  {
                    kind: 'text',
                    text: 'The flight crew uses the PERF CLB page to pre-select a speed. For example, "Green Dot" speed for a sharp turn after take-off.',
                  },
                  {
                    kind: 'text',
                    text: 'The crew may also check on the PROG page the CRZ FL, MAX REC FL and OPT FL. Once the FMGS has been programmed, the PM should then cross check the information prior to the take-off briefing. When the predictions are available, the crew may print the PREFLIGHT DATA. This listing provides all the predictions which may be used during the initial part of the flight.',
                  },
                ],
              },
              {
                label: 'TAKE-OFF BRIEFING',
                action: 'BRIEF',
                crew: 'PF',
                fctmTitle: 'COCKPIT PREPARATION · TAKE-OFF BRIEFING',
                fctmRef: 'NO-020 P11-12/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'The PF should perform the takeoff briefing at the gate, when the flight crew workload permits, cockpit preparation has been completed and, before engine start.',
                  },
                  {
                    kind: 'text',
                    text: 'The takeoff briefing should be relevant, concise and chronological. When a main parameter is referred to by the PF, both flight crewmembers must crosscheck that the parameter has been set or programmed correctly. The takeoff briefing covers the following:',
                  },
                  { kind: 'heading', text: '1 - MISCELLANEOUS' },
                  {
                    kind: 'bullet',
                    text: 'Aircraft type and model (Tail strike awareness)',
                  },
                  {
                    kind: 'bullet',
                    text: 'Aircraft technical status (MEL and CDL considerations, relevant OEB)',
                  },
                  { kind: 'bullet', text: 'NOTAMS' },
                  { kind: 'bullet', text: 'Weather' },
                  { kind: 'bullet', text: 'RWY conditions' },
                  { kind: 'bullet', text: 'Use of ENG/Wing Anti Ice' },
                  { kind: 'bullet', text: 'ENG Start Procedure' },
                  { kind: 'bullet', text: 'Push Back' },
                  { kind: 'bullet', text: 'Expected Taxi Clearance' },
                  { kind: 'bullet', text: 'Use of Radar' },
                  { kind: 'bullet', text: 'Use of Packs for Takeoff' },
                  { kind: 'heading', text: '2 - INIT B PAGE' },
                  { kind: 'bullet', text: 'Block Fuel (1)' },
                  { kind: 'bullet', text: 'Estimated TOW' },
                  { kind: 'bullet', text: 'Extra time at destination' },
                  { kind: 'heading', text: '3 - TAKEOFF PERF PAGE' },
                  { kind: 'bullet', text: 'TO RWY' },
                  { kind: 'bullet', text: 'TO CONF' },
                  { kind: 'bullet', text: 'FLEX / TOGA (1)' },
                  { kind: 'bullet', text: 'V1, VR, V2 (1)' },
                  { kind: 'bullet', text: 'TRANS ALT' },
                  { kind: 'bullet', text: 'THR RED / ACC Altitude' },
                  { kind: 'bullet', text: 'Minimum Safe Altitude' },
                  { kind: 'bullet', text: 'First assigned FL (1)' },
                  { kind: 'bullet', text: 'Flight Plan description (1)' },
                  { kind: 'bullet', text: 'RAD NAV (1)' },
                  {
                    kind: 'heading',
                    text: '4 - FLIGHT PLAN  /  5 - ABNORMAL OPERATIONS',
                  },
                  {
                    kind: 'text',
                    text: 'For any failure before V1: CAPT will call "STOP" or "GO".',
                  },
                  { kind: 'text', text: 'In case of failure after V1:' },
                  {
                    kind: 'bullet',
                    text: 'continue TO, no actions before 400 ft AGL except gear up',
                  },
                  {
                    kind: 'bullet',
                    text: 'reaching 400 ft AGL, ECAM actions',
                  },
                  {
                    kind: 'bullet',
                    text: 'reaching EO ACC altitude:',
                    children: [
                      {
                        kind: 'bullet',
                        text: 'If the engine is secured, level off, accelerate and clean up',
                      },
                      {
                        kind: 'bullet',
                        text: 'Otherwise continue climbing until the engine is secured (but not above EO maximum acceleration altitude)',
                      },
                    ],
                  },
                  {
                    kind: 'bullet',
                    text: 'at green dot: OP CLB, MCT, resume ECAM, after TO C/L, status',
                  },
                  {
                    kind: 'bullet',
                    text: 'ENG OUT routing: EOSID, SID, radar vector, immediate return ...',
                  },
                  {
                    kind: 'text',
                    text: '(1) Items that must be cross-checked on the associated display.',
                  },
                ],
              },
            ],
          },
          {
            name: 'MISCELLANEOUS',
            items: [
              {
                label: 'SEATING POSITION & RUDDER PEDALS',
                action: 'ADJUST',
                crew: 'BOTH',
                fctmTitle: 'MISCELLANEOUS · SEATING POSITION AND ADJUSTMENT OF RUDDER PEDALS',
                fctmRef: 'NO-020 P19-20/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: "To achieve a correct seating position, the aircraft is fitted with an eye-position indicator on the centre windscreen post. The eye-position indicator has two balls on it. When the balls are superimposed on each other, they indicate that the pilot's eyes are in the correct position.",
                  },
                  {
                    kind: 'text',
                    text: "The flight crew should not sit too low, to avoid increasing the cockpit cut-off angle, therefore reducing the visual segment. During Low Visibility Procedures (LVP), it is important that the pilot's eyes are positioned correctly, in order to maximize the visual segment, and consequently, increase the possibility of achieving the appropriate visual reference for landing as early as possible.",
                  },
                  {
                    kind: 'text',
                    text: "After adjusting the seat, each pilot should adjust the outboard armrest, so that the forearm rests comfortably on it, when holding the sidestick. There should be no gaps between the pilot's forearm and the armrest. The pilot's wrist should not be bent when holding the sidestick. This ensures that the pilot can accomplish flight maneuvers by moving the wrist instead of lifting the forearm from the armrest.",
                  },
                  {
                    kind: 'text',
                    text: 'Symptoms of incorrect armrest adjustment include over-controlling, and not being able to make small, precise inputs.',
                  },
                  {
                    kind: 'text',
                    text: 'The flight crew must have their feet in a position so that full rudder deflection combined with full braking, even differential, can be applied instinctively and without delay.',
                  },
                  {
                    kind: 'text',
                    text: 'The armrest and the rudder pedals have position indicators. These positions should be noted and set accordingly for each flight.',
                  },
                ],
              },
              {
                label: 'MCDU USE',
                action: 'SET',
                crew: 'BOTH',
                fctmTitle: 'MISCELLANEOUS · MCDU USE',
                fctmRef: 'NO-020 P20/20',
                fctmDetail: [
                  {
                    kind: 'text',
                    text: 'When clear for start up and taxi, the PF will preferably display the MCDU PERF TAKE OFF page whereas the PM will display the MCDU F-PLN page.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// UI
// ============================================================================

function toParagraphs(x?: string | string[]): string[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function Caret({ open }: { open: boolean }) {
  return open ? (
    <KeyboardArrowDown fontSize="small" className="text-gray-400" />
  ) : (
    <KeyboardArrowRight fontSize="small" className="text-gray-400" />
  );
}

function CrewBadge({ crew }: { crew: Crew }) {
  const meta = CREW_META[crew];
  return (
    <span
      className={`inline-flex items-center justify-center w-12 shrink-0 text-[11px] font-bold rounded border px-1 py-0.5 ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

function CrewLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Who does it
      </span>
      {(Object.keys(CREW_META) as Crew[]).map((crew) => (
        <span key={crew} className="inline-flex items-center gap-2">
          <CrewBadge crew={crew} />
          <span className="text-xs text-gray-600">{CREW_META[crew].full}</span>
        </span>
      ))}
    </div>
  );
}

const SIGNAL_ICON: Record<VerifState, React.ReactNode> = {
  auto: <Sensors fontSize="inherit" />,
  gap: <WarningAmber fontSize="inherit" />,
  manual: <PanTool fontSize="inherit" />,
  ns: <Block fontSize="inherit" />,
};

// The ACARS signal chip: at a glance, is this line wired to the aircraft?
function SignalChip({ state }: { state: VerifState }) {
  const meta = VERIF_META[state];
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold tracking-wide rounded-full border px-2 py-0.5 ${meta.chip}`}
    >
      <span className="text-[11px] leading-none">{SIGNAL_ICON[state]}</span>
      {meta.label}
    </span>
  );
}

// Compact one-line row that stays in its CM1/CM2 lane.
function ItemRow({
  item,
  open,
  expandable,
  step,
  onToggle,
}: {
  item: MockItem;
  open: boolean;
  expandable: boolean;
  step: number;
  onToggle: () => void;
}) {
  const state = verifState(item);
  const meta = VERIF_META[state];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative overflow-hidden w-full flex items-center gap-2 pl-3 pr-2.5 py-2 text-left ${
        open
          ? 'bg-slate-50 border-b border-slate-200 cursor-pointer'
          : `bg-white rounded-lg border border-gray-200 ${expandable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`
      }`}
    >
      {/* verifiability rail — scan this edge to see what the sim is watching */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.rail}`}
        aria-hidden="true"
      />
      <span className="shrink-0 w-5 text-right text-[11px] font-semibold tabular-nums text-gray-400">
        {step}
      </span>
      {expandable ? <Caret open={open} /> : <span className="w-5 shrink-0" />}
      <CrewBadge crew={item.crew} />
      <span className="flex-1 min-w-0 font-medium text-gray-900 text-sm break-words">
        {item.label}
      </span>
      <span className="font-bold text-emerald-700 text-sm tracking-wide whitespace-nowrap">
        {item.action}
      </span>
      <SignalChip state={state} />
      {item.acars && <WhenMark acars={item.acars} />}
    </button>
  );
}

const CALLOUT_STYLE: Record<
  'WARNING' | 'CAUTION' | 'NOTE',
  { wrap: string; badge: string; icon: React.ReactNode }
> = {
  WARNING: {
    wrap: 'bg-red-50 border-red-200 border-l-4 border-l-red-600',
    badge: 'bg-red-700 text-white',
    icon: <ReportProblem fontSize="inherit" />,
  },
  CAUTION: {
    wrap: 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-500',
    badge: 'bg-orange-600 text-white',
    icon: <WarningAmber fontSize="inherit" />,
  },
  NOTE: {
    wrap: 'bg-slate-50 border-slate-200 border-l-4 border-l-slate-400',
    badge: 'bg-slate-600 text-white',
    icon: <InfoOutlined fontSize="inherit" />,
  },
};

function CalloutCard({
  kind,
  text,
}: {
  kind: 'WARNING' | 'CAUTION';
  text: string;
}) {
  const s = CALLOUT_STYLE[kind];
  return (
    <div className={`rounded-lg border px-3 py-2 ${s.wrap}`}>
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0 ${s.badge}`}
        >
          {s.icon}
          {kind}
        </span>
        <p className="text-xs leading-relaxed text-gray-800">{text}</p>
      </div>
    </div>
  );
}

function NoteCard({
  kind,
  icon,
  tone,
  paragraphs,
}: {
  kind: string;
  icon: React.ReactNode;
  tone: 'amber';
  paragraphs: string[];
}) {
  const tones: Record<string, string> = {
    amber: 'bg-white border-gray-200 border-l-4 border-l-amber-600',
  };
  const badge: Record<string, string> = {
    amber: 'bg-amber-700 text-white',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${badge[tone]}`}
        >
          {icon}
          {kind}
        </span>
      </div>
      <div className="space-y-1.5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-xs leading-relaxed text-gray-700">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

// Asterisk = only step repeated after a transit stop without crew change.
function StarMark() {
  return (
    <span
      title="Only step repeated after a transit stop without flight crew change"
      className="text-amber-600 font-bold"
    >
      *
    </span>
  );
}

// Recursive, faithful render of the FCOM's nested line structure.
function FcomNodeView({ node }: { node: FcomNode }) {
  const kids =
    node.children && node.children.length > 0 ? (
      <div className="mt-1 ml-2.5 pl-3 border-l border-gray-200 space-y-1">
        {node.children.map((c, i) => (
          <FcomNodeView key={i} node={c} />
        ))}
      </div>
    ) : null;

  switch (node.kind) {
    case 'context':
      return (
        <div>
          <div className="flex items-start gap-1.5 text-xs font-semibold text-gray-700">
            <span className="mt-px text-gray-400">●</span>
            <span className="break-words">{node.text}</span>
          </div>
          {kids}
        </div>
      );
    case 'condition':
      return (
        <div>
          <div className="flex items-start gap-1.5 text-xs font-semibold italic text-amber-800">
            <span className="mt-px">◇</span>
            <span className="break-words">{node.text}</span>
          </div>
          {kids}
        </div>
      );
    case 'action':
      return (
        <div>
          <div className="flex items-baseline gap-2 rounded-md bg-gray-50 border border-gray-200 px-2.5 py-1.5">
            <span className="flex-1 min-w-0 text-xs font-medium text-gray-800 break-words">
              {node.star && <StarMark />} {node.label}
            </span>
            <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
              {node.action}
            </span>
          </div>
          {kids}
        </div>
      );
    case 'text':
      return (
        <div>
          <p className="text-xs leading-relaxed text-gray-700">{node.text}</p>
          {kids}
        </div>
      );
    case 'note':
      return (
        <div>
          <div className="rounded-md bg-slate-50 border border-slate-200 border-l-4 border-l-slate-400 px-2.5 py-1.5">
            <p className="text-xs leading-relaxed text-gray-700">
              <span className="font-bold">Note:</span> {node.text}
            </p>
          </div>
          {kids}
        </div>
      );
    case 'warning':
    case 'caution':
      return (
        <div>
          <CalloutCard
            kind={node.kind === 'warning' ? 'WARNING' : 'CAUTION'}
            text={node.text ?? ''}
          />
          {kids}
        </div>
      );
  }
}

// Recursive, faithful render of the FCTM's nested prose structure.
function FctmNodeView({ node }: { node: FctmNode }) {
  const kids =
    node.children && node.children.length > 0 ? (
      <div className="mt-1 ml-2 pl-3 border-l border-amber-200 space-y-1">
        {node.children.map((c, i) => (
          <FctmNodeView key={i} node={c} />
        ))}
      </div>
    ) : null;

  switch (node.kind) {
    case 'heading':
      return (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            {node.text}
          </p>
          {kids}
        </div>
      );
    case 'subheading':
      return (
        <div>
          <p className="text-xs font-semibold text-amber-900">{node.text}</p>
          {kids}
        </div>
      );
    case 'bullet':
      return (
        <div>
          <div className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            <p className="text-xs leading-relaxed text-gray-700 break-words">
              {node.text}
            </p>
          </div>
          {kids}
        </div>
      );
    case 'text':
    default:
      return (
        <div>
          <p className="text-xs leading-relaxed text-gray-700 break-words">
            {node.text}
          </p>
          {kids}
        </div>
      );
  }
}

// ACARS / verifiability block shown at the top of the detail: the technical
// layer the editor needs — the rule condition, or the gap that must be fixed.
function VerifBlock({ item }: { item: MockItem }) {
  const state = verifState(item);
  const { onAuthorRule, onTestRule, onDowngrade } =
    useContext(AuthoringContext);
  const apiItem = item.apiItem;
  const canAuthor = !!onAuthorRule && !!apiItem;
  const authorRule = () => {
    if (onAuthorRule && apiItem) onAuthorRule(apiItem);
  };
  const testRuleReplay = () => {
    if (onTestRule && apiItem) onTestRule(apiItem);
  };
  const downgrade = () => {
    if (onDowngrade && apiItem) onDowngrade(apiItem);
  };

  if (state === 'auto' && item.acars) {
    const a = item.acars;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-cyan-700 text-white">
            <Sensors fontSize="inherit" />
            ACARS · monitored
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            {a.phases.join(' · ')}
          </span>
        </div>

        {/* when this rule is graded: flight phase × trigger type */}
        <WhenLine acars={a} />
        <div className="rounded-md bg-slate-900 px-2.5 py-2 font-mono text-[11px] leading-relaxed space-y-0.5">
          {a.cond.map(([d, op], i) => (
            <div key={i}>
              <span className="text-amber-300">{d}</span>{' '}
              <span className="font-bold text-cyan-300">{op}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
          <span>
            <span className="font-semibold text-gray-500">Type</span> {a.type}
          </span>
          <span>
            <span className="font-semibold text-gray-500">On violation</span>{' '}
            {a.sev}
          </span>
          <span className="font-mono text-gray-400 break-all">{a.dref}</span>
        </div>
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={authorRule}
            disabled={!canAuthor}
            className={`text-[11px] font-semibold rounded border border-gray-300 px-2 py-1 ${
              canAuthor
                ? 'text-gray-600 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Edit rule
          </button>
          <button
            type="button"
            onClick={testRuleReplay}
            disabled={!canAuthor}
            className={`text-[11px] font-semibold rounded border border-gray-300 px-2 py-1 ${
              canAuthor
                ? 'text-gray-600 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Test rule
          </button>
        </div>
      </div>
    );
  }

  if (state === 'gap') {
    return (
      <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-orange-600 text-white">
            <WarningAmber fontSize="inherit" />
            No rule
          </span>
          <p className="text-xs leading-relaxed text-gray-800">
            Marked <b>AUTO</b> but has no validation rule — it will{' '}
            <b>never score</b>. Author a rule, or downgrade it to MANUAL /
            NOT SIMULATED.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={authorRule}
            disabled={!canAuthor}
            className={`text-[11px] font-bold rounded px-2 py-1 text-white ${
              canAuthor
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-orange-300 cursor-not-allowed'
            }`}
          >
            ＋ Add validation rule
          </button>
          <button
            type="button"
            onClick={downgrade}
            disabled={!canAuthor}
            className={`text-[11px] font-semibold rounded border border-gray-300 px-2 py-1 ${
              canAuthor
                ? 'text-gray-600 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Downgrade to MANUAL
          </button>
          {!canAuthor && (
            <span className="text-[10px] text-gray-400">
              editable on a draft version
            </span>
          )}
        </div>
      </div>
    );
  }

  if (state === 'ns') {
    return (
      <p className="text-xs italic text-gray-500">
        Not simulated — excluded from grading.
      </p>
    );
  }

  return (
    <p className="text-xs italic text-gray-500">
      Self-attested — ACARS does not observe this item.
    </p>
  );
}

// Detail body — sits flush under the row header inside the open card.
function ItemDetail({ item }: { item: MockItem }) {
  const detail = item.detail ?? [];
  const fctmDetail = item.fctmDetail ?? [];
  const fctm = toParagraphs(item.fctm);
  return (
    <div className="bg-white">
      <div className="px-3 py-3 space-y-2.5">
        {/* the row header above already names the item; just anchor the FCOM ref */}
        {item.ref && (
          <div className="flex justify-end">
            <span className="text-[10px] font-mono text-gray-400">
              {item.ref}
            </span>
          </div>
        )}

        {/* ACARS monitoring / verifiability — the technical layer up top */}
        <VerifBlock item={item} />

        {/* faithful FCOM reproduction */}
        {detail.length > 0 && (
          <div className="space-y-1.5">
            {item.fcomTitle && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-sky-700 text-white">
                <MenuBook fontSize="inherit" />
                FCOM · {item.fcomTitle}
              </div>
            )}
            <div className="space-y-1">
              {detail.map((n, i) => (
                <FcomNodeView key={i} node={n} />
              ))}
            </div>
          </div>
        )}

        {/* faithful FCTM reproduction */}
        {fctmDetail.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-amber-700 text-white">
                <TipsAndUpdates fontSize="inherit" />
                FCTM{item.fctmTitle ? ` · ${item.fctmTitle}` : ''}
              </span>
              {item.fctmRef && (
                <span className="text-[10px] font-mono text-gray-400">
                  {item.fctmRef}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {fctmDetail.map((n, i) => (
                <FctmNodeView key={i} node={n} />
              ))}
            </div>
          </div>
        )}

        {fctmDetail.length === 0 && fctm.length > 0 && (
          <NoteCard
            kind="FCTM"
            icon={<TipsAndUpdates fontSize="inherit" />}
            tone="amber"
            paragraphs={fctm}
          />
        )}
      </div>
    </div>
  );
}

// One item: compact row in its lane, full-width detail beneath when expanded.
function ItemLane({
  item,
  pfSide,
  step,
  lens,
}: {
  item: MockItem;
  pfSide: 'left' | 'right';
  step: number;
  lens: Lens;
}) {
  const [open, setOpen] = useState(false);
  const side = resolveSide(item.crew, pfSide);
  const state = verifState(item);
  const hasFcom =
    (item.detail?.length ?? 0) > 0 ||
    (item.fctmDetail?.length ?? 0) > 0 ||
    !!item.fctm;
  // AUTO / gap items always have something to show (the ACARS block / the gap).
  const hasDetail = hasFcom || state === 'auto' || state === 'gap';

  // The "altitude" control drives default expansion across the whole tree.
  useEffect(() => {
    if (!hasDetail) {
      setOpen(false);
    } else if (lens === 'study') {
      setOpen(true);
    } else if (lens === 'telemetry') {
      setOpen(state === 'auto');
    } else {
      setOpen(false);
    }
  }, [lens, hasDetail, state]);

  const toggle = () => hasDetail && setOpen((o) => !o);

  // Open: lift the item out of the CM1/CM2 lanes into one focused, self-contained
  // card (header row + detail body) so it is obvious where the content starts and
  // ends — and where the next checklist item begins.
  if (open && hasDetail) {
    return (
      <div className="relative z-10 my-3 overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-md">
        <ItemRow item={item} open expandable step={step} onToggle={toggle} />
        <ItemDetail item={item} />
      </div>
    );
  }

  const col =
    side === 'left'
      ? 'col-start-1'
      : side === 'right'
        ? 'col-start-2'
        : 'col-span-2';

  return (
    <div className="grid grid-cols-2 gap-x-6">
      <div className={`${col} min-w-0`}>
        <ItemRow
          item={item}
          open={false}
          expandable={hasDetail}
          step={step}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}

function SystemBlock({
  system,
  pfSide,
  startIndex,
  lens,
}: {
  system: MockSystem;
  pfSide: 'left' | 'right';
  startIndex: number;
  lens: Lens;
}) {
  return (
    <div>
      {/* system name — full-width divider sitting on the center line */}
      <div className="flex items-center justify-center py-1">
        <span className="bg-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 rounded-full border border-gray-200 px-3 py-0.5">
          {system.name}
        </span>
      </div>
      <div className="space-y-1.5">
        {system.items.map((item, i) => (
          <ItemLane
            key={i}
            item={item}
            pfSide={pfSide}
            step={startIndex + i + 1}
            lens={lens}
          />
        ))}
      </div>
    </div>
  );
}

function GroupBlock({
  group,
  pfSide,
  lens,
}: {
  group: MockGroup;
  pfSide: 'left' | 'right';
  lens: Lens;
}) {
  const [open, setOpen] = useState(true);

  // Continuous step numbering across all systems in the panel.
  const starts: number[] = [];
  group.systems.reduce((acc, s, i) => {
    starts[i] = acc;
    return acc + s.items.length;
  }, 0);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* sticky context bar: panel name + CM1/CM2 pinned while scrolling */}
      <div className="sticky top-0 z-20 rounded-t-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-left border-b border-gray-200"
        >
          <Caret open={open} />
          <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">
            {group.name}
          </span>
        </button>
        {open && (
          <div className="grid grid-cols-2 gap-x-6 px-3 py-1.5 bg-white border-b border-gray-200">
            <div className="min-w-0 text-xs font-bold uppercase tracking-wide text-blue-700">
              CM1 · left
            </div>
            <div className="min-w-0 text-xs font-bold uppercase tracking-wide text-violet-700 text-right">
              CM2 · right
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="p-3 pt-2">
          {/* central timeline spine */}
          <div className="relative space-y-1">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -ml-px w-px bg-gray-200" />
            {group.systems.map((system, i) => (
              <SystemBlock
                key={i}
                system={system}
                pfSide={pfSide}
                startIndex={starts[i]}
                lens={lens}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionBlock({
  session,
  pfSide,
  lens,
}: {
  session: MockSession;
  pfSide: 'left' | 'right';
  lens: Lens;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left border-l-4 border-slate-400 bg-gray-50 hover:bg-gray-100 rounded-t-xl"
      >
        <Caret open={open} />
        <h2 className="text-lg font-bold text-gray-900">{session.name}</h2>
        <span className="text-xs font-medium text-gray-400">
          {session.groups.length} panels
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {session.intro && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-slate-400 px-3 py-2">
              <p className="text-xs leading-relaxed text-gray-700">
                {session.intro}
              </p>
            </div>
          )}
          {session.groups.map((group, i) => (
            <GroupBlock key={i} group={group} pfSide={pfSide} lens={lens} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Real data → render shape adapter (read-only). Maps the backend
// ProcedureVersion tree (phases → subPhases → items → events → rules) onto the
// MockSession shape the render tree already understands.
// ---------------------------------------------------------------------------

function prettyPhase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ruleToAcars(rule: ApiValidationRule, sev: string): AcarsRule {
  const graceMs =
    rule.params && typeof rule.params.graceMs === 'number'
      ? (rule.params.graceMs as number)
      : undefined;
  const aliases = Array.isArray(rule.aliases) ? rule.aliases : [];
  return {
    cond: [[rule.expr, '']], // no parser yet — show the raw expr
    type: rule.type,
    phases: rule.phase ? [rule.phase] : [],
    graceMs,
    dref: aliases.join(', '),
    sev,
  };
}

function apiItemToMock(item: ApiChecklistItem): MockItem {
  // Summarize the first rule found across the item's events for the WHEN tag.
  let acars: AcarsRule | undefined;
  for (const ev of item.events ?? []) {
    const rule = ev.validationRules?.[0];
    if (rule) {
      acars = ruleToAcars(rule, ev.severity?.name ?? 'MAJOR');
      break;
    }
  }
  const fctm = (item.notes ?? [])
    .filter((n) => n.kind === 'FCTM')
    .map((n) => n.body);
  return {
    label: item.name,
    action: '',
    crew: item.crewMember as Crew,
    verifiability: item.verifiability,
    acars,
    fctm: fctm.length ? fctm : undefined,
    apiItem: item,
  };
}

function treeToSessions(tree: ProcedureVersionTree): MockSession[] {
  return tree.phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => ({
      name: prettyPhase(phase.name),
      groups: [
        {
          name: prettyPhase(phase.name),
          systems: phase.subPhases
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((sp) => ({
              name: sp.name,
              items: sp.items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map(apiItemToMock),
            })),
        },
      ],
    }))
    .filter((s) => s.groups[0].systems.some((sy) => sy.items.length > 0));
}

function pickDefaultVersionId(
  versions: ProcedureVersionSummary[] | undefined
): number | undefined {
  if (!versions?.length) return undefined;
  const draft = versions.find((v) => v.status === 'DRAFT');
  const published = versions.find((v) => v.status === 'PUBLISHED');
  return (draft ?? published ?? versions[0]).id;
}

// Editor overview: how many items are auto-graded, and how many are gaps.
function CoverageSummary({ items }: { items: MockItem[] }) {
  const counts: Record<VerifState, number> = {
    auto: 0,
    gap: 0,
    manual: 0,
    ns: 0,
  };
  items.forEach((i) => (counts[verifState(i)] += 1));
  const total = items.length || 1;
  const cards: {
    k: VerifState;
    cap: string;
    num: string;
    bar: string;
  }[] = [
    { k: 'auto', cap: 'Auto-graded', num: 'text-cyan-700', bar: 'bg-cyan-500' },
    {
      k: 'gap',
      cap: 'AUTO · no rule',
      num: 'text-orange-600',
      bar: 'bg-orange-500',
    },
    { k: 'manual', cap: 'Manual', num: 'text-amber-700', bar: 'bg-amber-400' },
    { k: 'ns', cap: 'Not simulated', num: 'text-gray-500', bar: 'bg-gray-300' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map((c) => (
        <div
          key={c.k}
          className={`relative overflow-hidden rounded-lg border bg-white px-3 py-2 ${
            c.k === 'gap' && counts.gap > 0 ? 'border-orange-300' : 'border-gray-200'
          }`}
        >
          <div className={`text-xl font-bold tabular-nums ${c.num}`}>
            {counts[c.k]}
            <span className="text-xs font-semibold text-gray-400">/{total}</span>
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {c.cap}
          </div>
          <div
            className={`absolute left-0 bottom-0 h-0.5 ${c.bar}`}
            style={{ width: `${(counts[c.k] / total) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

const LENS_OPTS: [Lens, string][] = [
  ['flow', 'Flow'],
  ['telemetry', 'Telemetry'],
  ['study', 'Study'],
];

function AltitudeControl({
  lens,
  setLens,
}: {
  lens: Lens;
  setLens: (l: Lens) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Altitude
      </span>
      <div className="inline-flex overflow-hidden rounded-md border border-gray-300 text-xs font-bold">
        {LENS_OPTS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => setLens(v)}
            className={`px-2.5 py-1 ${
              lens === v
                ? 'bg-slate-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

const FIELD_INPUT =
  'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-cyan-500 focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </div>
      {children}
    </div>
  );
}

// V2-native rule authoring modal — same design language + WHEN sentence as the
// viewer, wired to the real create/update/test endpoints.
function RuleDialog({
  editing,
  phaseNames,
  datarefs,
  focusTest,
  onClose,
}: {
  editing: {
    item: ApiChecklistItem;
    event: ApiProcedureEvent;
    phaseName: string;
    subPhaseName: string;
  };
  phaseNames: string[];
  datarefs: ApiDataref[];
  focusTest?: boolean;
  onClose: () => void;
}) {
  const { item, event, phaseName, subPhaseName } = editing;
  const existing = event.validationRules[0];
  const parsed = existing ? parseSimpleExpr(existing.expr) : null;

  const [type, setType] = useState<TriggerType>(existing?.type ?? 'PRECONDITION');
  const [phase, setPhase] = useState(
    existing?.phase ?? phaseNames[0] ?? phaseName
  );
  const [alias, setAlias] = useState(parsed?.alias ?? datarefs[0]?.alias ?? '');
  const [op, setOp] = useState<string>(parsed?.operator ?? '==');
  const [value, setValue] = useState(parsed?.value ?? '0');
  const [grace, setGrace] = useState(
    existing?.params && typeof existing.params.graceMs === 'number'
      ? String(existing.params.graceMs)
      : '0'
  );
  const [severityId, setSeverityId] = useState(event.severityId);
  const [advanced, setAdvanced] = useState(!!existing && !parsed);
  const [advancedExpr, setAdvancedExpr] = useState(existing?.expr ?? '');
  const [frame, setFrame] = useState(
    '{\n  "' + (alias || 'value') + '": 0\n}'
  );

  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const updateEvent = useUpdateEvent();
  const testRule = useTestRule();

  const expr = advanced ? advancedExpr : `${alias} ${op} ${value}`;
  const preview: AcarsRule = {
    cond: [],
    type,
    phases: phase ? [phase] : [],
    graceMs: Number(grace) || undefined,
    dref: '',
    sev: '',
  };
  const saving = createRule.isPending || updateRule.isPending;
  const selDataref = datarefs.find((d) => d.alias === alias);
  const result = testRule.data;

  // "Test against replay" opens the editor scrolled to the test section
  const testRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusTest) {
      testRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [focusTest]);

  const handleTest = () => {
    let f: Record<string, number>;
    try {
      f = JSON.parse(frame);
    } catch {
      toast.error('Invalid JSON frame');
      return;
    }
    testRule.mutate({ expr, frame: f });
  };

  const handleSave = () => {
    if (severityId !== event.severityId) {
      updateEvent.mutate({ id: event.id, data: { severityId } });
    }
    const payload = {
      type,
      phase,
      aliases: advanced ? [] : [alias].filter(Boolean),
      expr,
      params: { graceMs: Number(grace) || 0 },
      details: [] as string[],
    };
    const done = () => {
      toast.success('Rule saved');
      onClose();
    };
    if (existing) {
      updateRule.mutate({ id: existing.id, data: payload }, { onSuccess: done });
    } else {
      createRule.mutate({ eventId: event.id, ...payload }, { onSuccess: done });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // Tailwind is scoped to #root (important: '#root'); portal the dialog
      // INTO #root so its utility classes actually apply.
      container={() => document.getElementById('root')}
      PaperProps={{
        sx: {
          backgroundColor: '#fff',
          color: '#0f172a',
          borderRadius: 3,
          maxHeight: '92vh',
        },
      }}
    >
      <div
        className="flex max-h-[92vh] flex-col"
        style={{ colorScheme: 'light' }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] text-gray-400">
              {phaseName} › {subPhaseName} › {item.name}
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {existing ? 'Edit validation rule' : 'Add validation rule'}
            </h2>
            <div className="text-xs text-gray-500">
              on event <b className="text-gray-700">{event.name}</b>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Close fontSize="small" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <Field label="Trigger — when it's graded">
            <div className="grid grid-cols-2 gap-2">
              {(
                ['PRECONDITION', 'SNAPSHOT', 'CONTINUOUS', 'SEQUENCE'] as const
              ).map((t) => {
                const on = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-lg border p-2.5 text-left transition ${
                      on
                        ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-400'
                        : 'border-gray-200 bg-white hover:border-cyan-300'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold ${
                        on ? 'text-cyan-700' : 'text-gray-800'
                      }`}
                    >
                      <TriggerGlyph type={t} /> {TRIGGER_META[t].label}
                    </div>
                    <div className="mt-1 text-[10.5px] leading-snug text-gray-500">
                      {TRIGGER_META[t].when}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Phase — armed in">
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className={`${FIELD_INPUT} w-full`}
            >
              {(phaseNames.length ? phaseNames : [phase]).map((p) => (
                <option key={p} value={p}>
                  {phaseMeta(p).label} ({p})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Condition">
            {advanced ? (
              <textarea
                value={advancedExpr}
                onChange={(e) => setAdvancedExpr(e.target.value)}
                rows={2}
                className={`${FIELD_INPUT} w-full font-mono`}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={datarefs.some((d) => d.alias === alias) ? alias : ''}
                  onChange={(e) => setAlias(e.target.value)}
                  className={`${FIELD_INPUT} min-w-[150px] flex-1`}
                >
                  {datarefs.length === 0 && <option value="">no datarefs</option>}
                  {datarefs.map((d) => (
                    <option key={d.id} value={d.alias}>
                      {d.alias}
                      {d.unit ? ` (${d.unit})` : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={op}
                  onChange={(e) => setOp(e.target.value)}
                  className={`${FIELD_INPUT} w-16`}
                >
                  {OPERATORS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`${FIELD_INPUT} w-24`}
                />
                {selDataref?.unit && (
                  <span className="text-xs text-gray-400">
                    {selDataref.unit}
                  </span>
                )}
              </div>
            )}
            <label className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={advanced}
                onChange={(e) => {
                  const on = e.target.checked;
                  setAdvanced(on);
                  if (on && !advancedExpr) setAdvancedExpr(expr);
                }}
              />
              Advanced expression (raw mini-DSL)
            </label>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="On violation">
              <select
                value={severityId}
                onChange={(e) => setSeverityId(Number(e.target.value))}
                className={`${FIELD_INPUT} w-full`}
              >
                {[1, 2, 3, 4].map((id) => (
                  <option key={id} value={id}>
                    {SEVERITY_META[id].label}
                  </option>
                ))}
              </select>
            </Field>
            {type === 'CONTINUOUS' && (
              <Field label="Grace (ms)">
                <input
                  value={grace}
                  onChange={(e) => setGrace(e.target.value)}
                  className={`${FIELD_INPUT} w-full`}
                />
              </Field>
            )}
          </div>

          {/* live preview — same WHEN language as the viewer */}
          <div className="space-y-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5">
            <WhenLine acars={preview} />
            <div className="rounded bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-cyan-300 break-all">
              {expr}
            </div>
          </div>

          <div ref={testRef}>
            <Field label="Test — does it fire?">
              <textarea
                value={frame}
                onChange={(e) => setFrame(e.target.value)}
                rows={3}
                className={`${FIELD_INPUT} w-full font-mono text-[11px]`}
              />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={testRule.isPending}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Run test
              </button>
              {result && (
                <span
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    result.result
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {result.result ? '⚑ FIRES' : 'OK — does not fire'}
                </span>
              )}
              {result?.error && (
                <span className="text-xs text-red-500">{result.error}</span>
              )}
            </div>
            </Field>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create rule'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function ProceduresV2Page() {
  const [pfSide, setPfSide] = useState<'left' | 'right'>('left');
  const [lens, setLens] = useState<Lens>('flow');
  const [source, setSource] = useState<'real' | 'demo'>('real');
  const [versionId, setVersionId] = useState<number | undefined>(undefined);

  const { data: versions, isLoading: versionsLoading } =
    useProcedureVersions('A320');
  const activeVersionId = versionId ?? pickDefaultVersionId(versions);
  const {
    data: tree,
    isLoading: treeLoading,
    isError,
  } = useProcedureVersion(source === 'real' ? activeVersionId : undefined);

  const realSessions = useMemo(
    () => (tree ? treeToSessions(tree) : []),
    [tree]
  );
  const sessions = source === 'demo' ? SESSIONS : realSessions;
  const allItems = useMemo(() => flattenItems(sessions), [sessions]);

  const loading =
    source === 'real' &&
    (versionsLoading || (!!activeVersionId && treeLoading));

  // ---- rule authoring (Add / Edit rule — draft only) ----
  const canAuthor = source === 'real' && tree?.status === 'DRAFT';
  const { data: packages } = useProcedurePackages();
  const createEvent = useCreateEvent();
  const updateItem = useUpdateItem();
  const [editing, setEditing] = useState<{
    item: ApiChecklistItem;
    event: ApiProcedureEvent;
    phaseName: string;
    subPhaseName: string;
    focusTest?: boolean;
  } | null>(null);

  const datarefs = useMemo(() => {
    if (!packages) return [];
    const model = tree?.aircraftModelCode;
    const matched = packages.filter((p) => !model || p.model === model);
    return (matched.length ? matched : packages).flatMap(
      (p) => p.datarefs ?? []
    );
  }, [packages, tree?.aircraftModelCode]);

  const phaseNames = useMemo(
    () =>
      tree
        ? tree.phases
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((p) => p.name)
        : [],
    [tree]
  );

  const openEditor = (apiItem: ApiChecklistItem, focusTest: boolean) => {
    // find the item's phase / sub-phase names for the editor breadcrumb
    let phaseName = '';
    let subPhaseName = '';
    if (tree) {
      for (const ph of tree.phases) {
        for (const sp of ph.subPhases) {
          if (sp.items.some((it) => it.id === apiItem.id)) {
            phaseName = ph.name;
            subPhaseName = sp.name;
          }
        }
      }
    }
    // a rule needs an owning event — reuse the item's first event, or create one
    const existing = apiItem.events?.[0];
    if (existing) {
      setEditing({
        item: apiItem,
        event: existing,
        phaseName,
        subPhaseName,
        focusTest,
      });
      return;
    }
    createEvent.mutate(
      { checklistItemId: apiItem.id, name: apiItem.name, severityId: 1 },
      {
        onSuccess: (event) =>
          setEditing({ item: apiItem, event, phaseName, subPhaseName, focusTest }),
        onError: () => toast.error('Could not create the event for this item'),
      }
    );
  };

  const onAuthorRule = (apiItem: ApiChecklistItem) => openEditor(apiItem, false);
  const onTestRule = (apiItem: ApiChecklistItem) => openEditor(apiItem, true);
  const onDowngrade = (apiItem: ApiChecklistItem) =>
    updateItem.mutate(
      { id: apiItem.id, data: { verifiability: 'MANUAL' } },
      {
        onSuccess: () => toast.success(`${apiItem.name} → MANUAL`),
        onError: () => toast.error('Could not update the item'),
      }
    );

  const segBtn = (on: boolean) =>
    `px-2.5 py-1 ${
      on ? 'bg-slate-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div
      className="h-full box-border overflow-y-auto overflow-x-hidden bg-gray-100 p-6 rounded-lg"
      style={{ colorScheme: 'light' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-800">Procedures V2</h1>
          <span className="text-xs font-bold uppercase tracking-wide bg-slate-200 text-slate-600 rounded px-2 py-0.5">
            {source === 'real' ? 'live data' : 'mock-up'}
          </span>
          <div className="ml-auto inline-flex items-center gap-2">
            {/* data source: real backend tree vs the design mock */}
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setSource('real')}
                className={segBtn(source === 'real')}
              >
                Real
              </button>
              <button
                type="button"
                onClick={() => setSource('demo')}
                className={segBtn(source === 'demo')}
              >
                Demo
              </button>
            </div>
            {source === 'real' && !!versions?.length && (
              <select
                value={activeVersionId ?? ''}
                onChange={(e) => setVersionId(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version} · {v.status}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {source === 'real' ? (
            <>
              Live procedure tree from the backend — phases, items,{' '}
              <span className="font-semibold text-cyan-700">verifiability</span>{' '}
              and ACARS <span className="font-semibold">validation rules</span>.
              FCOM/FCTM prose appears here once authored as item notes.
            </>
          ) : (
            <>
              Design reference (hard-coded mock): full{' '}
              <b>FCOM PRO-NOR-SOP-04</b> and <b>FCTM NO-020</b> verbatim, tasks
              aligned by seat.
            </>
          )}
        </p>

        {/* editor overview: monitoring coverage + gaps */}
        <div className="mb-3">
          <CoverageSummary items={allItems} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex-1 min-w-[260px]">
            <CrewLegend />
          </div>
          <AltitudeControl lens={lens} setLens={setLens} />
          {/* PF toggle */}
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              PF sits on
            </span>
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setPfSide('left')}
                className={segBtn(pfSide === 'left')}
              >
                CM1
              </button>
              <button
                type="button"
                onClick={() => setPfSide('right')}
                className={segBtn(pfSide === 'right')}
              >
                CM2
              </button>
            </div>
          </div>
        </div>

        {/* body */}
        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">
            Loading procedure…
          </div>
        )}
        {source === 'real' && isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load the procedure version. Check that the backend is
            running and that you have MANAGE_PROCEDURES.
          </div>
        )}
        {!loading && !isError && sessions.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {source === 'real'
              ? 'This version has no checklist items yet.'
              : 'No content.'}
          </div>
        )}
        {!loading && !isError && sessions.length > 0 && (
          <AuthoringContext.Provider
            value={{
              onAuthorRule: canAuthor ? onAuthorRule : undefined,
              onTestRule: canAuthor ? onTestRule : undefined,
              onDowngrade: canAuthor ? onDowngrade : undefined,
            }}
          >
            <div className="space-y-4">
              {sessions.map((session, i) => (
                <SessionBlock
                  key={i}
                  session={session}
                  pfSide={pfSide}
                  lens={lens}
                />
              ))}
            </div>
          </AuthoringContext.Provider>
        )}

        {/* rule authoring dialog — V2-native, wired to the real endpoints */}
        {editing && (
          <RuleDialog
            editing={editing}
            phaseNames={phaseNames}
            datarefs={datarefs}
            focusTest={!!editing.focusTest}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  );
}
