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
