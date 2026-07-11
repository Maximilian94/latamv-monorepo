import { useState } from 'react';
import { useSession } from './core/session';
import { LoginScreen } from './screens/login-screen';
import { DutyScreen } from './screens/duty-screen';
import { PreflightScreen } from './screens/preflight-screen';
import { LiveScreen } from './screens/live-screen';
import type { FlightLeg } from './sync/backend-client';
import type { PublishedBundle } from './core/ports';
import './App.css';

function App() {
  const session = useSession();
  const [leg, setLeg] = useState<FlightLeg | null>(null);
  const [liveBundle, setLiveBundle] = useState<PublishedBundle | null>(null);

  const loggedIn = !!session.token;

  const logout = () => {
    setLiveBundle(null);
    setLeg(null);
    session.logout();
  };

  const backToDuty = () => {
    setLiveBundle(null);
    setLeg(null);
  };

  let screen;
  if (!loggedIn) {
    screen = <LoginScreen onDone={() => setLeg(null)} />;
  } else if (!leg) {
    screen = <DutyScreen onSelect={setLeg} />;
  } else if (!liveBundle) {
    screen = (
      <PreflightScreen leg={leg} onBack={backToDuty} onStart={setLiveBundle} />
    );
  } else {
    screen = <LiveScreen leg={leg} bundle={liveBundle} onEnd={backToDuty} />;
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-mark">✈</span>
          <span>LATAM Virtual · ACARS</span>
        </div>
        {loggedIn && (
          <div className="row">
            <span className="muted small">{session.user?.username}</span>
            <button className="link-btn" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>
      {screen}
    </main>
  );
}

export default App;
