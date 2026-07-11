import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../core/session';
import {
  fetchAirport,
  fetchVersionBundle,
  fetchPublishedBundle,
  type Airport,
  type FlightLeg,
} from '../sync/backend-client';
import {
  XPlaneSource,
  POSITION_DATAREFS,
  readXPlaneString,
} from '../xplane/xplane-source';
import { haversineNm, matchesAircraftModel, normalizeAircraftId } from '../core/geo';
import type { PublishedBundle } from '../core/ports';

const LOCATION_TOLERANCE_NM = 5;

type CheckState = 'pending' | 'ok' | 'fail';
interface Check {
  key: string;
  label: string;
  state: CheckState;
  detail: string;
  critical: boolean;
}

export function PreflightScreen({
  leg,
  onBack,
  onStart,
}: {
  leg: FlightLeg;
  onBack: () => void;
  onStart: (bundle: PublishedBundle) => void;
}) {
  const session = useSession();

  const [simConnected, setSimConnected] = useState(false);
  const [simStatus, setSimStatus] = useState('connecting to X-Plane…');
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);
  const [airport, setAirport] = useState<Airport | null>(null);
  const [airportErr, setAirportErr] = useState('');
  const [simTail, setSimTail] = useState<string | null>(null);
  const [simType, setSimType] = useState<string | null>(null);
  const [simDescrip, setSimDescrip] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PublishedBundle | null>(null);
  const [bundleErr, setBundleErr] = useState('');

  const sourceRef = useRef<XPlaneSource | null>(null);

  // Departure airport coordinates (for the location check).
  useEffect(() => {
    let alive = true;
    fetchAirport(session.baseUrl, leg.departureIcao)
      .then((a) => alive && setAirport(a))
      .catch((e) => alive && setAirportErr(String(e).replace(/^Error:\s*/, '')));
    return () => {
      alive = false;
    };
  }, [session.baseUrl, leg.departureIcao]);

  // Procedure bundle for this leg's aircraft (prefer the version pinned to the
  // flight; fall back to the published bundle for the model).
  useEffect(() => {
    let alive = true;
    const load = leg.procedureVersionId
      ? fetchVersionBundle(session.baseUrl, session.token!, leg.procedureVersionId)
      : fetchPublishedBundle(session.baseUrl, session.token!, leg.aircraftModel);
    load
      .then((b) => alive && setBundle(b))
      .catch((e) => alive && setBundleErr(String(e).replace(/^Error:\s*/, '')));
    return () => {
      alive = false;
    };
  }, [session.baseUrl, session.token, leg.procedureVersionId, leg.aircraftModel]);

  // Read the sim aircraft ICAO type + tail (string datarefs) once connected.
  const readAircraft = useCallback(async () => {
    try {
      const [tail, type, descrip] = await Promise.all([
        readXPlaneString('sim/aircraft/view/acf_tailnum'),
        readXPlaneString('sim/aircraft/view/acf_ICAO'),
        readXPlaneString('sim/aircraft/view/acf_descrip'),
      ]);
      setSimTail(tail);
      setSimType(type);
      setSimDescrip(descrip);
    } catch {
      /* leave null → aircraft check stays pending */
    }
  }, []);

  // Live X-Plane position stream for the location check.
  useEffect(() => {
    const src = new XPlaneSource(POSITION_DATAREFS);
    sourceRef.current = src;
    src.onStatus((s) => {
      setSimConnected(s.connected);
      setSimStatus(s.message);
      if (s.connected) void readAircraft();
    });
    const unsub = src.onFrame((raw) => {
      const lat = raw['sim/flightmodel/position/latitude'];
      const lon = raw['sim/flightmodel/position/longitude'];
      if (typeof lat === 'number' && typeof lon === 'number') {
        setPos({ lat, lon });
      }
    });
    void src.connect();
    return () => {
      unsub();
      void src.disconnect();
      sourceRef.current = null;
    };
  }, [readAircraft]);

  // ---- derive the checks ----
  const distanceNm =
    pos && airport ? haversineNm(pos.lat, pos.lon, airport.lat, airport.lon) : null;

  const tailMatch =
    !!simTail && normalizeAircraftId(simTail) === normalizeAircraftId(leg.aircraftRegistration);
  const typeMatch = matchesAircraftModel(
    [simType ?? '', simDescrip ?? ''],
    leg.aircraftModel,
  );
  const aircraftRead =
    simTail !== null || simType !== null || simDescrip !== null;
  const simLabel = simDescrip || simType || simTail || '?';

  const checks: Check[] = [
    {
      key: 'sim',
      label: 'Simulator connected',
      state: simConnected ? 'ok' : 'pending',
      detail: simConnected ? 'X-Plane Web API streaming' : simStatus,
      critical: true,
    },
    {
      key: 'location',
      label: `At departure (${leg.departureIcao})`,
      state: airportErr
        ? 'fail'
        : distanceNm == null
          ? 'pending'
          : distanceNm <= LOCATION_TOLERANCE_NM
            ? 'ok'
            : 'fail',
      detail: airportErr
        ? `airport lookup failed: ${airportErr}`
        : distanceNm == null
          ? airport
            ? 'waiting for sim position…'
            : 'loading airport…'
          : `${distanceNm.toFixed(1)} nm from ${leg.departureIcao} (max ${LOCATION_TOLERANCE_NM})`,
      critical: true,
    },
    {
      key: 'aircraft',
      label: `Aircraft (${leg.aircraftModel})`,
      state: !simConnected
        ? 'pending'
        : !aircraftRead
          ? 'pending'
          : tailMatch || typeMatch
            ? 'ok'
            : 'fail',
      detail: !aircraftRead
        ? 'reading aircraft from sim…'
        : tailMatch
          ? `tail ${simTail} matches ${leg.aircraftRegistration}`
          : typeMatch
            ? `${simLabel} · matches ${leg.aircraftModel}`
            : `sim has "${simLabel}" · expected ${leg.aircraftModel} (${leg.aircraftRegistration})`,
      critical: true,
    },
    {
      key: 'procedures',
      label: 'Procedures published',
      state: bundleErr
        ? 'fail'
        : !bundle
          ? 'pending'
          : bundle.phases.length > 0
            ? 'ok'
            : 'fail',
      detail: bundleErr
        ? bundleErr
        : !bundle
          ? 'loading…'
          : `${bundle.version.aircraftModelCode} v${bundle.version.version} · ${bundle.phases.length} phases`,
      critical: true,
    },
  ];

  const allCriticalOk = checks.every((c) => !c.critical || c.state === 'ok');

  return (
    <div className="screen preflight">
      <div className="screen-head">
        <div>
          <button className="link-btn" onClick={onBack}>
            ← Duty
          </button>
          <h2>
            {leg.flightNumber} · {leg.departureIcao} → {leg.arrivalIcao}
          </h2>
          <p className="muted small">
            {leg.aircraftModel} · {leg.aircraftRegistration}
          </p>
        </div>
      </div>

      <ul className="check-list">
        {checks.map((c) => (
          <li key={c.key} className={`check-row ${c.state}`}>
            <span className={`check-icon ${c.state}`}>
              {c.state === 'ok' ? '✓' : c.state === 'fail' ? '✕' : '…'}
            </span>
            <div className="check-body">
              <span className="check-label">{c.label}</span>
              <span className="check-detail muted small">{c.detail}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="preflight-foot">
        <button
          className="btn-primary"
          disabled={!allCriticalOk || !bundle}
          onClick={() => bundle && onStart(bundle)}
        >
          {allCriticalOk ? 'Start ACARS →' : 'Checks incomplete'}
        </button>
        {!allCriticalOk && (
          <p className="muted small">
            All checks must pass before ACARS can start. Park at {leg.departureIcao}{' '}
            in the correct aircraft with X-Plane running.
          </p>
        )}
      </div>
    </div>
  );
}
