import type { DetectedEvent, EventSink } from '../core/ports';
import { postFlightEvents } from './backend-client';

export interface BackendSinkConfig {
  base: string;
  token: string;
  flightId: number;
}

/**
 * EventSink that buffers detected events and ships them to the backend in
 * batches. `emit` never blocks the telemetry loop: events are queued and a
 * flush is triggered, but failures leave the batch in the buffer to retry on
 * the next flush (at-least-once delivery; the backend dedupes on close).
 */
export class BackendEventSink implements EventSink {
  readonly name = 'backend';
  private buffer: DetectedEvent[] = [];
  private inFlight = false;
  private cfg: BackendSinkConfig;

  constructor(cfg: BackendSinkConfig) {
    this.cfg = cfg;
  }

  /** Number of events waiting to be sent. */
  get pending(): number {
    return this.buffer.length;
  }

  async emit(events: DetectedEvent[]): Promise<void> {
    if (!events.length) return;
    this.buffer.push(...events);
    // Fire and forget; errors keep the buffer intact for the next flush.
    void this.flush();
  }

  /** Send everything currently buffered. Safe to call repeatedly. */
  async flush(): Promise<void> {
    if (this.inFlight || this.buffer.length === 0) return;
    const batch = this.buffer.slice();
    this.inFlight = true;
    try {
      await postFlightEvents(
        this.cfg.base,
        this.cfg.token,
        this.cfg.flightId,
        batch,
      );
      // Drop exactly what we sent (new events may have arrived meanwhile).
      this.buffer.splice(0, batch.length);
    } finally {
      this.inFlight = false;
    }
  }
}
