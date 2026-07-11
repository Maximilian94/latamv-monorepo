import type { DatarefDef, Scalar } from '../core/ports';

/**
 * Turns raw dataref values (keyed by X-Plane dataref name) into the alias scope
 * the rule expressions read. Two sources feed it:
 *
 *  1. A fixed set of derived telemetry aliases (unit-converted to kt/ft) that
 *     every A320 procedure can rely on — the same three the admin "Testar"
 *     button and backend validation use.
 *  2. The published DatarefCatalog: each entry maps a real dataref name (with an
 *     optional array index) to the alias its rules reference.
 *
 * Missing datarefs resolve to 0 rather than throwing, so a partial frame still
 * evaluates deterministically.
 */

const MS_TO_KT = 1.94384;
const M_TO_FT = 1 / 0.3048;

type RawValues = Record<string, number | number[]>;

const num = (values: RawValues, key: string): number => {
  const v = values[key];
  return typeof v === 'number' ? v : 0;
};

/** Derived aliases available to every procedure regardless of catalog. */
function derivedScope(values: RawValues): Record<string, Scalar> {
  return {
    groundspeed_kt: +(num(values, 'sim/flightmodel2/position/groundspeed') * MS_TO_KT).toFixed(1),
    y_agl_ft: +(num(values, 'sim/flightmodel/position/y_agl') * M_TO_FT).toFixed(0),
    onground_any: num(values, 'sim/flightmodel/failures/onground_any'),
  };
}

/** Resolve one catalog entry's current scalar value from the raw frame. */
function resolveDataref(values: RawValues, d: DatarefDef): Scalar {
  const raw = values[d.datarefName];
  if (Array.isArray(raw)) {
    const i = d.arrayIndex ?? 0;
    return typeof raw[i] === 'number' ? raw[i] : 0;
  }
  return typeof raw === 'number' ? raw : 0;
}

export function buildScope(
  values: RawValues,
  datarefs: DatarefDef[],
): Record<string, Scalar> {
  const scope = derivedScope(values);
  for (const d of datarefs) {
    // Catalog aliases win over derived only if they collide (explicit config).
    scope[d.alias] = resolveDataref(values, d);
  }
  return scope;
}
