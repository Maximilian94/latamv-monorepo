import type { FlightPhase, OOOI, PhaseDef, Scalar } from '../core/ports';
import { evaluateExpr } from '../lib/expr/expr-eval';

/* Data-driven flight-phase selection.
 *
 * The published bundle carries a `PhaseDef` per phase with an `entryExpr`
 * (mini-DSL over dataref aliases). The flight is in the highest-`order` phase
 * whose entryExpr currently evaluates true. This replaced the hardcoded Airbus
 * (ToLiSS A320) decision ladder, now that every published phase carries its own
 * entry condition (see the seeded A320 versions). The datarefs the conditions
 * reference are part of the published catalog, so nothing here is aircraft- or
 * dataref-specific anymore. */

/**
 * The flight is in the highest-`order` phase whose `entryExpr` evaluates true
 * against the alias scope; if none match, the phase is left unchanged. Phases
 * with no entryExpr are checklist containers and are never selected.
 */
export function nextPhaseFromPhases(
  phases: PhaseDef[],
  scope: Record<string, Scalar>,
  prev: FlightPhase,
): FlightPhase {
  let best: { name: string; order: number } | null = null;
  for (const p of phases) {
    if (!p.entryExpr) continue;
    const r = evaluateExpr(p.entryExpr, scope);
    if (r.error || !r.result) continue;
    if (!best || p.order > best.order) best = { name: p.name, order: p.order };
  }
  return best ? (best.name as FlightPhase) : prev;
}

/** Which OOOI marker (if any) a transition INTO this phase stamps.
 *  Mirrors acars-v5: OUT@pushback, OFF@takeoff-start, ON@taxi-in (rollout),
 *  IN@parking. */
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
