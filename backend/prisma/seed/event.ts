import { Event } from '@prisma/client';

interface EventBySeverity {
  severity: number;
  event: Event[];
}

interface Procedure {
  procedureName: string;
  eventsBySeverity: EventBySeverity[]; // Obrigatório, com os 4 níveis de severidade
}

interface Item {
  itemName: string;
  procedure: Procedure[];
}

interface SubPhase {
  subPhaseName: string;
  items: Item[];
}

interface Phase {
  phaseName: string;
  subPhases: SubPhase[];
}

// Dados com hierarquia consistente, tipados e eventsBySeverity em todos os procedimentos
const checkList: Phase[] = [
  {
    phaseName: 'Before Pushback or Start',
    subPhases: [
      {
        subPhaseName: 'AT START CLEARANCE',
        items: [
          {
            itemName: 'PUSHBACK/START UP CLEARANCE',
            procedure: [
              {
                procedureName: 'PUSHBACK/START CLEARANCE',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: '',
            procedure: [
              {
                procedureName: 'ATC',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'WINDOWS AND DOORS',
            procedure: [
              {
                procedureName: 'WINDOWS and DOORS',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'EXTERIOR LIGHTS',
            procedure: [
              {
                procedureName: '',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'THRUST LEVERS',
            procedure: [
              {
                procedureName: '',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'ACCU PRESSURE',
            procedure: [
              {
                procedureName: '',
                eventsBySeverity: [
                  {
                    severity: 1,
                    event: [
                      {
                        name: 'green band',
                        reference: '',
                        description: '',
                        id: 0,
                        severityId: 0,
                      },
                    ],
                  },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'PARKING BRAKE AND NOSEWHEEL STEERING',
            procedure: [
              {
                procedureName: '',
                eventsBySeverity: [
                  { severity: 1, event: [] },
                  { severity: 2, event: [] },
                  { severity: 3, event: [] },
                  { severity: 4, event: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// const eventSeed: Event[] = [
//   { id: 1000, name: '123', reference: '', description: '', severityId: '' },
// ];
