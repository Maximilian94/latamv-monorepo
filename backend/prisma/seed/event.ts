// event.ts (ou src/utils/generateChecklist.ts)

// --- Imports needed for THIS SCRIPT (event.ts) to run ---
import * as fs from 'fs';
import * as path from 'path';
import { SeverityId } from './severity'; // Importar SeverityId (certifique-se de que o caminho está correto)
import {
  ACCU_PRESSURE,
  ELEC,
  EXTERIOR_LIGHTS_BEACON,
  SLIDES,
  THRUST_LEVERS,
  WINDOWS_AND_DOORS,
} from './eventDescription/beforePushbackOrStart';
import { ADIRS, PRESS_PB, STS_PB } from './eventDescription/cockpitPreparation'; // Importar ACCU_PRESSURE (certifique-se de que o caminho está correto)

// --- Interfaces for the INPUT DATA structure (que este script vai ler) ---
interface EventToCreateInput {
  name: string;
  reference: string;
  description: string;
}

interface ProcedureInput {
  eventsBySeverity: Array<{
    severity: SeverityId;
    event: EventToCreateInput[];
  }>;
}

interface ItemInput {
  itemName: string;
  procedure: ProcedureInput[];
}

interface SubPhaseInput {
  subPhaseName: string;
  items: ItemInput[];
}

interface PhaseInput {
  phaseName: string;
  subPhases: SubPhaseInput[];
}

// --- Data with resolved descriptions (sua estrutura de dados atual) ---
const initialCheckList: PhaseInput[] = [
  {
    phaseName: 'Cockpit Preparation',
    subPhases: [
      // { subPhaseName: 'OVERHEAD PANEL', items: [] },
      // { subPhaseName: 'CTR INSTRUMENT PANEL', items: [] },
      // { subPhaseName: 'PEDESTAL', items: [] },
      // { subPhaseName: 'RMP', items: [] },
      // { subPhaseName: 'FMGS PREPARATION', items: [] },
      // { subPhaseName: 'GLARESHIELD', items: [] },
      // { subPhaseName: 'LATERAL CONSOLES', items: [] },
      // { subPhaseName: 'INSTRUMENT PANELS', items: [] },
      {
        subPhaseName: 'ECAM CONTROL PANEL',
        items: [
          {
            itemName: 'Check pressure page',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'ECAM Pressure page checked',
                        reference: '',
                        description: PRESS_PB[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  {
                    severity: SeverityId.ProceduralDeviation,
                    event: [
                      {
                        name: 'ECAM Pressure page not checked',
                        reference: '',
                        description: PRESS_PB[SeverityId.ProceduralDeviation],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            itemName: 'Check status page',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'ECAM Status page checked',
                        reference: '',
                        description: STS_PB[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  {
                    severity: SeverityId.ProceduralDeviation,
                    event: [
                      {
                        name: 'ECAM Status page not checked',
                        reference: '',
                        description: STS_PB[SeverityId.ProceduralDeviation],
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
        subPhaseName: 'ADIRS',
        items: [
          {
            itemName: ' IRS ALIGN',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'IRS aligned',
                        reference: '',
                        description: ADIRS[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  {
                    severity: SeverityId.SafetyCompromise,
                    event: [
                      {
                        name: 'IRS not aligned',
                        reference: '',
                        description: ADIRS[SeverityId.SafetyCompromise],
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
  },
  {
    phaseName: 'Before Pushback or Start',
    subPhases: [
      {
        subPhaseName: 'BEFORE START CLEARANCE',
        items: [
          {
            itemName: 'ELEC',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'External Power Disconnected',
                        reference: '',
                        description: ELEC[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  {
                    severity: SeverityId.SafetyCompromise,
                    event: [
                      {
                        name: 'External Power Connected',
                        reference: '',
                        description: ELEC[SeverityId.SafetyCompromise],
                      },
                      {
                        name: 'External Power Unplugged while connected',
                        reference: '',
                        description: ELEC[SeverityId.SafetyCompromise],
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
        subPhaseName: 'AT START CLEARANCE',
        items: [
          {
            itemName: 'PUSHBACK/START UP CLEARANCE',
            procedure: [
              {
                eventsBySeverity: [
                  { severity: SeverityId.StandardCompliance, event: [] },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  { severity: SeverityId.ProceduralDeviation, event: [] },
                  { severity: SeverityId.SafetyCompromise, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'WINDOWS AND DOORS',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'WINDOWS_AND_DOORS',
                        reference: '',
                        description:
                          WINDOWS_AND_DOORS[SeverityId.StandardCompliance],
                      },
                      {
                        name: 'SLIDES',
                        reference: '',
                        description:
                          WINDOWS_AND_DOORS[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  {
                    severity: SeverityId.SafetyCompromise,
                    event: [
                      {
                        name: 'WINDOWS_AND_DOORS',
                        reference: '',
                        description:
                          WINDOWS_AND_DOORS[SeverityId.SafetyCompromise],
                      },
                    ],
                  },
                  {
                    severity: SeverityId.ProceduralDeviation,
                    event: [
                      {
                        name: 'SLIDES',
                        reference: '',
                        description: SLIDES[SeverityId.ProceduralDeviation],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            itemName: 'EXTERIOR LIGHTS',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'BEACON sw',
                        reference: '',
                        description:
                          EXTERIOR_LIGHTS_BEACON[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  {
                    severity: SeverityId.ProceduralDeviation,
                    event: [
                      {
                        name: 'BEACON sw',
                        reference: '',
                        description:
                          EXTERIOR_LIGHTS_BEACON[
                            SeverityId.ProceduralDeviation
                          ],
                      },
                    ],
                  },
                  { severity: SeverityId.SafetyCompromise, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'THRUST LEVERS',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'Thrust Levers',
                        reference: '',
                        description:
                          THRUST_LEVERS[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  { severity: SeverityId.ProceduralDeviation, event: [] },
                  {
                    severity: SeverityId.SafetyCompromise,
                    event: [
                      {
                        name: 'Thrust Levers',
                        reference: '',
                        description: THRUST_LEVERS[SeverityId.SafetyCompromise],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            itemName: 'ACCU PRESSURE',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'ACCU PRESS indicator',
                        reference: '',
                        description:
                          ACCU_PRESSURE[SeverityId.StandardCompliance],
                      },
                    ],
                  },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  {
                    severity: SeverityId.ProceduralDeviation,
                    event: [],
                  },
                  {
                    severity: SeverityId.SafetyCompromise,
                    event: [
                      {
                        name: 'ACCU PRESS indicator',
                        reference: '',
                        description: ACCU_PRESSURE[SeverityId.SafetyCompromise],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            itemName: 'PARKING BRAKE AND NOSEWHEEL STEERING',
            procedure: [
              {
                eventsBySeverity: [
                  { severity: SeverityId.StandardCompliance, event: [] },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  { severity: SeverityId.ProceduralDeviation, event: [] },
                  { severity: SeverityId.SafetyCompromise, event: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// --- Mappings and Utility Functions ---
const severityIdMap: Record<SeverityId, string> = {
  [SeverityId.StandardCompliance]: 'STANDARD_COMPLIANCE',
  [SeverityId.ProactiveExcellence]: 'PROACTIVE_EXCELLENCE',
  [SeverityId.ProceduralDeviation]: 'PROCEDURAL_DEVIATION',
  [SeverityId.SafetyCompromise]: 'SAFETY_COMPROMISE',
};

const formatForId = (str: string): string => {
  return str
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();
};

// --- Data Structure for Type Generation (to collect all unique keys) ---
interface CollectedKeys {
  phases: Set<string>;
  subPhases: Map<string, Set<string>>; // phaseKey -> Set<subPhaseKey>
  items: Map<string, Set<string>>; // subPhaseKey -> Set<itemKey>
  severities: Map<string, Set<string>>; // itemKey -> Set<severityKey>
}

const allCollectedKeys: CollectedKeys = {
  phases: new Set<string>(),
  subPhases: new Map<string, Set<string>>(),
  items: new Map<string, Set<string>>(),
  severities: new Map<string, Set<string>>(),
};

// --- Interfaces for internal script data objects ---
type GeneratedEventOutput = {
  id: string; // Isso agora deve ser o ID do Prisma
  logicalId: string; // O ID lógico que você está gerando
  name: string;
  reference: string;
  description: string;
  severityId: SeverityId; // Adicionar o severityId do Prisma
};

type SequentialIdMapOutput = {
  [key: string]: GeneratedEventOutput;
};

type SeverityMapOutput = {
  [key: string]: SequentialIdMapOutput;
};

type ItemMapOutput = {
  [key: string]: SeverityMapOutput;
};

type SubPhaseMapOutput = {
  [key: string]: ItemMapOutput;
};

type CheckListOutputInternal = {
  [key: string]: SubPhaseMapOutput;
};

const generateNestedCheckListAndCollectKeys = (
  data: PhaseInput[],
): CheckListOutputInternal => {
  const finalOutput: CheckListOutputInternal = {};

  data.forEach((phase) => {
    const phaseKey = formatForId(phase.phaseName);
    allCollectedKeys.phases.add(phaseKey);

    if (!allCollectedKeys.subPhases.has(phaseKey)) {
      allCollectedKeys.subPhases.set(phaseKey, new Set<string>());
    }

    if (!finalOutput[phaseKey]) {
      finalOutput[phaseKey] = {};
    }

    phase.subPhases.forEach((subPhase) => {
      const subPhaseKey = formatForId(subPhase.subPhaseName);
      allCollectedKeys.subPhases.get(phaseKey)!.add(subPhaseKey);

      if (!allCollectedKeys.items.has(subPhaseKey)) {
        allCollectedKeys.items.set(subPhaseKey, new Set<string>());
      }

      if (!finalOutput[phaseKey][subPhaseKey]) {
        finalOutput[phaseKey][subPhaseKey] = {};
      }

      subPhase.items.forEach((item) => {
        const itemKey = formatForId(item.itemName);
        allCollectedKeys.items.get(subPhaseKey)!.add(itemKey);

        if (!allCollectedKeys.severities.has(itemKey)) {
          allCollectedKeys.severities.set(itemKey, new Set<string>());
        }

        const currentItemSeverityMap: SeverityMapOutput = {};

        item.procedure.forEach((procedure) => {
          procedure.eventsBySeverity.forEach((severityBlock) => {
            if (severityBlock.event.length > 0) {
              const severityKey = severityIdMap[severityBlock.severity];
              if (!severityKey) {
                console.warn(
                  `SeverityId ${severityBlock.severity} not found in map. Skipping for item: ${item.itemName}`,
                );
                return;
              }
              allCollectedKeys.severities.get(itemKey)!.add(severityKey);

              if (!currentItemSeverityMap[severityKey]) {
                currentItemSeverityMap[severityKey] = {};
              }

              let sequenceCounter = 0;

              severityBlock.event.forEach((eventToCreateInput) => {
                sequenceCounter++;
                const sequentialId = String(sequenceCounter).padStart(2, '0');

                const fullLogicalId = `[${phaseKey}][${subPhaseKey}][${itemKey}][${formatForId(severityKey)}][${sequentialId}]`;

                const eventOutput: GeneratedEventOutput = {
                  id: 'placeholder-prisma-id',
                  logicalId: fullLogicalId,
                  name: eventToCreateInput.name,
                  reference: eventToCreateInput.reference,
                  description: eventToCreateInput.description,
                  severityId: severityBlock.severity,
                };

                currentItemSeverityMap[severityKey][sequentialId] = eventOutput;
              });
            }
          });
        });
        if (Object.keys(currentItemSeverityMap).length > 0) {
          finalOutput[phaseKey][subPhaseKey][itemKey] = currentItemSeverityMap;
        }
      });
    });
  });
  return finalOutput;
};

const rawNestedCheckList =
  generateNestedCheckListAndCollectKeys(initialCheckList);

function pruneEmptyObjects(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => pruneEmptyObjects(item))
      .filter((item) => {
        return item !== undefined;
      });
    return cleanedArray.length === 0 ? undefined : cleanedArray;
  }

  const cleanedObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = pruneEmptyObjects(obj[key]);
      if (value !== undefined) {
        cleanedObj[key] = value;
      }
    }
  }
  return Object.keys(cleanedObj).length === 0 ? undefined : cleanedObj;
}

const finalNestedCheckList = pruneEmptyObjects(rawNestedCheckList);

const outputFileName = 'eventsListSeed.ts';
const outputPath = path.join(__dirname, outputFileName);

const generatedFileImports = `
import { Event } from '@prisma/client';
import { SeverityId } from './severity';
`;

let generatedFileInterfaces = `
export interface GeneratedEvent extends Event {
  logicalId: string;
  name: string;
  reference: string;
  description: string;
  severityId: SeverityId;
}

type SequentialIdMap = {
  [key: string]: GeneratedEvent;
};

// =========================================================
// DYNAMICALLY GENERATED INTERFACES FOR LITERAL KEYS
// =========================================================
`;

generatedFileInterfaces += `
// Maps SeverityId names (e.g., "STANDARD_COMPLIANCE") to SequentialIdMap
export type SeverityMap = {
`;
Object.values(SeverityId)
  .filter((value) => typeof value === 'string')
  .forEach((severityName) => {
    const actualSeverityId =
      SeverityId[severityName as keyof typeof SeverityId];
    if (typeof actualSeverityId === 'number') {
      const formattedSeverityKey = severityIdMap[actualSeverityId];
      if (formattedSeverityKey) {
        generatedFileInterfaces += `  '${formattedSeverityKey}'?: SequentialIdMap;
`;
      }
    }
  });
generatedFileInterfaces += `};
`;

// Build ItemMap types
allCollectedKeys.items.forEach(
  (itemKeysSet: Set<string>, subPhaseKey: string) => {
    const itemMapEntries: string[] = [];
    itemKeysSet.forEach((itemKey) => {
      itemMapEntries.push(`'${itemKey}'?: SeverityMap`);
    });

    const typeName = `ItemMapFor_${subPhaseKey}`;
    if (itemMapEntries.length > 0) {
      generatedFileInterfaces += `
export type ${typeName} = {
    ${itemMapEntries.join(';\n    ')};
};
`;
    } else {
      // Fallback para subPhases que não têm itens específicos com eventos
      // Mantemos um tipo genérico para que o SubPhaseMap possa referenciá-lo.
      // Se não houver itens específicos, qualquer string key será do tipo SeverityMap
      generatedFileInterfaces += `
export type ${typeName} = {
    [key: string]?: SeverityMap;
};
`;
    }
  },
);

// Build SubPhaseMap types
allCollectedKeys.subPhases.forEach(
  (subPhaseKeysSet: Set<string>, phaseKey: string) => {
    const subPhaseMapEntries: string[] = [];
    subPhaseKeysSet.forEach((subPhaseKey) => {
      const itemTypeName = `ItemMapFor_${subPhaseKey}`;
      subPhaseMapEntries.push(`'${subPhaseKey}'?: ${itemTypeName}`);
    });

    const typeName = `SubPhaseMapFor_${phaseKey}`;
    if (subPhaseMapEntries.length > 0) {
      generatedFileInterfaces += `
export type ${typeName} = {
    ${subPhaseMapEntries.join(';\n    ')};
};
`;
    } else {
      // Anteriormente usava ItemMapFor_Generic, agora usa um tipo embutido
      generatedFileInterfaces += `
export type ${typeName} = {
    [key: string]?: { [key: string]?: SeverityMap }; // Tipo genérico diretamente aqui
};
`;
    }
  },
);

// REMOVIDO: Define a fallback para casos vazios ou onde os tipos não existem (com propriedades opcionais)
// generatedFileInterfaces += `
// // Fallback type for generic item map when no specific type can be generated
// type ItemMapFor_Generic = {
//     [key: string]?: SeverityMap; // Propriedades opcionais
// };
// `;

// Build CheckListOutput (the main type)
generatedFileInterfaces += `
// Main CheckListOutput type with literal phase keys
export type CheckListOutput = {
`;
allCollectedKeys.phases.forEach((phaseKey: string) => {
  const subPhaseTypeName = `SubPhaseMapFor_${phaseKey}`;
  generatedFileInterfaces += `  '${phaseKey}'?: ${subPhaseTypeName};
`;
});
generatedFileInterfaces += `};
`;

const dataString = JSON.stringify(finalNestedCheckList, null, 2);

const fileContent = `
// This file is automatically generated by a script. DO NOT EDIT DIRECTLY.
${generatedFileImports}

${generatedFileInterfaces}

export const eventList: CheckListOutput = ${dataString};
`;

fs.writeFileSync(outputPath, fileContent);

console.log(
  `File '${outputFileName}' generated successfully at: ${outputPath}`,
);
