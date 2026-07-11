import { create } from 'zustand';
import type { LoginResult } from '../sync/backend-client';

/** Persisted-ish connection/session config for backend sync (M5).
 *  Server-state (the JWT + user) plus the operator's chosen target. */
interface SessionState {
  baseUrl: string;
  token: string | null;
  user: LoginResult['user'] | null;
  aircraftModelCode: string;
  flightId: number | null;

  setBaseUrl: (v: string) => void;
  setAircraft: (v: string) => void;
  setFlightId: (v: number | null) => void;
  setSession: (r: LoginResult) => void;
  logout: () => void;
}

// Baked in at build time from VITE_API_BASE_URL (see .env.production for the
// production build, which points at the Render backend). Dev builds fall back
// to localhost. Still overridable on the login screen.
const DEFAULT_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const useSession = create<SessionState>((set) => ({
  baseUrl: DEFAULT_BASE,
  token: null,
  user: null,
  aircraftModelCode: 'A320',
  flightId: null,

  setBaseUrl: (baseUrl) => set({ baseUrl }),
  setAircraft: (aircraftModelCode) => set({ aircraftModelCode }),
  setFlightId: (flightId) => set({ flightId }),
  setSession: (r) => set({ token: r.authToken, user: r.user }),
  logout: () => set({ token: null, user: null }),
}));
