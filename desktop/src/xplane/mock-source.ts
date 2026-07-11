import type { FrameMeta, RawFrame, TelemetrySource, Unsubscribe } from '../core/ports';

/**
 * A synthetic telemetry source that plays a scripted full flight (cockpit prep
 * -> pushback -> taxi -> takeoff -> climb -> cruise -> descent -> approach ->
 * landing -> taxi-in -> parking) at ~10 Hz, emitting the same Airbus datarefs
 * the real FSM reads. Lets the whole pipeline (FSM, OOOI, rules) run and be
 * verified WITHOUT X-Plane.
 */
export class MockSource implements TelemetrySource {
  readonly name = 'mock';
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(raw: RawFrame, meta?: FrameMeta) => void>();
  private tick = 0;

  async connect(): Promise<void> {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick++;
      const raw = scriptedFrame(this.tick / 10);
      // Deterministic flight-time clock: 100 ms per tick (10 Hz).
      const meta: FrameMeta = { t: this.tick * 100 };
      this.listeners.forEach((cb) => cb(raw, meta));
    }, 100);
  }

  onFrame(cb: (raw: RawFrame, meta?: FrameMeta) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async disconnect(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.listeners.clear();
    this.tick = 0;
  }
}

interface Seg {
  until: number; // seconds
  q: number; // QPACFlightPhase
  ap: number; // APPhase
  m1: number;
  m2: number;
  mode: number; // ENGModeSwitch
  gs: number; // groundspeed kt
  agl: number; // ft AGL
  onground: number;
}

// A scripted ~55s flight that walks the FSM through every phase.
const TIMELINE: Seg[] = [
  { until: 5, q: 1, ap: 0, m1: 0, m2: 0, mode: 1, gs: 0, agl: 0, onground: 1 }, // cockpit prep
  { until: 8, q: 1, ap: 0, m1: 1, m2: 1, mode: 2, gs: 0, agl: 0, onground: 1 }, // pushback/start
  { until: 10, q: 2, ap: 0, m1: 1, m2: 1, mode: 1, gs: 0, agl: 0, onground: 1 }, // after-start
  { until: 18, q: 3, ap: 0, m1: 1, m2: 1, mode: 1, gs: 34, agl: 0, onground: 1 }, // taxi (>30kt)
  { until: 20, q: 4, ap: 0, m1: 1, m2: 1, mode: 1, gs: 60, agl: 0, onground: 1 }, // takeoff start
  { until: 22, q: 5, ap: 0, m1: 1, m2: 1, mode: 1, gs: 95, agl: 0, onground: 1 }, // >80kt
  { until: 24, q: 6, ap: 1, m1: 1, m2: 1, mode: 1, gs: 140, agl: 50, onground: 0 }, // lift-off
  { until: 26, q: 7, ap: 2, m1: 1, m2: 1, mode: 1, gs: 160, agl: 800, onground: 0 }, // thrust red
  { until: 30, q: 8, ap: 2, m1: 1, m2: 1, mode: 1, gs: 180, agl: 4000, onground: 0 }, // climb
  { until: 34, q: 8, ap: 3, m1: 1, m2: 1, mode: 1, gs: 260, agl: 35000, onground: 0 }, // cruise
  { until: 38, q: 8, ap: 4, m1: 1, m2: 1, mode: 1, gs: 240, agl: 15000, onground: 0 }, // descent
  { until: 40, q: 8, ap: 5, m1: 1, m2: 1, mode: 1, gs: 180, agl: 3000, onground: 0 }, // approach
  { until: 42, q: 9, ap: 5, m1: 1, m2: 1, mode: 1, gs: 150, agl: 1950, onground: 0 }, // ~2000ft
  { until: 44, q: 10, ap: 5, m1: 1, m2: 1, mode: 1, gs: 140, agl: 800, onground: 0 }, // ~1000ft
  { until: 46, q: 11, ap: 5, m1: 1, m2: 1, mode: 1, gs: 130, agl: 0, onground: 1 }, // touchdown
  { until: 50, q: 13, ap: 7, m1: 1, m2: 1, mode: 1, gs: 25, agl: 0, onground: 1 }, // taxi-in
  { until: Infinity, q: 13, ap: 7, m1: 0, m2: 0, mode: 1, gs: 0, agl: 0, onground: 1 }, // parking
];

function scriptedFrame(tSec: number): RawFrame {
  const s = TIMELINE.find((seg) => tSec < seg.until) ?? TIMELINE[TIMELINE.length - 1];
  return {
    'AirbusFBW/QPACFlightPhase': s.q,
    'AirbusFBW/APPhase': s.ap,
    'AirbusFBW/ENG1MasterSwitch': s.m1,
    'AirbusFBW/ENG2MasterSwitch': s.m2,
    'AirbusFBW/ENGModeSwitch': s.mode,
    'sim/flightmodel2/position/groundspeed': s.gs / 1.94384, // m/s
    'sim/flightmodel/position/y_agl': s.agl * 0.3048, // m
    'sim/flightmodel/failures/onground_any': s.onground,
  };
}
