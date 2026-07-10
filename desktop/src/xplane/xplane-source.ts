import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { FrameMeta, RawFrame, TelemetrySource, Unsubscribe } from '../core/ports';
import { PHASE_DATAREF_NAMES } from '../phase/phase-fsm';

interface FrameEvent {
  t: number;
  values: Record<string, number | number[]>;
}
export interface XPlaneStatus {
  connected: boolean;
  message: string;
}

/**
 * Real telemetry source: drives the Rust connection manager over Tauri IPC and
 * turns the `xplane://frame` events it emits into RawFrames. The Rust side owns
 * the WebSocket + reconnection; this adapter is a thin bridge.
 */
export class XPlaneSource implements TelemetrySource {
  readonly name = 'x-plane';
  private listeners = new Set<(raw: RawFrame, meta?: FrameMeta) => void>();
  private unlistenFrame?: UnlistenFn;
  private unlistenStatus?: UnlistenFn;
  private statusCb?: (s: XPlaneStatus) => void;

  constructor(
    private datarefs: string[],
    private base?: string
  ) {}

  onStatus(cb: (s: XPlaneStatus) => void) {
    this.statusCb = cb;
  }

  async connect(): Promise<void> {
    this.unlistenFrame = await listen<FrameEvent>('xplane://frame', (e) => {
      const raw: RawFrame = {};
      for (const [k, v] of Object.entries(e.payload.values)) raw[k] = v;
      this.listeners.forEach((cb) => cb(raw, { t: e.payload.t }));
    });
    this.unlistenStatus = await listen<XPlaneStatus>('xplane://status', (e) =>
      this.statusCb?.(e.payload)
    );
    await invoke('xplane_connect', {
      datarefs: this.datarefs,
      base: this.base ?? null,
    });
  }

  onFrame(cb: (raw: RawFrame, meta?: FrameMeta) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async disconnect(): Promise<void> {
    try {
      await invoke('xplane_disconnect');
    } catch {
      /* ignore */
    }
    this.unlistenFrame?.();
    this.unlistenStatus?.();
    this.unlistenFrame = undefined;
    this.unlistenStatus = undefined;
    this.listeners.clear();
  }
}

/** Datarefs the demo subscribes to: telemetry + the 5 the phase FSM needs. */
export const DEMO_DATAREFS = Array.from(
  new Set([
    'sim/flightmodel2/position/groundspeed',
    'sim/flightmodel/position/y_agl',
    'sim/flightmodel/failures/onground_any',
    ...PHASE_DATAREF_NAMES,
  ])
);
