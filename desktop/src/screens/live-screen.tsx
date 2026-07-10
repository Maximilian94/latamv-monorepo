import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../core/session';
import { useFlightStore } from '../core/store';
import { useAcarsPipeline } from '../core/acars-pipeline';
import { buildScope } from '../rules/normalize';
import { evaluateExpr } from '../lib/expr/expr-eval';
import { MockSource } from '../xplane/mock-source';
import { XPlaneSource, DEMO_DATAREFS } from '../xplane/xplane-source';
import { ReplaySource, type Recording } from '../xplane/replay-source';
import type { FlightLeg } from '../sync/backend-client';
import type { PublishedBundle, TelemetrySource } from '../core/ports';

type SourceKind = 'x-plane' | 'mock' | 'replay';
const OOOI: Array<'OUT' | 'OFF' | 'ON' | 'IN'> = ['OUT', 'OFF', 'ON', 'IN'];
const SEV: Record<number, { label: string; cls: string }> = {
  1: { label: 'Standard', cls: 'std' },
  2: { label: 'Excellence', cls: 'exc' },
  3: { label: 'Deviation', cls: 'dev' },
  4: { label: 'Compromise', cls: 'cmp' },
};

function severityIndex(bundle: PublishedBundle): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const p of bundle.phases)
    for (const s of p.subPhases)
      for (const it of s.items)
        for (const e of it.events) idx[e.id] = e.severityId;
  return idx;
}

/** All datarefs the live source must subscribe to: everything the bundle
 *  references, plus the basic telemetry the phase FSM needs. */
function liveDatarefs(bundle: PublishedBundle): string[] {
  return Array.from(
    new Set([...bundle.datarefs.map((d) => d.datarefName), ...DEMO_DATAREFS]),
  );
}

export function LiveScreen({
  leg,
  bundle,
  onEnd,
}: {
  leg: FlightLeg;
  bundle: PublishedBundle;
  onEnd: () => void;
}) {
  const session = useSession();
  const pipeline = useAcarsPipeline(bundle, {
    baseUrl: session.baseUrl,
    token: session.token,
    flightId: leg.id,
  });

  const { values, phase, ooi, frames, events } = useFlightStore();
  const sevIdx = useMemo(() => severityIndex(bundle), [bundle]);
  const scope = useMemo(
    () => (frames > 0 ? buildScope(values, bundle.datarefs) : null),
    [values, frames, bundle],
  );

  const [kind, setKind] = useState<SourceKind>('x-plane');
  const [dev, setDev] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [recording, setRecording] = useState<Recording | null>(null);
  const startedRef = useRef(false);

  const startSource = async (k: SourceKind) => {
    let source: TelemetrySource;
    if (k === 'mock') source = new MockSource();
    else if (k === 'replay') {
      if (!recording) {
        pipeline.setStatus('No recording loaded.');
        return;
      }
      source = new ReplaySource(recording, speed);
    } else source = new XPlaneSource(liveDatarefs(bundle));
    await pipeline.start(source, { record: false });
  };

  // Auto-start X-Plane when the live screen opens (pre-flight already verified).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startSource('x-plane');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    if (pipeline.connected) await pipeline.stop();
    else await startSource(kind);
  };

  const loadRecording = (file: File) => {
    const rdr = new FileReader();
    rdr.onload = () => {
      try {
        const parsed = JSON.parse(String(rdr.result)) as Recording;
        if (!Array.isArray(parsed.frames)) throw new Error('missing frames[]');
        setRecording(parsed);
        setKind('replay');
      } catch (e) {
        pipeline.setStatus(`bad recording file: ${String(e)}`);
      }
    };
    rdr.readAsText(file);
  };

  return (
    <div className="screen live">
      <div className="screen-head">
        <div>
          <h2>
            {leg.flightNumber} · {leg.departureIcao} → {leg.arrivalIcao}
          </h2>
          <p className="muted small">
            {pipeline.connected ? `${frames} frames` : 'idle'} ·{' '}
            {pipeline.ruleCount} rules
            {pipeline.hasSink && ` · flight #${leg.id}`}
          </p>
        </div>
        <div className="row">
          <span className={`dot ${pipeline.connected ? 'on' : ''}`} />
          <button className="btn-ghost" onClick={toggle}>
            {pipeline.connected ? 'Stop' : 'Start'}
          </button>
          <button
            className="btn-ghost"
            onClick={async () => {
              if (pipeline.connected) await pipeline.stop();
              onEnd();
            }}
          >
            End
          </button>
        </div>
      </div>

      {pipeline.status && <p className="muted small">{pipeline.status}</p>}

      {/* live phase + OOOI */}
      <section className="card phasebar">
        <span className="muted small">PHASE</span>
        <span className="phase">{phase}</span>
        <div className="ooi">
          {OOOI.map((k) => (
            <span key={k} className={`ooi-chip ${ooi[k] ? 'set' : ''}`}>
              {k}
              {ooi[k] && <b>{new Date(ooi[k] as string).toLocaleTimeString()}</b>}
            </span>
          ))}
        </div>
      </section>

      {/* detected events */}
      <section className="card">
        <h2>
          Detected events · {events.length}
          {pipeline.hasSink && (
            <span className="muted" style={{ fontWeight: 400 }}>
              {' '}· {pipeline.pending} pending
            </span>
          )}
        </h2>
        {events.length ? (
          <ul className="events">
            {events.map((e, i) => {
              const sev = SEV[sevIdx[e.eventId] ?? 0];
              return (
                <li key={`${e.eventId}-${i}`} className="event">
                  {sev && <span className={`sev sev-${sev.cls}`}>{sev.label}</span>}
                  <span className="mono">{e.eventId}</span>
                  <span className="muted small">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">No events yet.</p>
        )}
        {pipeline.hasSink && (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted small">
              {pipeline.pending} queued for flight #{leg.id}
            </span>
            <button
              className="btn-ghost"
              onClick={pipeline.flushNow}
              disabled={pipeline.pending === 0}
            >
              Flush now
            </button>
          </div>
        )}
      </section>

      {/* developer panel: alternate sources + phase ladder */}
      <section className="card">
        <button className="link-btn" onClick={() => setDev((d) => !d)}>
          {dev ? '▾' : '▸'} Developer
        </button>
        {dev && (
          <div className="dev-panel">
            <div className="row wrap">
              <span className="muted small">Source</span>
              <select
                value={kind}
                disabled={pipeline.connected}
                onChange={(e) => setKind(e.target.value as SourceKind)}
              >
                <option value="x-plane">X-Plane (localhost:8086)</option>
                <option value="mock">Mock (scripted flight)</option>
                <option value="replay">Replay recording</option>
              </select>
              {kind === 'replay' && (
                <>
                  <label className="muted small">
                    speed
                    <input
                      className="in"
                      type="number"
                      min={1}
                      max={50}
                      value={speed}
                      onChange={(e) => setSpeed(+e.target.value || 1)}
                      style={{ maxWidth: 64, marginLeft: 6 }}
                      disabled={pipeline.connected}
                    />
                    ×
                  </label>
                  <label className="filebtn">
                    Load JSON…
                    <input
                      type="file"
                      accept="application/json"
                      hidden
                      onChange={(e) =>
                        e.target.files?.[0] && loadRecording(e.target.files[0])
                      }
                    />
                  </label>
                </>
              )}
            </div>

            <ul className="ladder" style={{ marginTop: 12 }}>
              {[...bundle.phases]
                .sort((a, b) => a.order - b.order)
                .map((p) => {
                  const active = p.name === phase;
                  const truth =
                    p.entryExpr && scope ? evaluateExpr(p.entryExpr, scope) : null;
                  const isTrue = truth ? !truth.error && !!truth.result : false;
                  return (
                    <li
                      key={p.id}
                      className={`ladder-row ${active ? 'active' : ''} ${
                        !p.entryExpr ? 'container' : ''
                      }`}
                    >
                      <span className={`ladder-dot ${active ? 'on' : ''} ${isTrue ? 'true' : ''}`} />
                      <span className="ladder-name">{p.name}</span>
                      {p.entryExpr ? (
                        <>
                          <span className="ladder-expr mono">{p.entryExpr}</span>
                          <span className={`ladder-truth ${isTrue ? 'yes' : 'no'}`}>
                            {scope ? (isTrue ? 'TRUE' : 'false') : '—'}
                          </span>
                        </>
                      ) : (
                        <span className="muted small">container</span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
