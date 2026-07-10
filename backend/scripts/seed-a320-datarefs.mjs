/**
 * Seeds the A320-ToLiss dataref catalog from the real datarefs mined out of the
 * proven acars-v5 FOQA checks (they already ran against ToLiss in X-Plane).
 *
 * Idempotent: upserts the AircraftPackage by `code` and each dataref by the
 * (packageId, alias) unique key, so it is safe to re-run. Datarefs belong to the
 * package (not to a procedure version), so they show up in the rule builder for
 * every A320 version immediately — no republish needed.
 *
 * Run:  node backend/scripts/seed-a320-datarefs.mjs
 *
 * Source of truth: acars-v5 .../checks/cockpit-preparation/*.ts and
 * .../before-pushback-or-start/*.ts + flight-phase-manager.service.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PACKAGE = {
  code: 'A320-ToLiss',
  model: 'A320',
  author: 'LATAM Virtual',
  description: 'ToLiss A320neo datarefs (X-Plane Web API), mined from acars-v5 FOQA checks.',
};

// alias, datarefName, valueType, arrayIndex (null = scalar), unit, description(+target)
const DATAREFS = [
  // ---- Phase / telemetry (used by FSM + rules everywhere) ----
  ['qpac_phase', 'AirbusFBW/QPACFlightPhase', 'int', null, null, 'QPAC flight phase (1..13)'],
  ['ap_phase', 'AirbusFBW/APPhase', 'int', null, null, 'Autopilot/flight phase'],
  ['groundspeed_ms', 'sim/flightmodel2/position/groundspeed', 'float', null, 'm/s', 'Ground speed (m/s)'],
  ['eng_n1', 'AirbusFBW/anim/ENGN1Speed', 'float', null, '%', 'Engine N1 (animation)'],
  ['flap_ratio', 'sim/cockpit2/controls/flap_ratio', 'float', null, null, 'Flap position ratio 0..1'],
  ['y_agl_m', 'sim/flightmodel/position/y_agl', 'float', null, 'm', 'Height above ground (m)'],
  ['pressure_alt_ft', 'sim/flightmodel2/position/pressure_altitude', 'float', null, 'ft', 'Pressure altitude'],
  ['alt_indicated_ft', 'sim/cockpit2/gauges/indicators/altitude_ft_pilot', 'float', null, 'ft', 'Indicated altitude (pilot)'],

  // ---- Overhead: ENG masters / mode (also FSM) ----
  ['eng1_master', 'AirbusFBW/ENG1MasterSwitch', 'int', null, null, 'ENG 1 master. Target OFF=0 at cockpit prep'],
  ['eng2_master', 'AirbusFBW/ENG2MasterSwitch', 'int', null, null, 'ENG 2 master. Target OFF=0'],
  ['eng_mode', 'AirbusFBW/ENGModeSwitch', 'int', null, null, 'ENG mode selector. NORM=1 (IGN/START=2)'],

  // ---- Overhead: VENT ----
  ['vent_blower', 'AirbusFBW/BlowerSwitch', 'int', null, null, 'VENT blower. Target OFF=0'],
  ['vent_extract', 'AirbusFBW/ExtractSwitch', 'int', null, null, 'VENT extract. Target OFF=0'],
  ['vent_cabinfan', 'AirbusFBW/CabinFanSwitch', 'int', null, null, 'Cabin fan. Target 1'],
  ['audio_switching', 'AirbusFBW/AudioSwitching', 'int', null, null, 'AUDIO SWITCHING selector. Target NORM=0'],

  // ---- Overhead: exterior lights (from acars-v5 exterior-lights check) ----
  ['beacon_light', 'ckpt/oh/beaconLight/anim', 'float', null, null, 'BEACON. Target OFF at cockpit prep (0)'],
  ['strobe_light', 'ckpt/oh/strobeLight/anim', 'float', null, null, 'STROBE. AUTO/position'],

  // ---- Overhead: third-occupant PA ----
  ['pa3_volume', 'ckpt/oh/pa/3/anim', 'float', null, null, 'Third occupant PA volume. Target > 0 (RECEPT)'],

  // ---- Center instrument panel ----
  ['nws_antiskid', 'AirbusFBW/NWSnAntiSkid', 'int', null, null, 'A/SKID & N/W STRG. Target ON=1'],

  // ---- Pedestal: switching panel ----
  ['switching_attitude', 'AirbusFBW/AttitudeSwitching', 'int', null, null, 'ATT switching. Target NORM=0'],
  ['switching_airdata', 'AirbusFBW/AirDataSwitching', 'int', null, null, 'AIR DATA switching. Target NORM=0'],
  ['switching_dmc', 'AirbusFBW/DMCSwitching', 'int', null, null, 'DMC switching. Target NORM=0'],
  ['switching_ecamnd', 'AirbusFBW/ECAMNDSwitching', 'int', null, null, 'ECAM/ND switching. Target NORM=0'],

  // ---- Pedestal: thrust / parking / accu ----
  ['throttle_left', 'ckpt/throttleLeft/anim', 'float', null, null, 'Left thrust lever. Target IDLE'],
  ['throttle_right', 'ckpt/throttleRight/anim', 'float', null, null, 'Right thrust lever. Target IDLE'],
  ['park_brake', 'AirbusFBW/ParkBrake', 'int', null, null, 'PARK BRK. Target ON=1'],
  ['brake_accu', 'AirbusFBW/BrakeAccu', 'float', null, null, 'Brake accumulator pressure (green band)'],

  // ---- Pedestal: RMP (array lights) ----
  ['rmp1_switch', 'AirbusFBW/RMP1Switch', 'int', null, null, 'RMP1. Target ON=1'],
  ['rmp1_nav_light', 'AirbusFBW/RMP1Lights', 'int', 13, null, 'RMP1 green NAV light [idx 13]. Target OFF=0'],
  ['rmp1_sel_light', 'AirbusFBW/RMP1Lights', 'int', 12, null, 'RMP1 SEL light [idx 12]. Target OFF=0'],

  // ---- Glareshield: EFIS / FCU ----
  ['fcu_spd_dashed', 'AirbusFBW/SPDdashed', 'int', null, null, 'FCU SPD window. Target DASHED=1'],
  ['fcu_hdgtrk_mode', 'AirbusFBW/HDGTRKmode', 'int', null, null, 'HDG-V/S / TRK-FPA. Target HDG V/S=0'],
  ['fd1', 'AirbusFBW/FD1Engage', 'int', null, null, 'Flight Director CM1. Target ON=1'],
  ['fd2', 'AirbusFBW/FD2Engage', 'int', null, null, 'Flight Director CM2. Target ON=1'],
  ['fcu_alt', 'sim/cockpit/autopilot/altitude', 'float', null, 'ft', 'FCU ALT window. Target >= airport alt + 1000'],

  // ---- ADIRS ----
  ['adirs_time_to_align', 'AirbusFBW/TimeToAlign', 'float', null, 's', 'IRS time to align. Target 0 (aligned)'],
  ['adiru1_mode', 'AirbusFBW/ADIRUSwitchArray', 'int', 0, null, 'ADIRU 1 mode [idx 0]. Target NAV=1'],
  ['adiru2_mode', 'AirbusFBW/ADIRUSwitchArray', 'int', 1, null, 'ADIRU 2 mode [idx 1]. Target NAV=1'],
  ['adiru3_mode', 'AirbusFBW/ADIRUSwitchArray', 'int', 2, null, 'ADIRU 3 mode [idx 2]. Target NAV=1'],

  // ---- ECAM control panel (momentary pb) ----
  ['ecam_press_pb', 'AirbusFBW/SDPRESS', 'int', null, null, 'ECAM PRESS pb. Pressed during cockpit prep=1'],
  ['ecam_status_pb', 'AirbusFBW/SDSTATUS', 'int', null, null, 'ECAM STS pb. Pressed during cockpit prep=1'],

  // ---- Instrument panels ----
  ['nd_outer_ring', 'ckpt/lights/ndOuterLeft/anim', 'float', null, 'deg', 'ND outer ring brightness. Target 270 (5 o clock)'],
  ['loudspeaker_knob', 'AirbusFBW/AuralVolume', 'float', null, null, 'Loudspeaker volume. Target 0.5..0.8'],
  ['pfd_image_idx', 'AirbusFBW/ImageIndexArray', 'int', 0, null, 'PFD source [idx 0]. Target 0 (not transferred)'],
  ['nd_image_idx', 'AirbusFBW/ImageIndexArray', 'int', 1, null, 'ND source [idx 1]. Target 1 (not transferred)'],

  // ---- Before pushback / doors / power (useful for later phases) ----
  ['ext_power', 'AirbusFBW/EnableExternalPower', 'int', null, null, 'External power enabled'],
  ['slides_armed', 'AirbusFBW/SlideArmedArray', 'int', 0, null, 'Door slide armed [idx 0]'],
  ['cvr_gnd_ctrl', 'AirbusFBW/CvrGndCtrl', 'int', null, null, 'RCDR GND CTL. Target ON=1'],
];

async function main() {
  const pkg = await prisma.aircraftPackage.upsert({
    where: { code: PACKAGE.code },
    update: { model: PACKAGE.model, author: PACKAGE.author, description: PACKAGE.description },
    create: PACKAGE,
  });

  let created = 0;
  let updated = 0;
  for (const [alias, datarefName, valueType, arrayIndex, unit, description] of DATAREFS) {
    const existing = await prisma.datarefCatalog.findUnique({
      where: { packageId_alias: { packageId: pkg.id, alias } },
    });
    const data = { datarefName, valueType, arrayIndex, unit, description };
    if (existing) {
      await prisma.datarefCatalog.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.datarefCatalog.create({ data: { packageId: pkg.id, alias, ...data } });
      created++;
    }
  }

  const total = await prisma.datarefCatalog.count({ where: { packageId: pkg.id } });
  console.log(`Package ${pkg.code} (id=${pkg.id})`);
  console.log(`Datarefs: +${created} created, ~${updated} updated, ${total} total in package.`);
}

main()
  .catch((e) => {
    console.error('SEED ERROR:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
