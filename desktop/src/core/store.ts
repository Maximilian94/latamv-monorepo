import { create } from 'zustand';
import type {
  DatarefDef,
  DetectedEvent,
  FlightPhase,
  OOOI,
  PhaseDef,
  RawFrame,
} from './ports';
import {
  hasDataDrivenPhases,
  nextPhase,
  nextPhaseFromPhases,
  ooiForPhase,
  phaseInputsFromRaw,
} from '../phase/phase-fsm';
import { buildScope } from '../rules/normalize';

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
  /** phase entry conditions from the published bundle (data-driven FSM) */
  phaseDefs: PhaseDef[];
  datarefs: DatarefDef[];

  setConnected: (v: boolean) => void;
  setPhaseDefs: (phases: PhaseDef[], datarefs: DatarefDef[]) => void;
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
  phaseDefs: [] as PhaseDef[],
  datarefs: [] as DatarefDef[],
};

export const useFlightStore = create<FlightState>((set) => ({
  ...initial,

  setConnected: (connected) => set({ connected }),

  setPhaseDefs: (phaseDefs, datarefs) => set({ phaseDefs, datarefs }),

  setFrame: (raw, nowIso) =>
    set((state) => {
      // Coerce scalar booleans to 0/1 so downstream (FSM, normalize, rules)
      // only ever sees number | number[].
      const values: Record<string, number | number[]> = { ...state.values };
      for (const [k, v] of Object.entries(raw)) {
        values[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
      }

      // Data-driven FSM when the bundle carries phase entry conditions;
      // otherwise the hardcoded Airbus ladder.
      const phase = hasDataDrivenPhases(state.phaseDefs)
        ? nextPhaseFromPhases(
            state.phaseDefs,
            buildScope(values, state.datarefs),
            state.phase,
          )
        : nextPhase(phaseInputsFromRaw(values), state.phase);

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

  // Reset flight state for a new run, but keep the loaded phase config.
  reset: () =>
    set((state) => ({
      ...initial,
      events: [],
      phaseDefs: state.phaseDefs,
      datarefs: state.datarefs,
    })),
}));
