// event.ts (ou src/utils/generateChecklist.ts, como havíamos nomeado antes)

// --- Imports needed for THIS SCRIPT (event.ts) to run ---
// Estes são os imports necessários para o *próprio script* funcionar
import * as fs from 'fs'; // Importar fs
import * as path from 'path'; // Importar path
import { SeverityId } from './severity'; // Importar SeverityId
import { ACCU_PRESSURE } from './eventDescription/beforePushbackOrStart'; // Importar ACCU_PRESSURE

// --- Interfaces for the INPUT DATA structure (que este script vai ler) ---
// Estas interfaces precisam estar definidas AQUI no arquivo gerador
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
    phaseName: 'Before Pushback or Start',
    subPhases: [
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
                  { severity: SeverityId.StandardCompliance, event: [] },
                  { severity: SeverityId.ProactiveExcellence, event: [] },
                  { severity: SeverityId.SafetyCompromise, event: [] },
                  { severity: SeverityId.ProceduralDeviation, event: [] },
                ],
              },
            ],
          },
          {
            itemName: 'EXTERIOR LIGHTS',
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
            itemName: 'THRUST LEVERS',
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
  {
    phaseName: 'After Engine Start',
    subPhases: [
      {
        subPhaseName: 'AFTER ENGINE START',
        items: [
          {
            itemName: 'ENGINES',
            procedure: [
              {
                eventsBySeverity: [
                  {
                    severity: SeverityId.StandardCompliance,
                    event: [
                      {
                        name: 'Engine start successful',
                        reference: 'ENG-1',
                        description:
                          'Both engines are running within normal parameters.',
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
];

// --- Mappings and Utility Functions (permanecem inalterados) ---
const severityIdMap: Record<SeverityId, string> = {
  [SeverityId.StandardCompliance]: 'STANDARD_COMPLIANCE', // COM UNDERSCORE
  [SeverityId.ProactiveExcellence]: 'PROACTIVE_EXCELLENCE', // COM UNDERSCORE
  [SeverityId.ProceduralDeviation]: 'PROCEDURAL_DEVIATION', // COM UNDERSCORE
  [SeverityId.SafetyCompromise]: 'SAFETY_COMPROMISE', // COM UNDERSCORE
};

const formatForId = (str: string): string => {
  return str
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();
};

// --- Data Structure for Type Generation (to collect all unique keys) ---
// Estas interfaces TAMBÉM precisam estar definidas AQUI no arquivo gerador
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

// --- Main logic to generate the nested data object and collect keys ---
// E estas interfaces TAMBÉM!
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
  // Internal name for the data object
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

        if (!finalOutput[phaseKey][subPhaseKey][itemKey]) {
          finalOutput[phaseKey][subPhaseKey][itemKey] = {};
        }

        // NOVO TRECHO AQUI: Inicializar TODAS as severidades para CADA ITEM
        // antes de preencher com os dados reais
        const currentItemSeverityMap =
          finalOutput[phaseKey][subPhaseKey][itemKey];

        // Iterar sobre *todos* os valores possíveis de SeverityId (os numéricos)
        // e inicializar suas chaves formatadas no objeto
        Object.values(SeverityId)
          .filter((value) => typeof value === 'number')
          .forEach((severityIdNum) => {
            const actualSeverityId = severityIdNum as SeverityId; // Cast para SeverityId
            const severityKey = severityIdMap[actualSeverityId]; // Obter a string formatada (ex: 'STANDARD_COMPLIANCE')

            // Inicializa cada severidade como um objeto vazio se ainda não existir
            if (!currentItemSeverityMap[severityKey]) {
              currentItemSeverityMap[severityKey] = {};
            }
          });

        item.procedure.forEach((procedure) => {
          procedure.eventsBySeverity.forEach((severityBlock) => {
            const severityKey = severityIdMap[severityBlock.severity];
            if (!severityKey) {
              console.warn(
                `SeverityId ${severityBlock.severity} not found in map. Skipping for item: ${item.itemName}`,
              );
              return;
            }
            // allCollectedKeys.severities.get(itemKey)!.add(severityKey); // Isso já é feito no loop acima, mas não faz mal manter

            // Esta linha já existe e está correta, mas a inicialização acima é vital
            // if (!finalOutput[phaseKey][subPhaseKey][itemKey][severityKey]) {
            //   finalOutput[phaseKey][subPhaseKey][itemKey][severityKey] = {};
            // }

            let sequenceCounter = 0;

            severityBlock.event.forEach((eventToCreateInput) => {
              sequenceCounter++;
              const sequentialId = String(sequenceCounter).padStart(2, '0');

              const fullLogicalId = `[${phaseKey}][${subPhaseKey}][${itemKey}][${formatForId(severityKey)}][${sequentialId}]`;

              const eventOutput: GeneratedEventOutput = {
                id: 'placeholder-prisma-id', // Ajustar conforme seu DB (uuid, etc.)
                logicalId: fullLogicalId,
                name: eventToCreateInput.name,
                reference: eventToCreateInput.reference,
                description: eventToCreateInput.description,
                severityId: severityBlock.severity,
              };

              // Atribui o evento ao sequentialId DENTRO da severidade
              currentItemSeverityMap[severityKey][sequentialId] = eventOutput;
            });
          });
        });
      });
    });
  });
  return finalOutput;
};

// Generate the nested object and collect keys
const finalNestedCheckList =
  generateNestedCheckListAndCollectKeys(initialCheckList);

// --- Generate the content for the OUTPUT .ts file ---
const outputFileName = 'generatedCheckList.ts';
const outputPath = path.join(__dirname, outputFileName);

// Step 1: Define the imports for the generated file
const generatedFileImports = `
import { Event } from '@prisma/client'; // Adjust path if needed
import { SeverityId } from './severity'; // Path relative to generatedCheckList.ts
`;

// Step 2: Dynamically generate the interfaces for the generated file
let generatedFileInterfaces = `
// Event type including the logical ID. Extend Prisma's Event model.
export interface GeneratedEvent extends Event {
  logicalId: string; // The ID generated for the checklist navigation
  name: string;
  reference: string;
  description: string;
}

// Maps sequential IDs (e.g., "01") to GeneratedEvent objects
type SequentialIdMap = {
  [key: string]: GeneratedEvent;
};

// =========================================================
// DYNAMICALLY GENERATED INTERFACES FOR LITERAL KEYS
// =========================================================

// SeverityMap: Uses fixed keys from the SeverityId enum
type SeverityMap = {
`;
// Iterar sobre o seu severityIdMap para construir os tipos literais das chaves
Object.values(SeverityId)
  .filter((value) => typeof value === 'string')
  .forEach((severityName) => {
    const formattedSeverityKey =
      severityIdMap[
        SeverityId[severityName as keyof typeof SeverityId] as SeverityId
      ];
    if (formattedSeverityKey) {
      generatedFileInterfaces += `  '${formattedSeverityKey}': SequentialIdMap;
`;
    }
  });
generatedFileInterfaces += `};
`;

// Build ItemMap types
allCollectedKeys.items.forEach(
  (itemKeysSet: Set<string>, subPhaseKey: string) => {
    const itemMapEntries: string[] = [];
    itemKeysSet.forEach((itemKey) => {
      itemMapEntries.push(`'${itemKey}': SeverityMap`);
    });

    const typeName = `ItemMapFor_${subPhaseKey}`;
    if (itemMapEntries.length > 0) {
      generatedFileInterfaces += `
export type ${typeName} = {
    ${itemMapEntries.join(';\n    ')};
};
`;
    } else {
      generatedFileInterfaces += `
export type ${typeName} = {
    [key: string]: SeverityMap; // Fallback for subPhases with no specific items
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
      subPhaseMapEntries.push(`'${subPhaseKey}': ${itemTypeName}`);
    });

    const typeName = `SubPhaseMapFor_${phaseKey}`;
    if (subPhaseMapEntries.length > 0) {
      generatedFileInterfaces += `
export type ${typeName} = {
    ${subPhaseMapEntries.join(';\n    ')};
};
`;
    } else {
      generatedFileInterfaces += `
export type ${typeName} = {
    [key: string]: ItemMapFor_Generic; // Fallback for phases with no specific subPhases
};
`;
    }
  },
);

// Define a fallback for empty cases or where types don't exist
generatedFileInterfaces += `
// Fallback type for generic item map when no specific type can be generated
type ItemMapFor_Generic = {
    [key: string]: SeverityMap;
};
`;

// Build CheckListOutput (the main type)
generatedFileInterfaces += `
// Main CheckListOutput type with literal phase keys
export type CheckListOutput = {
`;
allCollectedKeys.phases.forEach((phaseKey: string) => {
  const subPhaseTypeName = `SubPhaseMapFor_${phaseKey}`;
  generatedFileInterfaces += `  '${phaseKey}': ${subPhaseTypeName};
`;
});
generatedFileInterfaces += `};
`;

// Step 3: Stringify the data object
const dataString = JSON.stringify(finalNestedCheckList, null, 2);

// Step 4: Combine all parts into the final file content
const fileContent = `
// This file is automatically generated by a script. DO NOT EDIT DIRECTLY.
${generatedFileImports}

${generatedFileInterfaces}

export const checkList: CheckListOutput = ${dataString};
`;

// Write the content to the file
fs.writeFileSync(outputPath, fileContent);

console.log(
  `File '${outputFileName}' generated successfully at: ${outputPath}`,
);
