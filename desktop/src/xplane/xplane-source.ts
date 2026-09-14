import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { FrameMeta, RawFrame, TelemetrySource, Unsubscribe } from '../core/ports';

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

/** Extra telemetry datarefs the live/demo source subscribes to, on top of the
 *  ones the published rules reference (groundspeed / AGL / onground). The phase
 *  datarefs live in the published catalog now, so they come in via that. */
export const DEMO_DATAREFS = [
  'sim/flightmodel2/position/groundspeed',
  'sim/flightmodel/position/y_agl',
  'sim/flightmodel/failures/onground_any',
];

/** Position datarefs the pre-flight gate reads to verify the pilot is parked at
 *  the flight's departure airport (degrees). */
export const POSITION_DATAREFS = [
  'sim/flightmodel/position/latitude',
  'sim/flightmodel/position/longitude',
];

/** One-shot read of a string/byte-array dataref (e.g. aircraft ICAO type / tail
 *  number). Goes through the Rust bridge which decodes base64/char arrays. */
export async function readXPlaneString(
  dataref: string,
  base?: string,
): Promise<string> {
  return invoke<string>('xplane_read_string', { dataref, base: base ?? null });
}
