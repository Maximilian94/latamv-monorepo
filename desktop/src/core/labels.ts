import type { PublishedBundle } from './ports';

/* ---- Phase names -------------------------------------------------------- */

const PHASE_LABELS: Record<string, string> = {
  'not-started': 'Waiting',
  cockpit_preparation: 'Cockpit preparation',
  'push-back_engine-start': 'Pushback & engine start',
  'after-start': 'After start',
  taxing: 'Taxi',
  'taking-off-starting': 'Takeoff — roll',
  'taking-off-after-80kt': 'Takeoff — 80 kt',
  'taking-off-lift-off': 'Lift-off',
  'taking-off-thrust-reduction': 'Thrust reduction',
  climb: 'Climb',
  cruise: 'Cruise',
  descent: 'Descent',
  approach: 'Approach',
  'landing-about-2000ft': 'Landing — 2000 ft',
  'landing-about-1000ft': 'Landing — 1000 ft',
  'touch-down': 'Touchdown',
  'go-around': 'Go-around',
  'taxi-out': 'Taxi to gate',
  parking: 'Parking',
  'securing-aircraft': 'Securing aircraft',
};

/** Human-friendly label for a phase code (falls back to a prettified code). */
export function phaseLabel(code: string): string {
  if (PHASE_LABELS[code]) return PHASE_LABELS[code];
  const pretty = code.replace(/[-_]+/g, ' ').trim();
  return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : code;
}

/** A glyph representing the broad stage of flight, for the phase card. */
export function phaseGlyph(code: string): string {
  if (code === 'not-started') return '○';
  if (code.startsWith('cockpit')) return '🛠';
  if (code.includes('push-back') || code.includes('start')) return '🔧';
  if (code === 'taxing') return '🛞';
  if (code.startsWith('taking-off') || code.includes('lift-off') || code.includes('thrust')) return '🛫';
  if (code === 'climb') return '📈';
  if (code === 'cruise') return '✈️';
  if (code === 'descent' || code === 'approach' || code.startsWith('landing') || code === 'touch-down') return '🛬';
  if (code === 'go-around') return '↻';
  if (code === 'taxi-out') return '🛞';
  if (code === 'parking' || code.startsWith('securing')) return '🅿';
  return '✈';
}

/* ---- Cities ------------------------------------------------------------- */

const CITIES: Record<string, string> = {
  SBGR: 'São Paulo–Guarulhos',
  SBSP: 'São Paulo–Congonhas',
  SBKP: 'Campinas',
  SBRJ: 'Rio–Santos Dumont',
  SBGL: 'Rio–Galeão',
  SBCF: 'Belo Horizonte',
  SBBR: 'Brasília',
  SBFL: 'Florianópolis',
  SBPA: 'Porto Alegre',
  SBCT: 'Curitiba',
  SBSV: 'Salvador',
  SBRF: 'Recife',
  SBFZ: 'Fortaleza',
  SBEG: 'Manaus',
  SBBE: 'Belém',
  SBGO: 'Goiânia',
  SBCY: 'Cuiabá',
  SBVT: 'Vitória',
  SBNF: 'Navegantes',
  SBLO: 'Londrina',
  SBMO: 'Maceió',
  SBSL: 'São Luís',
  SBJP: 'João Pessoa',
  SBNT: 'Natal',
  SBTE: 'Teresina',
  SBPV: 'Porto Velho',
  SBUL: 'Uberlândia',
  SBCG: 'Campo Grande',
  SBPS: 'Porto Seguro',
  SBIL: 'Ilhéus',
  SBAR: 'Aracaju',
  SBJV: 'Joinville',
  SBMG: 'Maringá',
  SCEL: 'Santiago',
  SAEZ: 'Buenos Aires–Ezeiza',
  SABE: 'Buenos Aires–Aeroparque',
  SPJC: 'Lima',
  SKBO: 'Bogotá',
  SUMU: 'Montevideo',
  SGAS: 'Asunción',
  SLLP: 'La Paz',
  SEQM: 'Quito',
};

/** City for an ICAO, or undefined when we don't have it mapped. */
export function cityName(icao: string): string | undefined {
  return CITIES[icao];
}

/** "Florianópolis → São Paulo–Congonhas" when both known, else undefined. */
export function routeCities(dep: string, arr: string): string | undefined {
  const a = cityName(dep);
  const b = cityName(arr);
  if (a && b) return `${a} → ${b}`;
  return undefined;
}

/* ---- Environment -------------------------------------------------------- */

export type EnvKind = { label: string; cls: 'prod' | 'local' | 'custom' };

/** Classify the backend URL so the login screen can show where you'll connect. */
export function environmentOf(baseUrl: string): EnvKind {
  const u = baseUrl.toLowerCase();
  if (u.includes('onrender.com') || u.includes('latamvirtual')) {
    return { label: 'Production', cls: 'prod' };
  }
  if (u.includes('localhost') || u.includes('127.0.0.1') || u.includes('0.0.0.0')) {
    return { label: 'Local', cls: 'local' };
  }
  return { label: 'Custom server', cls: 'custom' };
}

/* ---- Severity ----------------------------------------------------------- */

/** severityId → visual bucket. 1/2 are good, 3 is a deviation, 4 is critical. */
export function severityClass(severityId: number): 'good' | 'dev' | 'crit' {
  if (severityId === 4) return 'crit';
  if (severityId === 3) return 'dev';
  return 'good';
}

export function isGoodSeverity(severityId: number): boolean {
  return severityId === 1 || severityId === 2;
}

/** Score weight for a severity, from the bundle's scoring config. */
export function weightFor(severityId: number, v: PublishedBundle['version']): number {
  switch (severityId) {
    case 1:
      return v.weightStd;
    case 2:
      return v.weightExc;
    case 3:
      return v.weightDev;
    case 4:
      return v.weightCmp;
    default:
      return 0;
  }
}
