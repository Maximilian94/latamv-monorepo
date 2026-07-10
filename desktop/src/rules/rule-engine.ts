import { evaluateExpr } from '../lib/expr/expr-eval';
import type {
  DetectedEvent,
  FlightPhase,
  PublishedBundle,
  RuleDef,
  Scalar,
} from '../core/ports';

/**
 * Data-driven rule engine. It consumes a published procedure bundle (the exact
 * shape served by GET /procedures/published), flattens every ValidationRule out
 * of the phase tree, and evaluates them against each frame using the SAME
 * canonical evaluator the backend and admin "Testar" button use.
 *
 * Each rule type has its own trigger semantics, but all share one evaluator:
 *
 *  - SNAPSHOT     fires on the rising edge (false -> true) of `expr`, only while
 *                 the flight is in the rule's `phase`. One event per rising edge.
 *  - CONTINUOUS   fires once when `expr` has held true for at least `graceMs`
 *                 continuously within the rule's `phase`. The timer resets when
 *                 `expr` goes false or the phase changes. (e.g. taxi over-speed.)
 *  - PRECONDITION checked once on entry into the rule's `phase`; fires if `expr`
 *                 is FALSE (a required condition was not met). (e.g. flaps set
 *                 before takeoff.)
 *  - SEQUENCE     fires on the rising edge of `expr` while in `phase`, but only
 *                 after every rule listed earlier in the same phase has already
 *                 fired this flight (ordering check). MVP: order = catalog order.
 *
 * The engine is pure w.r.t. wall-clock: the caller passes `t` (monotonic ms) and
 * `nowIso` per frame, so it can be driven identically by live X-Plane, the mock
 * source, or a recorded replay.
 */

interface RuleState {
  /** last truthiness, for rising-edge detection */
  wasTrue: boolean;
  /** timestamp (ms) `expr` first became true in the current phase, or null */
  trueSince: number | null;
  /** phase we last saw this rule evaluated in (to detect phase entry) */
  lastPhase: FlightPhase | null;
  /** already fired this flight (SEQUENCE ordering / dedupe of one-shots) */
  fired: boolean;
}

interface FlatRule {
  rule: RuleDef;
  /** 0-based order of this rule within its phase (for SEQUENCE) */
  phaseOrder: number;
}

export interface EngineFrame {
  t: number;
  nowIso: string;
  phase: FlightPhase;
  scope: Record<string, Scalar>;
}

const freshState = (): RuleState => ({
  wasTrue: false,
  trueSince: null,
  lastPhase: null,
  fired: false,
});

export class RuleEngine {
  private rules: FlatRule[] = [];
  private state = new Map<number, RuleState>();

  constructor(bundle?: PublishedBundle) {
    if (bundle) this.load(bundle);
  }

  /** (Re)load the published bundle and reset all per-rule state. */
  load(bundle: PublishedBundle): void {
    this.rules = flattenRules(bundle);
    this.state = new Map(this.rules.map((r) => [r.rule.id, freshState()]));
  }

  /** Reset runtime state without discarding the loaded rules (new flight). */
  reset(): void {
    for (const r of this.rules) this.state.set(r.rule.id, freshState());
  }

  get ruleCount(): number {
    return this.rules.length;
  }

  /** Evaluate all rules against one frame; return any events detected now. */
  onFrame(frame: EngineFrame): DetectedEvent[] {
    const detected: DetectedEvent[] = [];
    for (const flat of this.rules) {
      const evt = this.evaluateRule(flat, frame);
      if (evt) detected.push(evt);
    }
    return detected;
  }

  private evaluateRule(flat: FlatRule, frame: EngineFrame): DetectedEvent | null {
    const { rule } = flat;
    const st = this.state.get(rule.id)!;
    const inPhase = !rule.phase || rule.phase === frame.phase;
    const enteredPhase = st.lastPhase !== frame.phase;
    st.lastPhase = frame.phase;

    // Leaving the phase clears any in-progress CONTINUOUS timer / edge latch.
    if (!inPhase) {
      st.wasTrue = false;
      st.trueSince = null;
      return null;
    }

    const res = evaluateExpr(rule.expr, frame.scope);
    if (res.error) return null; // published rules are pre-validated; skip noise
    const isTrue = res.result;

    let fire = false;
    switch (rule.type) {
      case 'SNAPSHOT': {
        fire = isTrue && !st.wasTrue;
        break;
      }
      case 'CONTINUOUS': {
        const graceMs = rule.params?.graceMs ?? 0;
        if (isTrue) {
          if (st.trueSince === null) st.trueSince = frame.t;
          if (!st.fired && frame.t - st.trueSince >= graceMs) fire = true;
        } else {
          st.trueSince = null;
        }
        break;
      }
      case 'PRECONDITION': {
        // Checked once on entry into the phase: fire if the condition is unmet.
        if (enteredPhase && !st.fired) fire = !isTrue;
        break;
      }
      case 'SEQUENCE': {
        const priorPending = this.rules.some(
          (o) =>
            o.rule.phase === rule.phase &&
            o.phaseOrder < flat.phaseOrder &&
            !this.state.get(o.rule.id)!.fired,
        );
        fire = isTrue && !st.wasTrue && !priorPending;
        break;
      }
    }

    st.wasTrue = isTrue;
    if (!fire) return null;

    st.fired = true;
    return {
      eventId: rule.eventId,
      timestamp: frame.nowIso,
      details: pickDetails(rule, res.resolved),
    };
  }
}

/** Flatten every rule out of the phase tree, tagging its order within its phase. */
function flattenRules(bundle: PublishedBundle): FlatRule[] {
  const out: FlatRule[] = [];
  const perPhaseCount = new Map<string, number>();
  for (const phase of bundle.phases) {
    for (const sub of phase.subPhases) {
      for (const item of sub.items) {
        for (const event of item.events) {
          for (const rule of event.validationRules) {
            const key = rule.phase ?? '';
            const order = perPhaseCount.get(key) ?? 0;
            perPhaseCount.set(key, order + 1);
            out.push({ rule, phaseOrder: order });
          }
        }
      }
    }
  }
  return out;
}

/** Keep only the resolved variables the rule flagged as `details`, as scalars. */
function pickDetails(
  rule: RuleDef,
  resolved: Record<string, Scalar | undefined>,
): Record<string, Scalar> | undefined {
  if (!rule.details?.length) return undefined;
  const out: Record<string, Scalar> = {};
  for (const key of rule.details) {
    const v = resolved[key];
    if (v !== undefined) out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
