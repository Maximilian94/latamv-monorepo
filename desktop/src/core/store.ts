import { create } from 'zustand';
import type { DetectedEvent, FlightPhase, OOOI, RawFrame } from './ports';
import { nextPhase, ooiForPhase, phaseInputsFromRaw } from '../phase/phase-fsm';

/** Reactive flight state: latest dataref values, current phase, OOOI marks,
 *  and the events the rule engine has detected so far.
 *  The pipeline writes via setFrame/pushEvents; the UI observes. */
interface FlightState {
  connected: boolean;
  values: Record<string, number | number[]>;
  phase: FlightPhase;
  ooi: Partial<Record<OOOI, string>>;
  frames: number;
  events: DetectedEvent[];

  setConnected: (v: boolean) => void;
  setFrame: (raw: RawFrame, nowIso: string) => void;
  pushEvents: (events: DetectedEvent[]) => void;
  reset: () => void;
}

const initial = {
  connected: false,
  values: {} as Record<string, number | number[]>,
  phase: 'not-started' as FlightPhase,
  ooi: {} as Partial<Record<OOOI, string>>,
  frames: 0,
  events: [] as DetectedEvent[],
};

export const useFlightStore = create<FlightState>((set) => ({
  ...initial,

  setConnected: (connected) => set({ connected }),

  setFrame: (raw, nowIso) =>
    set((state) => {
      // Coerce scalar booleans to 0/1 so downstream (FSM, normalize, rules)
      // only ever sees number | number[].
      const values: Record<string, number | number[]> = { ...state.values };
      for (const [k, v] of Object.entries(raw)) {
        values[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
      }
      const phase = nextPhase(phaseInputsFromRaw(values), state.phase);

      let ooi = state.ooi;
      if (phase !== state.phase) {
        const mark = ooiForPhase(phase);
        if (mark && ooi[mark] === undefined) {
          ooi = { ...ooi, [mark]: nowIso };
        }
      }
      return { values, phase, ooi, frames: state.frames + 1 };
    }),

  pushEvents: (events) =>
    set((state) =>
      events.length ? { events: [...state.events, ...events] } : {},
    ),

  reset: () => set({ ...initial, events: [] }),
}));
