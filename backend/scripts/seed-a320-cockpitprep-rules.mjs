/**
 * Writes the confirmed Cockpit Preparation validation rules into a fresh A320
 * DRAFT, transcribed from the proven acars-v5 FOQA checks.
 *
 * Model: each checklist item has a compliance (Std) event and a deviation
 * (Dev/Cmp) event. Rules are PRECONDITION armed in the phase entered right after
 * cockpit prep (`push-back_engine-start`), so they evaluate ONCE, at the moment
 * cockpit prep ends — matching acars-v5's snapshot. PRECONDITION fires its event
 * when its expr is FALSE, so:
 *   - deviation event  <- expr = compliance condition  (fires when NOT correct)
 *   - compliance event <- expr = deviation  condition  (fires when NOT wrong)
 * Exactly one of the pair fires. Deviations carry the penalty; compliances are
 * score-neutral (weightStd=0) but record "did it right".
 *
 * Re-runnable: deletes existing A320 drafts first, then clones a fresh one.
 * Run:  node backend/scripts/seed-a320-cockpitprep-rules.mjs   (backend up on :3000)
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:3000';
const AFTER_PHASE = 'push-back_engine-start'; // armed when cockpit prep ends

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

// severity ids: 1=Std 2=Exc 3=Dev 4=Cmp
// Each entry: [subPhase, item, complianceExpr, deviationExpr, aliases,
//              devSev, devOrd, stdOrd]
const CHECKS = [
  ['OVERHEAD_PANEL', 'AUDIO_SWITCHING_PANEL',
    'audio_switching == 0', 'audio_switching != 0', ['audio_switching'], 3, 0, 0],
  ['OVERHEAD_PANEL', 'VENT',
    'vent_blower == 0 && vent_extract == 0 && vent_cabinfan == 1',
    'vent_blower != 0 || vent_extract != 0 || vent_cabinfan != 1',
    ['vent_blower', 'vent_extract', 'vent_cabinfan'], 3, 0, 0],
  ['CTR_INSTRUMENT_PANEL', 'NOSEWHEEL_STEERING',
    'nws_antiskid == 1', 'nws_antiskid != 1', ['nws_antiskid'], 4, 0, 0],
  ['PEDESTAL', 'SWITCHING_PANEL',
    'switching_attitude == 0 && switching_airdata == 0 && switching_dmc == 0 && switching_ecamnd == 0',
    'switching_attitude != 0 || switching_airdata != 0 || switching_dmc != 0 || switching_ecamnd != 0',
    ['switching_attitude', 'switching_airdata', 'switching_dmc', 'switching_ecamnd'], 4, 0, 0],
  ['RMP', 'RMP', 'rmp1_switch == 1', 'rmp1_switch != 1', ['rmp1_switch'], 3, 0, 0],
  ['RMP', 'GREEN_NAV_LIGHT', 'rmp1_nav_light == 0', 'rmp1_nav_light != 0', ['rmp1_nav_light'], 3, 0, 0],
  ['RMP', 'SEL_LIGHT', 'rmp1_sel_light == 0', 'rmp1_sel_light != 0', ['rmp1_sel_light'], 4, 0, 0],
  ['GLARESHIELD', 'EFIS_CONTROL_PANEL',
    'fd1 == 1 && fd2 == 1', 'fd1 != 1 || fd2 != 1', ['fd1', 'fd2'], 3, 0, 0],
  // FCU holds three checks: SPD (std0/dev0), HDG (std1/dev1), ALT (std2/cmp0)
  ['GLARESHIELD', 'FCU', 'fcu_spd_dashed == 1', 'fcu_spd_dashed != 1', ['fcu_spd_dashed'], 3, 0, 0],
  ['GLARESHIELD', 'FCU', 'fcu_hdgtrk_mode == 0', 'fcu_hdgtrk_mode != 0', ['fcu_hdgtrk_mode'], 3, 1, 1],
  ['GLARESHIELD', 'FCU',
    'fcu_alt >= alt_indicated_ft + 1000', 'fcu_alt < alt_indicated_ft + 1000',
    ['fcu_alt', 'alt_indicated_ft'], 4, 0, 2],
  ['INSTRUMENT_PANELS', 'PFD_AND_ND_BRIGHTNESS_KNOB',
    'nd_outer_ring == 270', 'nd_outer_ring != 270', ['nd_outer_ring'], 3, 0, 0],
  ['INSTRUMENT_PANELS', 'LOUDSPEAKER_KNOB',
    'loudspeaker_knob >= 0.5 && loudspeaker_knob <= 0.8',
    'loudspeaker_knob < 0.5 || loudspeaker_knob > 0.8', ['loudspeaker_knob'], 3, 0, 0],
  ['INSTRUMENT_PANELS', 'PFD',
    'pfd_image_idx == 0 && nd_image_idx == 1', 'pfd_image_idx != 0 || nd_image_idx != 1',
    ['pfd_image_idx', 'nd_image_idx'], 4, 0, 0],
  ['ECAM_CONTROL_PANEL', 'CHECK_PRESSURE_PAGE',
    'ecam_press_pb == 1', 'ecam_press_pb != 1', ['ecam_press_pb'], 3, 0, 0],
  ['ECAM_CONTROL_PANEL', 'CHECK_STATUS_PAGE',
    'ecam_status_pb == 1', 'ecam_status_pb != 1', ['ecam_status_pb'], 3, 0, 0],
  // IRS_ALIGN holds two checks: align (std0/cmp0), ADIRUs (std1/cmp1)
  ['ADIRS', 'IRS_ALIGN', 'adirs_time_to_align == 0', 'adirs_time_to_align != 0', ['adirs_time_to_align'], 4, 0, 0],
  ['ADIRS', 'IRS_ALIGN',
    'adiru1_mode == 1 && adiru2_mode == 1 && adiru3_mode == 1',
    'adiru1_mode != 1 || adiru2_mode != 1 || adiru3_mode != 1',
    ['adiru1_mode', 'adiru2_mode', 'adiru3_mode'], 4, 1, 1],
];

function indexTree(tree) {
  const idx = {};
  const phase = tree.phases.find((p) => p.name === 'COCKPIT_PREPARATION');
  for (const sp of phase.subPhases) {
    for (const it of sp.items) {
      // events grouped by severity, ordered by id (== creation seq)
      const bySev = {};
      for (const ev of [...it.events].sort((a, b) => a.id.localeCompare(b.id))) {
        (bySev[ev.severityId] ??= []).push(ev);
      }
      idx[`${sp.name}/${it.name}`] = bySev;
    }
  }
  return idx;
}

async function main() {
  const { authToken: token } = await http('POST', '/auth/login', {
    body: { emailOrUsername: 'testadmin', password: 'Test@1234' },
  });

  const versions = await http('GET', '/procedures/versions?aircraftModelCode=A320', { token });
  const published = versions.find((v) => v.status === 'PUBLISHED');
  if (!published) throw new Error('No PUBLISHED A320 version found');

  // clean slate: drop existing drafts
  for (const v of versions.filter((v) => v.status === 'DRAFT')) {
    await http('DELETE', `/procedures/versions/${v.id}`, { token });
    console.log(`deleted stale draft v${v.version} (id ${v.id})`);
  }

  const draft = await http('POST', `/procedures/versions/${published.id}/new-draft`, { token });
  console.log(`created draft v${draft.version} (id ${draft.id}) from published v${published.version}`);

  const idx = indexTree(draft);

  let made = 0;
  const missing = [];
  for (const [sp, item, compExpr, devExpr, aliases, devSev, devOrd, stdOrd] of CHECKS) {
    const bySev = idx[`${sp}/${item}`];
    if (!bySev) { missing.push(`${sp}/${item} (item not found)`); continue; }

    const devEvent = bySev[devSev]?.[devOrd];
    const stdEvent = bySev[1]?.[stdOrd];

    if (devEvent) {
      await http('POST', '/procedures/rules', {
        token,
        body: { eventId: devEvent.id, type: 'PRECONDITION', phase: AFTER_PHASE, aliases, expr: compExpr, details: aliases },
      });
      made++;
    } else missing.push(`${sp}/${item} dev sev=${devSev} ord=${devOrd}`);

    if (stdEvent) {
      await http('POST', '/procedures/rules', {
        token,
        body: { eventId: stdEvent.id, type: 'PRECONDITION', phase: AFTER_PHASE, aliases, expr: devExpr },
      });
      made++;
    } else missing.push(`${sp}/${item} std ord=${stdOrd}`);
  }

  console.log(`\nCreated ${made} rules across ${CHECKS.length} checks on draft ${draft.id}.`);
  if (missing.length) console.log('Unmatched:', missing.join(' | '));
  console.log(`\nReview in the panel: /admin/procedures/${draft.id} — then publish when happy.`);
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exitCode = 1; });
