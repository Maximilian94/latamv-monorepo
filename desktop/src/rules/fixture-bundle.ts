import type { PublishedBundle } from '../core/ports';

/**
 * A hand-authored A320 bundle used to exercise the rule engine WITHOUT the
 * backend or a login (M5 wires the real authenticated GET /procedures/published
 * in its place). It mirrors the exact published shape and carries one rule of
 * each of the two MVP strategies so the mock/replay flight visibly fires events:
 *
 *  - CONTINUOUS: taxi over-speed — groundspeed above 30 kt for >1.5 s while taxiing.
 *  - SNAPSHOT:   touchdown recorded — onground becomes true in the touch-down phase.
 *
 * The `phase` field on each rule holds a FlightPhase id (see core/ports), so the
 * engine matches it directly against the FSM's current phase.
 */
export const FIXTURE_BUNDLE: PublishedBundle = {
  version: {
    id: 0,
    aircraftModelCode: 'A320',
    version: 1,
    baseScore: 100,
    passingScore: 70,
    weightStd: 0,
    weightExc: 1,
    weightDev: -5,
    weightCmp: -15,
  },
  datarefs: [],
  phases: [
    {
      id: 1,
      name: 'Taxi',
      order: 40,
      subPhases: [
        {
          id: 10,
          name: 'Taxi out',
          items: [
            {
              id: 100,
              name: 'Taxi speed control',
              verifiability: 'AUTO',
              events: [
                {
                  id: 'TAXI_OVERSPEED',
                  name: 'Taxi speed exceeded 30 kt',
                  severityId: 3, // ProceduralDeviation
                  validationRules: [
                    {
                      id: 1,
                      eventId: 'TAXI_OVERSPEED',
                      type: 'CONTINUOUS',
                      phase: 'taxing',
                      aliases: ['groundspeed_kt', 'onground_any'],
                      expr: 'groundspeed_kt > 30 && onground_any == 1',
                      params: { graceMs: 1500 },
                      details: ['groundspeed_kt'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Landing',
      order: 150,
      subPhases: [
        {
          id: 20,
          name: 'Touchdown',
          items: [
            {
              id: 200,
              name: 'Touchdown recorded',
              verifiability: 'AUTO',
              events: [
                {
                  id: 'TOUCHDOWN',
                  name: 'Main gear touchdown',
                  severityId: 1, // StandardCompliance
                  validationRules: [
                    {
                      id: 2,
                      eventId: 'TOUCHDOWN',
                      type: 'SNAPSHOT',
                      phase: 'touch-down',
                      aliases: ['onground_any'],
                      expr: 'onground_any == 1',
                      params: null,
                      details: ['groundspeed_kt'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
