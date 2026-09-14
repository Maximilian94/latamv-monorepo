import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../core/session';
import { useFlightStore } from '../core/store';
import { useAcarsPipeline } from '../core/acars-pipeline';
import { buildScope } from '../rules/normalize';
import { evaluateExpr } from '../lib/expr/expr-eval';
import { MockSource } from '../xplane/mock-source';
import { XPlaneSource, DEMO_DATAREFS } from '../xplane/xplane-source';
import { ReplaySource, type Recording } from '../xplane/replay-source';
import {
  resetFlightEvents,
  submitFlight,
  type FlightLeg,
} from '../sync/backend-client';
import type { PublishedBundle, TelemetrySource } from '../core/ports';
import { humanizeError } from '../core/humanize-error';
import {
  phaseLabel,
  phaseGlyph,
  severityClass,
  isGoodSeverity,
  weightFor,
  routeCities,
} from '../core/labels';

/** FSM phase code for "parked at the gate" — the last phase, where submit unlocks. */
const PARKING_PHASE = 'parking';

type SourceKind = 'x-plane' | 'mock' | 'replay';

interface EventMeta {
  name: string;
  severityId: number;
}

/** eventId -> { name, severityId } from the bundle, for friendly display + scoring. */
function eventIndex(bundle: PublishedBundle): Map<string, EventMeta> {
  const idx = new Map<string, EventMeta>();
  for (const p of bundle.phases)
    for (const s of p.subPhases)
      for (const it of s.items)
        for (const e of it.events)
          idx.set(e.id, { name: e.name, severityId: e.severityId });
  return idx;
}

/** All datarefs the live source must subscribe to. */
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

  const { values, phase, frames, events, ooi } = useFlightStore();
  const evMeta = useMemo(() => eventIndex(bundle), [bundle]);
  const scope = useMemo(
    () => (frames > 0 ? buildScope(values, bundle.datarefs) : null),
    [values, frames, bundle],
  );

  const [kind, setKind] = useState<SourceKind>('x-plane');
  const [speed, setSpeed] = useState(4);
  const [recording, setRecording] = useState<Recording | null>(null);
  const startedRef = useRef(false);

  // ACARS session start — stamped once real telemetry starts flowing.
  const startAcarsRef = useRef<string | null>(null);
  useEffect(() => {
    if (frames > 0 && !startAcarsRef.current) {
      startAcarsRef.current = new Date().toISOString();
    }
  }, [frames]);

  const [submitState, setSubmitState] = useState<{
    busy: boolean;
    done: boolean;
    error: string;
    score: number | null;
  }>({ busy: false, done: false, error: '', score: null });

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

  // Auto-connect to X-Plane when the screen opens (pre-flight already verified).
  // A fresh tracking session first clears any events left on this leg from a
  // previous/abandoned session, so re-flying replaces instead of piling up.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      try {
        await resetFlightEvents(session.baseUrl, session.token!, leg.id);
      } catch (e) {
        // Non-fatal: keep flying even if the reset couldn't run.
        pipeline.setStatus(`Couldn't clear previous events: ${humanizeError(e)}`);
      }
      await startSource('x-plane');
    })();
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

  // Abandon the flight without grading (aircraft never made it to the gate).
  const cancelFlight = async () => {
    if (pipeline.connected) await pipeline.stop();
    onEnd();
  };

  // Send the flight to the backend for grading. Only reachable once parked at
  // the gate with the parking brake set. Events were streamed live, so we just
  // flush any stragglers, then hand the leg to the backend to finalize + score.
  const handleSubmit = async () => {
    setSubmitState((s) => ({ ...s, busy: true, error: '' }));
    try {
      if (pipeline.hasSink && pipeline.pending > 0) await pipeline.flushNow();
      if (pipeline.connected) await pipeline.stop();
      const res = await submitFlight(session.baseUrl, session.token!, {
        flightId: leg.id,
        flightDutyId: leg.flightDutyId,
        startAcarsTime: startAcarsRef.current ?? new Date().toISOString(),
        endAcarsTime: new Date().toISOString(),
        OUT: ooi.OUT,
        OFF: ooi.OFF,
        ON: ooi.ON,
        IN: ooi.IN,
      });
      if (!res.success) throw new Error(res.message);
      setSubmitState({ busy: false, done: true, error: '', score: res.score });
    } catch (e) {
      setSubmitState({ busy: false, done: false, error: humanizeError(e), score: null });
    }
  };

  // ---- derive performance ----
  const fsmPhases = useMemo(
    () =>
      [...bundle.phases]
        .filter((p) => p.entryExpr && p.entryExpr.trim())
        .sort((a, b) => a.order - b.order),
    [bundle],
  );
  const phaseIdx = fsmPhases.findIndex((p) => p.name === phase);

  const { good, bad, score } = useMemo(() => {
    let g = 0;
    let b = 0;
    let s = bundle.version.baseScore;
    for (const e of events) {
      const sevId = evMeta.get(e.eventId)?.severityId ?? 0;
      s += weightFor(sevId, bundle.version);
      if (isGoodSeverity(sevId)) g++;
      else if (sevId === 3 || sevId === 4) b++;
    }
    return { good: g, bad: b, score: Math.max(0, Math.min(100, Math.round(s))) };
  }, [events, evMeta, bundle.version]);

  const scoreColor = score >= 85 ? 'var(--good)' : score >= 70 ? 'var(--warn)' : 'var(--crit)';
  const recent = events.slice(-6).reverse();
  const waiting = !pipeline.connected || phase === 'not-started';
  const cities = routeCities(leg.departureIcao, leg.arrivalIcao);

  // Submit unlocks only when parked at the gate with the parking brake set.
  const atGate = phase === PARKING_PHASE;
  const parkBrakeSet = !!scope?.park_brake;
  const canSubmit =
    atGate && parkBrakeSet && !submitState.busy && !submitState.done;
  const finalColor =
    (submitState.score ?? 0) >= 85
      ? 'var(--good)'
      : (submitState.score ?? 0) >= 70
        ? 'var(--warn)'
        : 'var(--crit)';

  return (
    <div className="screen live">
      {/* flight header */}
      <div className="card flight-head">
        <div>
          <div className="flt-no">{leg.flightNumber}</div>
          <div className="flt-rte">
            {leg.departureIcao} → {leg.arrivalIcao} · {leg.aircraftModel}
          </div>
          {cities && <div className="flt-cities">{cities}</div>}
        </div>
        <span className={`conn ${pipeline.connected ? 'on' : 'off'}`}>
          <span className="led" />
          {pipeline.connected ? 'Connected' : 'Connecting…'}
        </span>
      </div>

      {/* current phase */}
      <section className="card">
        <p className="eyebrow">Current phase</p>
        <div className="phase-name">
          <span className="phase-glyph">{phaseGlyph(waiting ? 'not-started' : phase)}</span>
          <span className="phase-txt">
            <strong>{waiting ? 'Waiting…' : phaseLabel(phase)}</strong>
            <span>
              {waiting
                ? 'connect X-Plane and start the flight'
                : phaseIdx >= 0
                  ? `Phase ${phaseIdx + 1} of ${fsmPhases.length}`
                  : 'in progress'}
            </span>
          </span>
        </div>
        {fsmPhases.length > 0 && (
          <div className="dots" aria-hidden="true">
            {fsmPhases.map((p, i) => (
              <i
                key={p.id}
                className={i < phaseIdx ? 'done' : i === phaseIdx ? 'now' : ''}
              />
            ))}
          </div>
        )}
      </section>

      {/* performance */}
      <section className="card">
        <p className="eyebrow">Performance</p>
        <div className="perf-top">
          <div className="tallies">
            <div className="tally good">
              <b>{good}</b>
              <span>correct</span>
            </div>
            <div className="tally bad">
              <b>{bad}</b>
              <span>deviations</span>
            </div>
          </div>
          <div className="score">
            <b>{score}</b>
            <span>Live score</span>
          </div>
        </div>
        <div className="bar">
          <i style={{ width: `${score}%`, background: scoreColor }} />
        </div>
      </section>

      {/* events */}
      <section className="card">
        <p className="eyebrow">
          Events{' '}
          <span style={{ color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
            · {events.length}
          </span>
        </p>
        {recent.length ? (
          <ul className="feed">
            {recent.map((e, i) => {
              const meta = evMeta.get(e.eventId);
              const cls = severityClass(meta?.severityId ?? 0);
              const isOk = cls === 'good';
              return (
                <li key={`${e.eventId}-${i}`} className={cls}>
                  <span className="ic">{isOk ? '✓' : '✕'}</span>
                  <span className="label">
                    {meta?.name ?? e.eventId}
                    <em>{isOk ? 'Correct' : cls === 'crit' ? 'Compromise' : 'Deviation'}</em>
                  </span>
                  <span className="t">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="feed-empty">Nothing yet — just fly and checks will show up here.</p>
        )}
      </section>

      {/* what to do */}
      <div className="todo">
        <span className="ic">✓</span>
        <p>
          <b>What to do</b>
          {waiting
            ? 'Waiting for X-Plane. Once connected, just fly — the app records everything on its own.'
            : "Just fly normally. The app records everything on its own — you don't need to press anything."}
        </p>
      </div>

      {submitState.done ? (
        <div className="card submit-done">
          <p className="eyebrow">Flight submitted for grading</p>
          <div className="final-score">
            <b style={{ color: finalColor }}>{submitState.score ?? '—'}</b>
            <span>Final score</span>
          </div>
          <p className="muted small">
            Your flight was sent to LATAM Virtual and graded. You can review the
            full breakdown on the website.
          </p>
          <button className="btn-primary" onClick={onEnd}>
            Back to duty
          </button>
        </div>
      ) : (
        <div className="actions">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitState.busy ? 'Submitting…' : 'Submit Flight'}
          </button>
          <button className="btn-ghost" onClick={cancelFlight}>
            Cancel flight
          </button>
          <p className="hint">
            {!atGate
              ? 'Submit unlocks once you park at the arrival gate.'
              : !parkBrakeSet
                ? "You're parked — set the parking brake to submit."
                : "You've arrived. Submit to send your flight for grading."}
          </p>
          {submitState.error && (
            <p className="error-text">{submitState.error}</p>
          )}
        </div>
      )}

      {/* advanced */}
      <details className="adv">
        <summary>
          <span className="chev">›</span>
          Advanced
          <span className="tag">
            {kind === 'x-plane' ? 'X-Plane' : kind} · {pipeline.pending} queued
          </span>
        </summary>
        <div className="adv-body">
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span className="muted small">Source</span>
            <select
              className="in"
              style={{ width: 'auto', padding: '7px 10px' }}
              value={kind}
              disabled={pipeline.connected}
              onChange={(e) => setKind(e.target.value as SourceKind)}
            >
              <option value="x-plane">X-Plane (localhost:8086)</option>
              <option value="mock">Mock (scripted flight)</option>
              <option value="replay">Replay recording</option>
            </select>
            <button className="btn-ghost" onClick={toggle}>
              {pipeline.connected ? 'Stop' : 'Start'}
            </button>
            {kind === 'replay' && (
              <label className="muted small">
                speed
                <input
                  className="in"
                  type="number"
                  min={1}
                  max={50}
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value || 1)}
                  style={{ maxWidth: 64, marginLeft: 6, padding: '6px 8px' }}
                  disabled={pipeline.connected}
                />
                ×
              </label>
            )}
            {kind === 'replay' && (
              <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                Load JSON…
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => e.target.files?.[0] && loadRecording(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {pipeline.status && <p className="muted small" style={{ margin: 0 }}>{pipeline.status}</p>}

          <div className="stat-grid">
            <div className="stat"><span>Frames</span><b>{frames.toLocaleString('en-US')}</b></div>
            <div className="stat"><span>Active rules</span><b>{pipeline.ruleCount}</b></div>
            <div className="stat">
              <span>Queued</span>
              <b>{pipeline.pending}</b>
            </div>
            <div className="stat">
              <span>Delivery</span>
              <b>{pipeline.hasSink ? 'live' : 'off'}</b>
            </div>
          </div>
          {pipeline.hasSink && (
            <button
              className="btn-ghost"
              onClick={pipeline.flushNow}
              disabled={pipeline.pending === 0}
            >
              Flush {pipeline.pending} queued now
            </button>
          )}

          <div className="ladder">
            {[...bundle.phases]
              .sort((a, b) => a.order - b.order)
              .map((p) => {
                const active = p.name === phase;
                const truth = p.entryExpr && scope ? evaluateExpr(p.entryExpr, scope) : null;
                const isTrue = truth ? !truth.error && !!truth.result : false;
                const done =
                  phaseIdx >= 0 && fsmPhases.findIndex((f) => f.name === p.name) < phaseIdx;
                return (
                  <div key={p.id} className={`lrow ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                    <span className="ld" />
                    <span>{p.name}</span>
                    {p.entryExpr ? (
                      <span className={`tf ${isTrue ? 'yes' : 'no'}`}>
                        {scope ? (isTrue ? 'TRUE' : 'false') : '—'}
                      </span>
                    ) : (
                      <span className="tf no">container</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </details>
    </div>
  );
}
