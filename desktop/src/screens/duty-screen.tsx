import { useEffect, useState } from 'react';
import { useSession } from '../core/session';
import { fetchFlightDuty, type FlightDuty, type FlightLeg } from '../sync/backend-client';

function eetLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}m`;
}

/** The pilot's open flight duty: pick the current (first unflown) leg. */
export function DutyScreen({ onSelect }: { onSelect: (leg: FlightLeg) => void }) {
  const session = useSession();
  const [duty, setDuty] = useState<FlightDuty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!session.token) return;
    setLoading(true);
    setError('');
    try {
      setDuty(await fetchFlightDuty(session.baseUrl, session.token));
    } catch (e) {
      setError(String(e).replace(/^Error:\s*/, ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLeg = duty?.flights.find((f) => !f.isClosed) ?? null;

  return (
    <div className="screen duty">
      <div className="screen-head">
        <div>
          <h2>My duty</h2>
          <p className="muted small">
            {duty
              ? `Aircraft ${duty.aircraftRegistration} · ${duty.flights.length} legs`
              : 'No open duty'}
          </p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && <p className="muted">Loading duty…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !duty && (
        <div className="empty">
          <p>You have no open flight duty.</p>
          <p className="muted small">Generate one on the website, then refresh.</p>
        </div>
      )}

      {duty && (
        <ul className="leg-list">
          {duty.flights
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((leg) => {
              const isCurrent = leg.id === currentLeg?.id;
              return (
                <li
                  key={leg.id}
                  className={`leg-card ${leg.isClosed ? 'done' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="leg-no">
                    <span className="leg-index">#{leg.index + 1}</span>
                    <span className="leg-flight">{leg.flightNumber}</span>
                  </div>
                  <div className="leg-route">
                    <span className="icao">{leg.departureIcao}</span>
                    <span className="arrow">→</span>
                    <span className="icao">{leg.arrivalIcao}</span>
                  </div>
                  <div className="leg-meta">
                    <span className="muted small">{leg.aircraftModel}</span>
                    <span className="muted small">{eetLabel(leg.eet)}</span>
                  </div>
                  <div className="leg-action">
                    {leg.isClosed ? (
                      <span className="badge done-badge">Flown</span>
                    ) : isCurrent ? (
                      <button className="btn-primary sm" onClick={() => onSelect(leg)}>
                        Pre-flight →
                      </button>
                    ) : (
                      <span className="badge">Locked</span>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
