import { PrismaClient } from '@prisma/client';
import { eventList } from './eventsListSeed';

/**
 * Shape of a leaf event inside the generated `eventList` checklist tree.
 * NOTE: in the generated data the real Prisma `Event.id` is the `logicalId`
 * (see `prisma/seed.ts`, which upserts events with `id: eventData.logicalId`).
 * The literal `id` field on the leaves is a shared placeholder and must NOT be
 * used as a lookup/creation key.
 */
interface LeafEvent {
  id: string;
  logicalId: string;
  name: string;
  reference?: string;
  description?: string;
  severityId: number;
}

function isLeafEvent(node: any): node is LeafEvent {
  return (
    !!node &&
    typeof node === 'object' &&
    typeof node.logicalId === 'string' &&
    typeof node.name === 'string' &&
    node.severityId !== undefined
  );
}

// Collect every leaf event under a node (walks through the severity buckets and
// the sequential leaf keys), regardless of the exact nesting depth.
function collectLeafEvents(node: any): LeafEvent[] {
  if (!node || typeof node !== 'object') {
    return [];
  }
  if (isLeafEvent(node)) {
    return [node];
  }
  const out: LeafEvent[] = [];
  for (const key of Object.keys(node)) {
    out.push(...collectLeafEvents(node[key]));
  }
  return out;
}

/**
 * Idempotently imports the existing A320 checklist tree into a single
 * PUBLISHED ProcedureVersion (v1). Events/EventDescriptions are already upserted
 * by `prisma/seed.ts::main()` before this runs; here we build the
 * Phase -> SubPhase -> ChecklistItem structure and attach the existing Event
 * rows to their checklist items. No ValidationRules are created (admins add
 * thresholds later).
 */
export async function seedProcedures(prisma: PrismaClient): Promise<void> {
  // 1. Resolve the A320 aircraft model.
  const model = await prisma.aircraftModel.findFirst({
    where: { OR: [{ code: 'A320' }, { model: { contains: 'A320' } }] },
  });

  if (!model) {
    console.log(
      '[seedProcedures] No A320 aircraft model found. Skipping procedure seed.',
    );
    return;
  }

  // 2. Idempotency: bail out if v1 already exists for this model.
  const existing = await prisma.procedureVersion.findFirst({
    where: { aircraftModelCode: model.code, version: 1 },
  });

  if (existing) {
    console.log(
      `[seedProcedures] ProcedureVersion v1 already exists for ${model.code}. Skipping.`,
    );
    return;
  }

  // 3. Create the PUBLISHED v1 (scoring fields keep their schema defaults).
  const procedureVersion = await prisma.procedureVersion.create({
    data: {
      aircraftModelCode: model.code,
      version: 1,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // 4. Walk the checklist tree and materialise the structure.
  let phaseOrder = 0;
  for (const phaseName of Object.keys(eventList)) {
    const phaseNode = (eventList as any)[phaseName];
    if (!phaseNode || typeof phaseNode !== 'object') {
      continue;
    }

    const phase = await prisma.phase.create({
      data: {
        procedureVersionId: procedureVersion.id,
        name: phaseName,
        order: phaseOrder++,
      },
    });

    let subOrder = 0;
    for (const subPhaseName of Object.keys(phaseNode)) {
      const subPhaseNode = phaseNode[subPhaseName];
      if (!subPhaseNode || typeof subPhaseNode !== 'object') {
        continue;
      }

      const subPhase = await prisma.subPhase.create({
        data: {
          phaseId: phase.id,
          name: subPhaseName,
          order: subOrder++,
        },
      });

      let itemOrder = 0;
      for (const itemName of Object.keys(subPhaseNode)) {
        const itemNode = subPhaseNode[itemName];
        if (!itemNode || typeof itemNode !== 'object') {
          continue;
        }

        const checklistItem = await prisma.checklistItem.create({
          data: {
            subPhaseId: subPhase.id,
            name: itemName,
            order: itemOrder++,
            verifiability: 'AUTO',
            source: 'FCOM',
          },
        });

        // Attach every leaf event (across all severity buckets) to this item.
        const leafEvents = collectLeafEvents(itemNode);
        for (const leaf of leafEvents) {
          const eventId = leaf.logicalId;
          const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
          });

          if (existingEvent) {
            await prisma.event.update({
              where: { id: eventId },
              data: { checklistItemId: checklistItem.id },
            });
          } else {
            // Fallback: event row missing (should not normally happen since
            // seed.ts upserts them first) -> create minimally.
            await prisma.event.create({
              data: {
                id: eventId,
                name: leaf.name,
                severityId: leaf.severityId,
                reference: leaf.reference ?? '',
                checklistItemId: checklistItem.id,
              },
            });
          }
        }
      }
    }
  }

  console.log(
    `[seedProcedures] Seeded PUBLISHED procedure v1 for ${model.code}.`,
  );
}
