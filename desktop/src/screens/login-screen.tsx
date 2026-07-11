import { useState } from 'react';
import { useSession } from '../core/session';
import { login } from '../sync/backend-client';

/** Pilot sign-in. On success the session token is stored and onDone() fires. */
export function LoginScreen({ onDone }: { onDone: () => void }) {
  const session = useSession();
  const [creds, setCreds] = useState({ id: '', pw: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const submit = async () => {
    if (!creds.id || !creds.pw) return;
    setBusy(true);
    setError('');
    try {
      const res = await login(session.baseUrl, creds.id, creds.pw);
      session.setSession(res);
      onDone();
    } catch (e) {
      setError(String(e).replace(/^Error:\s*/, ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen login">
      <div className="brand">
        <div className="brand-mark">✈</div>
        <h1>LATAM Virtual</h1>
        <p className="muted">ACARS · flight tracking</p>
      </div>

      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="field">
          <span>Email or username</span>
          <input
            className="in"
            autoFocus
            value={creds.id}
            onChange={(e) => setCreds((c) => ({ ...c, id: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="in"
            type="password"
            value={creds.pw}
            onChange={(e) => setCreds((c) => ({ ...c, pw: e.target.value }))}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          className="link-btn"
          onClick={() => setShowSettings((s) => !s)}
        >
          {showSettings ? 'Hide' : 'Server settings'}
        </button>
        {showSettings && (
          <label className="field">
            <span>Backend URL</span>
            <input
              className="in"
              value={session.baseUrl}
              onChange={(e) => session.setBaseUrl(e.target.value)}
            />
          </label>
        )}
      </form>
    </div>
  );
}
