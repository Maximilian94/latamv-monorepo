import { invoke } from '@tauri-apps/api/core';
import type { DetectedEvent, PublishedBundle } from '../core/ports';

/**
 * Typed wrappers over the Rust HTTP bridge (src-tauri/src/api.rs). All backend
 * traffic goes through Rust/reqwest, so there is no webview CORS to configure.
 */

export interface LoginResult {
  authToken: string;
  user: { id: number; username: string; email: string; [k: string]: unknown };
}

export async function login(
  base: string,
  emailOrUsername: string,
  password: string,
): Promise<LoginResult> {
  const raw = await invoke<string>('api_login', {
    base,
    emailOrUsername,
    password,
  });
  return JSON.parse(raw) as LoginResult;
}

export async function fetchPublishedBundle(
  base: string,
  token: string,
  aircraftModelCode: string,
): Promise<PublishedBundle> {
  const raw = await invoke<string>('api_get_published', {
    base,
    token,
    aircraftModelCode,
  });
  return JSON.parse(raw) as PublishedBundle;
}

export interface VersionSummary {
  id: number;
  aircraftModelCode: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

/** List every version (draft + published) for a model so test mode can pick one. */
export async function listVersions(
  base: string,
  token: string,
  aircraftModelCode: string,
): Promise<VersionSummary[]> {
  const raw = await invoke<string>('api_list_versions', {
    base,
    token,
    aircraftModelCode,
  });
  return JSON.parse(raw) as VersionSummary[];
}

/** Bundle for any version (draft included) — test a draft before publishing. */
export async function fetchVersionBundle(
  base: string,
  token: string,
  versionId: number,
): Promise<PublishedBundle> {
  const raw = await invoke<string>('api_get_version_bundle', {
    base,
    token,
    versionId,
  });
  return JSON.parse(raw) as PublishedBundle;
}

/** One leg of a flight duty (mirrors the backend Flight row fields we need). */
export interface FlightLeg {
  id: number;
  flightDutyId: number;
  index: number;
  isClosed: boolean;
  flightNumber: string;
  departureIcao: string;
  arrivalIcao: string;
  aircraftRegistration: string;
  aircraftModel: string;
  eet: number;
  procedureVersionId: number | null;
}

export interface FlightDuty {
  id: number;
  aircraftRegistration: string;
  isClosed: boolean;
  flights: FlightLeg[];
}

/** GET /flight-duty -> the pilot's open duty (or {} when none). */
export async function fetchFlightDuty(
  base: string,
  token: string,
): Promise<FlightDuty | null> {
  const raw = await invoke<string>('api_get_flight_duty', { base, token });
  const parsed = JSON.parse(raw);
  return parsed && parsed.id ? (parsed as FlightDuty) : null;
}

export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  city?: string;
  lat: number;
  lon: number;
  elevation?: number;
}

/** GET /airport/:icao -> airport record with lat/lon (no auth on the backend). */
export async function fetchAirport(base: string, icao: string): Promise<Airport> {
  const raw = await invoke<string>('api_get_airport', { base, icao });
  return JSON.parse(raw) as Airport;
}

/** POST a batch of detected events to /flight/:id/events. Resolves on 2xx. */
export async function postFlightEvents(
  base: string,
  token: string,
  flightId: number,
  events: DetectedEvent[],
): Promise<void> {
  await invoke<string>('api_post_events', {
    base,
    token,
    flightId,
    events,
  });
}

export interface SubmitFlightResult {
  success: boolean;
  message: string;
  score: number | null;
}

/** Finalize + grade the current leg. Events were already streamed live. */
export async function submitFlight(
  base: string,
  token: string,
  payload: {
    flightId: number;
    flightDutyId: number;
    startAcarsTime: string;
    endAcarsTime: string;
    OUT?: string;
    OFF?: string;
    ON?: string;
    IN?: string;
  },
): Promise<SubmitFlightResult> {
  const raw = await invoke<string>('api_submit_flight', {
    base,
    token,
    flightId: payload.flightId,
    flightDutyId: payload.flightDutyId,
    startAcarsTime: payload.startAcarsTime,
    endAcarsTime: payload.endAcarsTime,
    outTime: payload.OUT,
    offTime: payload.OFF,
    onTime: payload.ON,
    inTime: payload.IN,
  });
  return JSON.parse(raw) as SubmitFlightResult;
}
