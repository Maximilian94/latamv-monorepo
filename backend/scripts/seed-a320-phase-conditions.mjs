/**
 * Seeds the A320 flight-phase entry conditions (the data-driven FSM) into the
 * A320 DRAFT, transcribed 1:1 from the hardcoded acars-v5 / desktop phase ladder.
 *
 * Each phase gets an `entryExpr` over catalog aliases: the flight is in the
 * highest-`order` phase whose entryExpr is true; if none match, the phase is
 * unchanged. Phases with no entryExpr stay checklist containers.
 *
 * Idempotent: matches existing phases case-insensitively by name, so the old
 * COCKPIT_PREPARATION is renamed/updated to canonical `cockpit_preparation`
 * (keeping its checklist), and re-runs update rather than duplicate.
 *
 * Run (backend up, Prisma client regenerated with entryExpr):
 *   node backend/scripts/seed-a320-phase-conditions.mjs
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:3000';

async function http(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return json;
}

// name, order, entryExpr  (canonical FlightPhase names the desktop FSM uses)
const PHASES = [
  ['cockpit_preparation', 10, 'qpac_phase == 1'],
  ['push-back_engine-start', 20, 'qpac_phase == 1 && eng_mode == 2 && (eng1_master == 1 || eng2_master == 1)'],
  ['after-start', 30, 'qpac_phase == 2 && eng_mode == 1'],
  ['taxing', 40, 'qpac_phase == 3'],
  ['taking-off-starting', 50, 'qpac_phase == 4'],
  ['taking-off-after-80kt', 60, 'qpac_phase == 5'],
  ['taking-off-lift-off', 70, 'ap_phase == 1 && qpac_phase == 6'],
  ['taking-off-thrust-reduction', 80, 'ap_phase == 2 && qpac_phase == 7'],
  ['climb', 90, 'ap_phase == 2 && qpac_phase == 8'],
  ['cruise', 100, 'ap_phase == 3'],
  ['descent', 110, 'ap_phase == 4'],
  ['approach', 120, 'ap_phase == 5 && qpac_phase == 8'],
  ['landing-about-2000ft', 130, 'qpac_phase == 9'],
  ['landing-about-1000ft', 140, 'qpac_phase == 10'],
  ['touch-down', 150, 'qpac_phase == 11'],
  ['taxi-out', 160, 'qpac_phase == 13 && (eng1_master == 1 || eng2_master == 1)'],
  ['parking', 170, 'qpac_phase == 13 && eng1_master == 0 && eng2_master == 0'],
];

async function main() {
  const { authToken: token } = await http('POST', '/auth/login', {
    body: { emailOrUsername: 'testadmin', password: 'Test@1234' },
  });

  const versions = await http('GET', '/procedures/versions?aircraftModelCode=A320', { token });
  const draft = versions.find((v) => v.status === 'DRAFT');
  if (!draft) throw new Error('No A320 DRAFT found — run the rules seed first.');

  const tree = await http('GET', `/procedures/versions/${draft.id}`, { token });
  const byName = {};
  for (const p of tree.phases) byName[p.name.toUpperCase()] = p;

  let created = 0, updated = 0;
  for (const [name, order, entryExpr] of PHASES) {
    const existing = byName[name.toUpperCase()];
    if (existing) {
      await http('PATCH', `/procedures/phases/${existing.id}`, { token, body: { name, order, entryExpr } });
      updated++;
    } else {
      await http('POST', '/procedures/phases', {
        token, body: { procedureVersionId: draft.id, name, order, entryExpr },
      });
      created++;
    }
  }

  console.log(`Draft ${draft.id}: phase conditions +${created} created, ~${updated} updated (${PHASES.length} total).`);
  console.log(`Review/publish in the panel: /admin/procedures/${draft.id}`);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exitCode = 1; });
