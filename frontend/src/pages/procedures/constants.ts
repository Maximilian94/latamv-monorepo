import type {
  ProcedureItemSource,
  ValidationRuleType,
  Verifiability,
} from '../../services/latam/procedures.service';

export const RULE_TYPES: {
  value: ValidationRuleType;
  label: string;
  desc: string;
}[] = [
  {
    value: 'SNAPSHOT',
    label: 'snapshot',
    desc: 'Checks on entering the phase / checkpoint',
  },
  {
    value: 'CONTINUOUS',
    label: 'continuous',
    desc: 'Constraint held throughout the phase',
  },
  {
    value: 'PRECONDITION',
    label: 'precondition',
    desc: 'On trigger, a condition must already hold',
  },
  {
    value: 'SEQUENCE',
    label: 'sequence',
    desc: 'Temporal order between two events',
  },
];

export const OPERATORS = ['>', '>=', '<', '<=', '==', '!='] as const;

export const VERIFIABILITY_OPTIONS: {
  value: Verifiability;
  label: string;
}[] = [
  { value: 'AUTO', label: 'AUTO' },
  { value: 'MANUAL', label: 'MANUAL' },
  { value: 'NOT_SIMULATED', label: 'NOT SIMULATED' },
];

export const SOURCE_OPTIONS: { value: ProcedureItemSource; label: string }[] = [
  { value: 'FCOM', label: 'FCOM' },
  { value: 'OPERATOR_POLICY', label: 'OPERATOR_POLICY' },
];

export interface SeverityMeta {
  label: string;
  short: 'std' | 'exc' | 'dev' | 'cmp';
  text: string;
  bg: string;
}

// Severity ids: 1 StandardCompliance, 2 ProactiveExcellence,
// 3 ProceduralDeviation, 4 SafetyCompromise.
export const SEVERITY_META: Record<number, SeverityMeta> = {
  1: { label: 'Standard compliance', short: 'std', text: 'text-green-500', bg: 'bg-green-50' },
  2: { label: 'Proactive excellence', short: 'exc', text: 'text-cyan-600', bg: 'bg-cyan-50' },
  3: { label: 'Procedural deviation', short: 'dev', text: 'text-yellow-500', bg: 'bg-yellow-50' },
  4: { label: 'Safety compromise', short: 'cmp', text: 'text-red-500', bg: 'bg-red-50' },
};

export const SEVERITY_OPTIONS = [1, 2, 3, 4];

// Simple "alias OP value" parsing for the guided builder comes from the shared
// canonical evaluator (single source of truth across backend/frontend/desktop).
export { parseSimpleExpr } from '../../lib/expr/expr-eval';
