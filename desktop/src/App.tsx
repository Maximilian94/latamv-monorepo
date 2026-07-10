import { useEffect, useMemo, useRef, useState } from 'react';
import { MockSource } from './xplane/mock-source';
import { XPlaneSource, DEMO_DATAREFS } from './xplane/xplane-source';
import { useFlightStore } from './core/store';
import { useSession } from './core/session';
import { RuleEngine } from './rules/rule-engine';
import { buildScope } from './rules/normalize';
import { FIXTURE_BUNDLE } from './rules/fixture-bundle';
import { login, fetchPublishedBundle } from './sync/backend-client';
import { BackendEventSink } from './sync/backend-sink';
import {
  ReplaySource,
  FrameRecorder,
  type Recording,
} from './xplane/replay-source';
import type { PublishedBundle, TelemetrySource, Unsubscribe } from './core/ports';
import './App.css';

type SourceKind = 'mock' | 'x-plane' | 'replay';

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

function App() {
  const [kind, setKind] = useState<SourceKind>('mock');
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [bundle, setBundle] = useState<PublishedBundle>(FIXTURE_BUNDLE);
  const [bundleNote, setBundleNote] = useState('fixture (A320 demo)');
  const [pending, setPending] = useState(0);

  const sourceRef = useRef<TelemetrySource | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const engineRef = useRef<RuleEngine>(new RuleEngine(FIXTURE_BUNDLE));
  const sinkRef = useRef<BackendEventSink | null>(null);
  const recorderRef = useRef<FrameRecorder>(new FrameRecorder());

  const [recordOn, setRecordOn] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [recording, setRecording] = useState<Recording | null>(null);

  const sevIdx = useMemo(() => severityIndex(bundle), [bundle]);

  const { values, phase, ooi, frames, events, setFrame, pushEvents, reset } =
    useFlightStore();
  const session = useSession();

  // Keep the engine's rules in sync with the loaded bundle.
  useEffect(() => {
    engineRef.current.load(bundle);
  }, [bundle]);

  // ---- backend session ----
  const [creds, setCreds] = useState({ id: '', pw: '' });
  const [authNote, setAuthNote] = useState('');

  const doLogin = async () => {
    setAuthNote('signing in…');
    try {
      const res = await login(session.baseUrl, creds.id, creds.pw);
      session.setSession(res);
      setAuthNote(`signed in as ${res.user.username}`);
      await loadBundle(res.authToken);
    } catch (e) {
      setAuthNote(`login failed: ${String(e)}`);
    }
  };

  const loadBundle = async (token: string) => {
    setBundleNote('fetching…');
    try {
      const b = await fetchPublishedBundle(
        session.baseUrl,
        token,
        session.aircraftModelCode,
      );
      setBundle(b);
      setBundleNote(`published ${b.version.aircraftModelCode} v${b.version.version}`);
    } catch (e) {
      setBundle(FIXTURE_BUNDLE);
      setBundleNote(`fetch failed, using fixture: ${String(e)}`);
    }
  };

  const doLogout = () => {
    session.logout();
    setAuthNote('');
    setBundle(FIXTURE_BUNDLE);
    setBundleNote('fixture (A320 demo)');
  };

  // ---- telemetry lifecycle ----
  const start = async () => {
    if (kind === 'replay' && !recording) {
      setStatus('No recording loaded. Record a mock flight or load a JSON file.');
      return;
    }
    reset();
    engineRef.current.reset();
    setPending(0);

    const capturing = recordOn && kind !== 'replay';
    if (capturing) recorderRef.current.reset();

    sinkRef.current =
      session.token && session.flightId != null
        ? new BackendEventSink({
            base: session.baseUrl,
            token: session.token,
            flightId: session.flightId,
          })
        : null;

    let source: TelemetrySource;
    if (kind === 'mock') source = new MockSource();
    else if (kind === 'replay') source = new ReplaySource(recording!, speed);
    else source = new XPlaneSource(DEMO_DATAREFS);
    if (source instanceof XPlaneSource) source.onStatus((s) => setStatus(s.message));
    sourceRef.current = source;

    unsubRef.current = source.onFrame((raw, meta) => {
      const nowIso = new Date().toISOString();
      // Prefer the source's flight-time clock (deterministic under replay);
      // fall back to wall-clock only if a source doesn't supply one.
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

  const stop = async () => {
    await sourceRef.current?.disconnect();
    unsubRef.current?.();
    sourceRef.current = null;
    unsubRef.current = null;
    setConnected(false);
    setStatus('');
    if (recordOn && recorderRef.current.count > 0) {
      setRecording(recorderRef.current.toRecording(`${kind} flight`));
    }
    reset();
  };

  const downloadRecording = () => {
    if (!recording) return;
    const blob = new Blob([JSON.stringify(recording)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'latam-acars-recording.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadRecording = (file: File) => {
    const rdr = new FileReader();
    rdr.onload = () => {
      try {
        const parsed = JSON.parse(String(rdr.result)) as Recording;
        if (!Array.isArray(parsed.frames)) throw new Error('missing frames[]');
        setRecording(parsed);
        setKind('replay');
        setStatus(`loaded recording: ${parsed.frames.length} frames`);
      } catch (e) {
        setStatus(`bad recording file: ${String(e)}`);
      }
    };
    rdr.readAsText(file);
  };

  const flushNow = async () => {
    await sinkRef.current?.flush();
    setPending(sinkRef.current?.pending ?? 0);
  };

  const toggle = () => (connected ? stop() : start());

  const scope = useMemo(
    () => (frames > 0 ? buildScope(values, bundle.datarefs) : null),
    [values, frames, bundle]
  );

  const loggedIn = !!session.token;

  return (
    <main className="app">
      <header>
        <h1>LATAM Link · ACARS</h1>
        <span className="tag">Tauri · M5 backend sync</span>
      </header>

      {/* ---- backend session ---- */}
      <section className="card">
        <h2>Backend session</h2>
        {loggedIn ? (
          <div className="row">
            <span className="dot on" />
            <span className="muted small">{authNote}</span>
            <input
              className="in"
              type="number"
              placeholder="flight id"
              value={session.flightId ?? ''}
              onChange={(e) =>
                session.setFlightId(e.target.value ? +e.target.value : null)
              }
              style={{ maxWidth: 110 }}
            />
            <button onClick={doLogout}>Log out</button>
          </div>
        ) : (
          <div className="row wrap">
            <input
              className="in"
              placeholder="base url"
              value={session.baseUrl}
              onChange={(e) => session.setBaseUrl(e.target.value)}
              style={{ minWidth: 180 }}
            />
            <input
              className="in"
              placeholder="email or username"
              value={creds.id}
              onChange={(e) => setCreds((c) => ({ ...c, id: e.target.value }))}
            />
            <input
              className="in"
              type="password"
              placeholder="password"
              value={creds.pw}
              onChange={(e) => setCreds((c) => ({ ...c, pw: e.target.value }))}
            />
            <button onClick={doLogin}>Log in</button>
          </div>
        )}
        {authNote && !loggedIn && <p className="muted small" style={{ marginTop: 8 }}>{authNote}</p>}
        <p className="muted small" style={{ marginTop: 8 }}>Rules: {bundleNote} · {engineRef.current.ruleCount} rules</p>
      </section>

      {/* ---- source ---- */}
      <section className="card">
        <div className="row">
          <span className={`dot ${connected ? 'on' : ''}`} />
          <select value={kind} disabled={connected} onChange={(e) => setKind(e.target.value as SourceKind)}>
            <option value="mock">Mock source (full flight)</option>
            <option value="x-plane">X-Plane (localhost:8086)</option>
            <option value="replay">Replay recording (no sim)</option>
          </select>
          <span className="muted">{connected ? `${frames} frames` : 'idle'}</span>
          <button onClick={toggle}>{connected ? 'Stop' : 'Start'}</button>
        </div>

        <div className="row wrap" style={{ marginTop: 10 }}>
          {kind === 'replay' ? (
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
                  style={{ maxWidth: 70, marginLeft: 6 }}
                  disabled={connected}
                />
                ×
              </label>
              <span className="muted small">
                {recording
                  ? `${recording.frames.length} frames ready`
                  : 'no recording'}
              </span>
              <label className="filebtn">
                Load JSON…
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => e.target.files?.[0] && loadRecording(e.target.files[0])}
                />
              </label>
            </>
          ) : (
            <label className="muted small">
              <input
                type="checkbox"
                checked={recordOn}
                onChange={(e) => setRecordOn(e.target.checked)}
                disabled={connected}
                style={{ marginRight: 6 }}
              />
              Record this flight for replay
            </label>
          )}
          {recording && (
            <button onClick={downloadRecording} disabled={connected}>
              Download recording
            </button>
          )}
        </div>

        {status && (
          <p className="muted small" style={{ marginTop: 8 }}>{status}</p>
        )}
      </section>

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

      <section className="grid">
        <div className="card">
          <h2>Telemetry (alias scope)</h2>
          {scope ? (
            <table>
              <tbody>
                {Object.entries(scope).map(([k, v]) => (
                  <tr key={k}>
                    <td className="muted mono">{k}</td>
                    <td className="mono num">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">
              {kind === 'x-plane'
                ? 'Start with X-Plane running (web server :8086) to see live datarefs.'
                : 'Start the mock source to fly a scripted flight.'}
            </p>
          )}
        </div>

        <div className="card">
          <h2>
            Detected events · {events.length}
            {sinkRef.current && (
              <span className="muted" style={{ fontWeight: 400 }}>
                {' '}· {pending} pending
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
                      {e.details &&
                        ` · ${Object.entries(e.details)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">
              No events yet. Fly the mock source: taxi over-speed (CONTINUOUS)
              and touchdown (SNAPSHOT) fire automatically.
            </p>
          )}
          {sinkRef.current ? (
            <div className="row" style={{ marginTop: 10 }}>
              <span className="muted small">
                Sending to flight #{session.flightId} · {pending} queued
              </span>
              <button onClick={flushNow} disabled={pending === 0}>Flush now</button>
            </div>
          ) : (
            <p className="muted small" style={{ marginTop: 10 }}>
              {loggedIn
                ? 'Set a flight id above to POST detected events to the backend.'
                : 'Log in and set a flight id to sync events to the backend.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
