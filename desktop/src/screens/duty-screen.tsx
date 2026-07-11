import { useEffect, useState } from 'react';
import { useSession } from '../core/session';
import { fetchFlightDuty, type FlightDuty, type FlightLeg } from '../sync/backend-client';
import { humanizeError } from '../core/humanize-error';
import { routeCities } from '../core/labels';

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
      setError(humanizeError(e));
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
          <h2>Your duty</h2>
          <p className="muted small">
            {duty
              ? `${duty.aircraftRegistration} · ${duty.flights.length} legs`
              : 'No open duty'}
          </p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!loading && !error && !duty && (
        <div className="empty">
          <p>You have no open flight duty.</p>
          <p className="muted small">
            Generate one on the website, then tap Refresh.
          </p>
        </div>
      )}

      {duty && (
        <ul className="legs">
          {duty.flights
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((leg) => {
              const isCurrent = leg.id === currentLeg?.id;
              const cities = routeCities(leg.departureIcao, leg.arrivalIcao);
              return (
                <li
                  key={leg.id}
                  className={`leg ${leg.isClosed ? 'done' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="leg-idx">
                    <span className="hash">{leg.index + 1}</span>
                    <span className="fn">{leg.flightNumber}</span>
                  </div>
                  <div className="leg-route">
                    <div className="icaos">
                      {leg.departureIcao}
                      <span className="arw">→</span>
                      {leg.arrivalIcao}
                    </div>
                    {cities && <div className="cities">{cities}</div>}
                    <div className="meta">
                      {leg.aircraftModel} · {eetLabel(leg.eet)}
                    </div>
                  </div>
                  <div className="leg-end">
                    {leg.isClosed ? (
                      <span className="badge flown">✓ Flown</span>
                    ) : isCurrent ? (
                      <button
                        className="btn-primary sm"
                        onClick={() => onSelect(leg)}
                      >
                        Pre-flight →
                      </button>
                    ) : (
                      <span className="badge locked">Locked</span>
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
