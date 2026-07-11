/** Great-circle distance between two lat/lon points, in nautical miles. */
export function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R_NM = 3440.065; // Earth radius in nautical miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Normalise a tail/model string for tolerant comparison: upper, alnum only. */
export function normalizeAircraftId(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Type-code aliases that belong to the same airframe family. Add-ons often
// report the ICAO variant (A20N) or a description ("Airbus A320neo") rather
// than the plain model code the VA stores ("A320").
const FAMILIES: string[][] = [
  ['A318', 'A319', 'A320', 'A321', 'A18N', 'A19N', 'A20N', 'A21N'],
  ['B737', 'B738', 'B739', 'B38M', 'B39M', '73G', '738'],
];

/**
 * Does the aircraft loaded in the sim match the flight's assigned model?
 * We look at every string the sim gives us (ICAO type + description) and accept
 * a match if it mentions the expected model or any member of its family — so an
 * "A320" flight is satisfied by an A320neo (A20N) without exact-tail games.
 */
export function matchesAircraftModel(
  simStrings: string[],
  expectedModel: string,
): boolean {
  const hay = normalizeAircraftId(simStrings.join(' '));
  const want = normalizeAircraftId(expectedModel);
  if (!hay || !want) return false;
  if (hay.includes(want)) return true;
  const family = FAMILIES.find((f) => f.includes(want) || f.some((c) => want.includes(c)));
  return family ? family.some((c) => hay.includes(c)) : false;
}
