/* Domain contracts (ports) for the ACARS pipeline.
 *
 *   [source] -> RawFrame -> normalize -> Phase FSM -> Rule engine -> [sink]
 *
 * The core (FSM + rules) never talks to X-Plane or the backend directly; it
 * depends only on these ports, so we can swap XPlane <-> Mock <-> Replay and
 * BackendSink <-> ConsoleSink without touching the engine.
 */

export type Scalar = number | boolean;

/** Raw dataref values keyed by the real X-Plane dataref name (or alias).
 *  Array datarefs (e.g. per-engine N1) arrive as number[]; the normalizer
 *  indexes them into scalars before rule evaluation. */
export type RawFrame = Record<string, Scalar | number[]>;

/** Flight phases — ported 1:1 from the proven acars-v5 phase manager. */
export type FlightPhase =
  | 'not-started'
  | 'cockpit_preparation'
  | 'push-back_engine-start'
  | 'after-start'
  | 'taxing'
  | 'taking-off-starting'
  | 'taking-off-after-80kt'
  | 'taking-off-lift-off'
  | 'taking-off-thrust-reduction'
  | 'climb'
  | 'cruise'
  | 'descent'
  | 'approach'
  | 'landing-about-2000ft'
  | 'landing-about-1000ft'
  | 'touch-down'
  | 'go-around'
  | 'taxi-out'
  | 'parking'
  | 'securing-aircraft';

/** OOOI markers (Off-blocks / Off-ground / On-ground / In-blocks). */
export type OOOI = 'OUT' | 'OFF' | 'ON' | 'IN';

/** A normalized frame: alias -> value (unit-converted) plus the current phase. */
export interface Frame {
  /** monotonic timestamp in ms (passed in, never Date.now in pure code) */
  t: number;
  values: Record<string, Scalar>;
  phase: FlightPhase;
}

/** An event detected by a rule, ready to be sent to the backend. */
export interface DetectedEvent {
  eventId: string;
  /** ISO timestamp */
  timestamp: string;
  details?: Record<string, Scalar>;
}

export type Unsubscribe = () => void;

/** Per-frame metadata a source may attach. `t` is a monotonic millisecond
 *  timestamp from the source's own clock (X-Plane frame time, recording offset,
 *  or mock tick) — the rule engine uses it for grace timers so CONTINUOUS rules
 *  measure FLIGHT time, staying deterministic under replay at any speed. */
export interface FrameMeta {
  t?: number;
}

/** Input port: something that produces raw telemetry frames. */
export interface TelemetrySource {
  readonly name: string;
  connect(config?: unknown): Promise<void>;
  /** Register a callback for each incoming raw frame. Returns an unsubscribe. */
  onFrame(cb: (raw: RawFrame, meta?: FrameMeta) => void): Unsubscribe;
  disconnect(): Promise<void>;
}

/** Output port: something that consumes detected events. */
export interface EventSink {
  readonly name: string;
  emit(events: DetectedEvent[]): Promise<void>;
}

// ---- Published-procedure bundle (shape served by GET /procedures/published) ----

export type ValidationRuleType =
  | 'SNAPSHOT'
  | 'CONTINUOUS'
  | 'PRECONDITION'
  | 'SEQUENCE';

export interface RuleDef {
  id: number;
  eventId: string;
  type: ValidationRuleType;
  phase: string;
  aliases: string[];
  expr: string;
  params?: { graceMs?: number } | null;
  details?: string[] | null;
}

export interface EventDef {
  id: string;
  name: string;
  severityId: number;
  validationRules: RuleDef[];
}

export interface ItemDef {
  id: number;
  name: string;
  verifiability: 'AUTO' | 'MANUAL' | 'NOT_SIMULATED';
  events: EventDef[];
}

export interface SubPhaseDef {
  id: number;
  name: string;
  items: ItemDef[];
}

export interface PhaseDef {
  id: number;
  name: string;
  order: number;
  subPhases: SubPhaseDef[];
}

export interface DatarefDef {
  alias: string;
  datarefName: string;
  unit?: string | null;
  valueType?: string;
  arrayIndex?: number | null;
}

/** Matches the shape served by GET /procedures/published: `phases` and
 *  `datarefs` are top-level siblings of `version` (not nested inside it). */
export interface PublishedBundle {
  version: {
    id: number;
    aircraftModelCode: string;
    version: number;
    baseScore: number;
    passingScore: number;
    weightStd: number;
    weightExc: number;
    weightDev: number;
    weightCmp: number;
  };
  phases: PhaseDef[];
  datarefs: DatarefDef[];
}
