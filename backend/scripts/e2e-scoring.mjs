/**
 * End-to-end smoke test for the configurable flight-scoring loop (Fase 6).
 *
 * Proves, against a RUNNING backend + DB, the whole "config -> verify -> score
 * without deploy" chain that the desktop ACARS app drives:
 *
 *   1. Log in (POST /auth/login) and read the published A320 bundle
 *      (GET /procedures/published) — the same data the desktop consumes.
 *   2. Register FlightEvents over HTTP (POST /flight/:id/events) — the desktop's
 *      ingestion path — then review the flight (PATCH /flight/review/:id) and
 *      assert score = clamp(base + sum(count x weight)) with the counters.
 *   3. Attach a DIFFERENT scoring config (custom weights) to the same flight and
 *      re-review: the score changes with NO redeploy and NO code change — this
 *      is the whole point of making verification configurable via the site.
 *   4. Empty flight -> score = baseScore, no NaN (the finishExam bug we avoided).
 *
 * All test data (flight duty, flights, events, the throwaway version) is created
 * via Prisma and deleted in a finally block, so the DB is left as it was found.
 *
 * Run:  node backend/scripts/e2e-scoring.mjs   (backend must be up on :3000)
 */
import { PrismaClient } from '@prisma/client';

const BASE = process.env.E2E_BASE ?? 'http://localhost:3000';
const USER = process.env.E2E_USER ?? 'testadmin';
const PASS = process.env.E2E_PASS ?? 'Test@1234';
const MODEL = 'A320';
const REG = process.env.E2E_REG ?? 'PR-MAG'; // an existing A320 aircraft

const prisma = new PrismaClient();

// ---- tiny test harness ----
let passed = 0;
const failures = [];
function check(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failures.push(msg);
    console.log(`  ✗ ${msg}`);
  }
}

async function http(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return json;
}

const SEV = { 1: 'Std', 2: 'Exc', 3: 'Dev', 4: 'Cmp' };

/** Group event ids from the published tree by severity id. */
function eventIdsBySeverity(bundle) {
  const byId = { 1: [], 2: [], 3: [], 4: [] };
  for (const phase of bundle.phases)
    for (const sub of phase.subPhases)
      for (const item of sub.items)
        for (const ev of item.events)
          if (byId[ev.severityId]) byId[ev.severityId].push(ev.id);
  return byId;
}

/** clamp(base + sum(count x weight)) into [0, 100], rounded. */
function expectedScore(cfg, counts) {
  const raw =
    cfg.baseScore +
    counts.Std * cfg.weightStd +
    counts.Exc * cfg.weightExc +
    counts.Dev * cfg.weightDev +
    counts.Cmp * cfg.weightCmp;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

async function main() {
  const created = { dutyId: null, flightIds: [], versionId: null };
  try {
    // ---- 1. login + published bundle ----
    console.log('\n[1] login + published bundle');
    const auth = await http('POST', '/auth/login', {
      body: { emailOrUsername: USER, password: PASS },
    });
    const token = auth.authToken;
    check(!!token, 'login returned an authToken');

    const bundle = await http(
      'GET',
      `/procedures/published?aircraftModelCode=${MODEL}`,
      { token },
    );
    const cfg = bundle.version;
    check(
      cfg && cfg.aircraftModelCode === MODEL,
      `published ${MODEL} v${cfg?.version} resolved`,
    );
    console.log(
      `      weights: base=${cfg.baseScore} std=${cfg.weightStd} exc=${cfg.weightExc} dev=${cfg.weightDev} cmp=${cfg.weightCmp}`,
    );

    const ids = eventIdsBySeverity(bundle);
    check(
      ids[1].length >= 2 && ids[3].length >= 3 && ids[4].length >= 1,
      `enough distinct event ids (Std=${ids[1].length} Dev=${ids[3].length} Cmp=${ids[4].length})`,
    );

    // ---- create test flight duty + flight (resolves scoring via aircraft) ----
    const now = new Date();
    const duty = await prisma.flightDuty.create({
      data: {
        createdAt: now,
        expirationDate: new Date(now.getTime() + 86400000),
        userId: 1,
        aircraftRegistration: REG,
      },
    });
    created.dutyId = duty.id;

    const flight = await prisma.flight.create({
      data: {
        flightDutyId: duty.id,
        userId: 1,
        aircraftRegistration: REG, // -> Aircraft(A320) -> published v1
        aircraftModel: MODEL,
        index: 0,
        flightNumber: 'E2E999',
        departureIcao: 'SBGR',
        arrivalIcao: 'SBSP',
        eet: 60,
      },
    });
    created.flightIds.push(flight.id);

    // ---- 2. ingest events over HTTP, review, assert ----
    console.log('\n[2] POST events + review (weights from published A320 v1)');
    const counts = { Std: 2, Exc: 0, Dev: 3, Cmp: 1 };
    const events = [
      ...ids[1].slice(0, counts.Std),
      ...ids[3].slice(0, counts.Dev),
      ...ids[4].slice(0, counts.Cmp),
    ].map((eventId, i) => ({
      eventId,
      timestamp: new Date(now.getTime() + i * 1000).toISOString(),
      details: { source: 'e2e' },
    }));

    await http('POST', `/flight/${flight.id}/events`, { token, body: { events } });
    await http('PATCH', `/flight/review/${flight.id}`, { token });

    let f = await prisma.flight.findUnique({ where: { id: flight.id } });
    const exp1 = expectedScore(cfg, counts);
    check(f.score === exp1, `score = ${f.score} (expected ${exp1})`);
    check(f.amountOfStandardCompliance === counts.Std, `Std count = ${f.amountOfStandardCompliance}`);
    check(f.amountOfProceduralDeviation === counts.Dev, `Dev count = ${f.amountOfProceduralDeviation}`);
    check(f.amountOfSafetyCompromise === counts.Cmp, `Cmp count = ${f.amountOfSafetyCompromise}`);
    check(f.isReviewed === true, 'flight marked reviewed');

    // ---- 3. change the config (no deploy) -> score changes ----
    console.log('\n[3] attach custom scoring config, re-review (no redeploy)');
    const custom = {
      baseScore: 100,
      passingScore: 70,
      weightStd: 0,
      weightExc: 1,
      weightDev: -10,
      weightCmp: -20,
    };
    const version = await prisma.procedureVersion.create({
      data: { aircraftModelCode: MODEL, version: 999, status: 'DRAFT', ...custom },
    });
    created.versionId = version.id;
    await prisma.flight.update({
      where: { id: flight.id },
      data: { procedureVersionId: version.id },
    });
    await http('PATCH', `/flight/review/${flight.id}`, { token });
    f = await prisma.flight.findUnique({ where: { id: flight.id } });
    const exp2 = expectedScore(custom, counts);
    check(
      f.score === exp2 && exp2 !== exp1,
      `score changed to ${f.score} (expected ${exp2}, was ${exp1}) with same events`,
    );

    // ---- 4. empty flight -> baseScore, no NaN ----
    console.log('\n[4] empty flight -> baseScore, no NaN');
    const empty = await prisma.flight.create({
      data: {
        flightDutyId: duty.id,
        userId: 1,
        aircraftRegistration: REG,
        aircraftModel: MODEL,
        index: 1,
        flightNumber: 'E2E000',
        departureIcao: 'SBGR',
        arrivalIcao: 'SBSP',
        eet: 60,
      },
    });
    created.flightIds.push(empty.id);
    await http('PATCH', `/flight/review/${empty.id}`, { token });
    const fe = await prisma.flight.findUnique({ where: { id: empty.id } });
    check(fe.score === cfg.baseScore, `empty score = ${fe.score} (expected ${cfg.baseScore})`);
    check(Number.isInteger(fe.score), 'score is a real number (no NaN)');
  } finally {
    // ---- cleanup: children first (FK order) ----
    for (const fid of created.flightIds) {
      await prisma.flightEvent.deleteMany({ where: { flightId: fid } });
    }
    for (const fid of created.flightIds) {
      await prisma.flight.delete({ where: { id: fid } }).catch(() => {});
    }
    if (created.versionId) {
      await prisma.procedureVersion.delete({ where: { id: created.versionId } }).catch(() => {});
    }
    if (created.dutyId) {
      await prisma.flightDuty.delete({ where: { id: created.dutyId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log(`\n${'='.repeat(48)}`);
  if (failures.length === 0) {
    console.log(`ALL PASS — ${passed} checks green. Test data cleaned up.`);
  } else {
    console.log(`FAILURES (${failures.length}):`);
    for (const m of failures) console.log(`  ✗ ${m}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('\nE2E ERROR:', e.message);
  process.exitCode = 1;
});
