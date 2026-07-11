import { useState } from 'react';
import { useSession } from '../core/session';
import { login } from '../sync/backend-client';
import { humanizeError } from '../core/humanize-error';
import { environmentOf } from '../core/labels';

/** Pilot sign-in. On success the session token is stored and onDone() fires. */
export function LoginScreen({ onDone }: { onDone: () => void }) {
  const session = useSession();
  const [creds, setCreds] = useState({ id: '', pw: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const env = environmentOf(session.baseUrl);

  const submit = async () => {
    if (!creds.id || !creds.pw) {
      setError('Enter your email/username and password to sign in.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await login(session.baseUrl, creds.id, creds.pw);
      session.setSession(res);
      onDone();
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen login">
      <div className="brand">
        <div className="brand-mark">✈</div>
        <h1>LATAM Virtual</h1>
        <span className="brand-sub">ACARS</span>
        <span className={`env ${env.cls}`}>
          <span className="env-led" />
          {env.label}
        </span>
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
            autoCapitalize="none"
            autoCorrect="off"
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

        <details className="mini">
          <summary>Server settings</summary>
          <label className="field">
            <span>Backend URL</span>
            <input
              className="in"
              value={session.baseUrl}
              onChange={(e) => session.setBaseUrl(e.target.value)}
            />
          </label>
          <p className="hint-line">
            Change this only if you're connecting somewhere other than the
            production server.
          </p>
        </details>
      </form>
    </div>
  );
}
