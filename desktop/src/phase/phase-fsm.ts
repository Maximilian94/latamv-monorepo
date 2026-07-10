import type { FlightPhase, OOOI, RawFrame } from '../core/ports';

/* Pure flight-phase FSM, ported 1:1 from acars-v5's active
 * `FlightPhaseManagerService.startMonitoring()` decision ladder.
 *
 * It is a stateless lookup over five Airbus (ToLiSs A320) datarefs. The QPAC
 * flight-phase value already distinguishes taxi-out (3) from taxi-in after
 * landing (13), so no "already took off" latch is needed. On no match the
 * phase is left unchanged (return prev). */

export const PHASE_DATAREFS = {
  QPACFlightPhase: 'AirbusFBW/QPACFlightPhase',
  APPhase: 'AirbusFBW/APPhase',
  EngineMaster1: 'AirbusFBW/ENG1MasterSwitch',
  EngineMaster2: 'AirbusFBW/ENG2MasterSwitch',
  EngineModeSelector: 'AirbusFBW/ENGModeSwitch',
} as const;

export interface PhaseInputs {
  QPACFlightPhase: number;
  APPhase: number;
  EngineMaster1: number;
  EngineMaster2: number;
  EngineModeSelector: number;
}

/** Datarefs the FSM needs subscribed (in addition to any the rules reference). */
export const PHASE_DATAREF_NAMES: string[] = Object.values(PHASE_DATAREFS);

export function phaseInputsFromRaw(raw: RawFrame): PhaseInputs {
  const num = (name: string): number => {
    const v = raw[name];
    return typeof v === 'number' ? v : Number(v);
  };
  return {
    QPACFlightPhase: num(PHASE_DATAREFS.QPACFlightPhase),
    APPhase: num(PHASE_DATAREFS.APPhase),
    EngineMaster1: num(PHASE_DATAREFS.EngineMaster1),
    EngineMaster2: num(PHASE_DATAREFS.EngineMaster2),
    EngineModeSelector: num(PHASE_DATAREFS.EngineModeSelector),
  };
}

export function nextPhase(i: PhaseInputs, prev: FlightPhase): FlightPhase {
  const q = i.QPACFlightPhase;
  const ap = i.APPhase;
  const m1 = i.EngineMaster1;
  const m2 = i.EngineMaster2;
  const mode = i.EngineModeSelector;

  if (q === 1) {
    return mode === 2 && (m1 === 1 || m2 === 1)
      ? 'push-back_engine-start'
      : 'cockpit_preparation';
  }
  if (q === 2 && mode === 1) return 'after-start';
  if (q === 3) return 'taxing';
  if (q === 4) return 'taking-off-starting';
  if (q === 5) return 'taking-off-after-80kt';
  if (ap === 1 && q === 6) return 'taking-off-lift-off';
  if (ap === 2 && q === 7) return 'taking-off-thrust-reduction';
  if (ap === 2 && q === 8) return 'climb';
  if (ap === 3) return 'cruise';
  if (ap === 4) return 'descent';
  if (ap === 5 && q === 8) return 'approach';
  if (q === 9) return 'landing-about-2000ft';
  if (q === 10) return 'landing-about-1000ft';
  if (q === 11) return 'touch-down';
  if (q === 13) return m1 === 0 && m2 === 0 ? 'parking' : 'taxi-out';

  return prev; // no branch matched → phase unchanged
}

/** Which OOOI marker (if any) a transition INTO this phase stamps.
 *  Mirrors acars-v5 protected.component: OUT@pushback, OFF@takeoff-start,
 *  ON@taxi-out (rollout), IN@parking. */
export function ooiForPhase(phase: FlightPhase): OOOI | null {
  switch (phase) {
    case 'push-back_engine-start':
      return 'OUT';
    case 'taking-off-starting':
      return 'OFF';
    case 'taxi-out':
      return 'ON';
    case 'parking':
      return 'IN';
    default:
      return null;
  }
}
