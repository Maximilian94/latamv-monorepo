import { useEffect, useRef, useState } from 'react';
import { useFlightStore } from './store';
import { RuleEngine } from '../rules/rule-engine';
import { buildScope } from '../rules/normalize';
import { BackendEventSink } from '../sync/backend-sink';
import { FrameRecorder, type Recording } from '../xplane/replay-source';
import { XPlaneSource } from '../xplane/xplane-source';
import type { PublishedBundle, TelemetrySource, Unsubscribe } from './ports';

interface SinkTarget {
  baseUrl: string;
  token: string | null;
  flightId: number | null;
}

/**
 * The live ACARS pipeline: wires a telemetry source to the rule engine, the
 * phase FSM (via the store) and the backend event sink. Extracted from the
 * screen so login/duty/pre-flight/live can share one implementation.
 */
export function useAcarsPipeline(bundle: PublishedBundle, sink: SinkTarget) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(0);

  const sourceRef = useRef<TelemetrySource | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const engineRef = useRef<RuleEngine>(new RuleEngine(bundle));
  const sinkRef = useRef<BackendEventSink | null>(null);
  const recorderRef = useRef<FrameRecorder>(new FrameRecorder());

  const { setFrame, setPhaseDefs, pushEvents, reset } = useFlightStore();

  // Keep the engine rules and the FSM's phase conditions in sync with the
  // loaded bundle (phases with entryExpr drive the data-driven FSM).
  useEffect(() => {
    engineRef.current.load(bundle);
    setPhaseDefs(bundle.phases, bundle.datarefs);
  }, [bundle, setPhaseDefs]);

  const start = async (
    source: TelemetrySource,
    opts: { record?: boolean } = {},
  ) => {
    reset();
    engineRef.current.reset();
    setPending(0);

    const capturing = !!opts.record;
    if (capturing) recorderRef.current.reset();

    sinkRef.current =
      sink.token && sink.flightId != null
        ? new BackendEventSink({
            base: sink.baseUrl,
            token: sink.token,
            flightId: sink.flightId,
          })
        : null;

    if (source instanceof XPlaneSource) {
      source.onStatus((s) => setStatus(s.message));
    }
    sourceRef.current = source;

    unsubRef.current = source.onFrame((raw, meta) => {
      const nowIso = new Date().toISOString();
      const t = meta?.t ?? Date.parse(nowIso);
      if (capturing) recorderRef.current.capture(raw, t);
      setFrame(raw, nowIso);
      const st = useFlightStore.getState();
      const scope = buildScope(st.values, bundle.datarefs);
      const detected = engineRef.current.onFrame({
        t,
        nowIso,
        phase: st.phase,
        scope,
      });
      if (detected.length) {
        pushEvents(detected);
        if (sinkRef.current) {
          void sinkRef.current.emit(detected);
          setPending(sinkRef.current.pending);
        }
      }
    });
    await source.connect();
    setConnected(true);
  };

  const stop = async (): Promise<Recording | null> => {
    await sourceRef.current?.disconnect();
    unsubRef.current?.();
    sourceRef.current = null;
    unsubRef.current = null;
    setConnected(false);
    setStatus('');
    const rec =
      recorderRef.current.count > 0
        ? recorderRef.current.toRecording('flight')
        : null;
    reset();
    return rec;
  };

  const flushNow = async () => {
    await sinkRef.current?.flush();
    setPending(sinkRef.current?.pending ?? 0);
  };

  return {
    connected,
    status,
    pending,
    hasSink: !!sinkRef.current,
    ruleCount: engineRef.current.ruleCount,
    start,
    stop,
    flushNow,
    setStatus,
  };
}
