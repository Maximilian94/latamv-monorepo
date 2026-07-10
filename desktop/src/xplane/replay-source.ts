import type { FrameMeta, RawFrame, TelemetrySource, Unsubscribe } from '../core/ports';

/** One recorded frame: a millisecond offset from the start of the recording
 *  plus the raw dataref values captured at that moment. */
export interface RecordedFrame {
  t: number;
  values: RawFrame;
}

export interface Recording {
  /** free-text label, e.g. "GRU->EZE 2026-07-10" */
  name?: string;
  frames: RecordedFrame[];
}

/**
 * Replays a recorded flight through the exact same pipeline as live X-Plane —
 * FSM, rule engine, sink — so a procedure can be verified WITHOUT a simulator.
 * Frames are emitted preserving their recorded relative timing, divided by
 * `speed` (2 = twice as fast). Grace timers still resolve correctly because the
 * engine keys off each frame's own timestamp, not wall-clock.
 */
export class ReplaySource implements TelemetrySource {
  readonly name = 'replay';
  private listeners = new Set<(raw: RawFrame, meta?: FrameMeta) => void>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private frames: RecordedFrame[];
  private speed: number;

  constructor(recording: Recording, speed = 1) {
    this.frames = recording.frames;
    this.speed = speed > 0 ? speed : 1;
  }

  async connect(): Promise<void> {
    if (this.frames.length === 0) return;
    const t0 = this.frames[0].t;
    for (const frame of this.frames) {
      const delayMs = Math.max(0, (frame.t - t0) / this.speed);
      const timer = setTimeout(() => {
        // Emit the recorded flight-time offset as `t` so grace timers resolve
        // in flight time — identical detections regardless of playback speed.
        this.listeners.forEach((cb) => cb(frame.values, { t: frame.t }));
      }, delayMs);
      this.timers.push(timer);
    }
  }

  onFrame(cb: (raw: RawFrame, meta?: FrameMeta) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async disconnect(): Promise<void> {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.listeners.clear();
  }
}

/**
 * Captures raw frames off any live source into a Recording, so a mock or real
 * X-Plane flight can be saved and replayed later. Timestamps are stored as
 * offsets from the first captured frame.
 */
export class FrameRecorder {
  private frames: RecordedFrame[] = [];
  private startMs: number | null = null;

  /** Record one frame, stamping it with an offset (ms) from the first frame. */
  capture(raw: RawFrame, nowMs: number): void {
    if (this.startMs === null) this.startMs = nowMs;
    this.frames.push({ t: nowMs - this.startMs, values: { ...raw } });
  }

  get count(): number {
    return this.frames.length;
  }

  toRecording(name?: string): Recording {
    return { name, frames: this.frames.slice() };
  }

  reset(): void {
    this.frames = [];
    this.startMs = null;
  }
}
