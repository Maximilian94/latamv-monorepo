import { Injectable } from '@nestjs/common';
import { Prisma, ProcedureStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CreateProcedureVersionDto } from '../dto/create-procedure-version.dto';
import { UpdateProcedureVersionDto } from '../dto/update-procedure-version.dto';
import { CreatePhaseDto } from '../dto/create-phase.dto';
import { UpdatePhaseDto } from '../dto/update-phase.dto';
import { CreateSubPhaseDto } from '../dto/create-subphase.dto';
import { UpdateSubPhaseDto } from '../dto/update-subphase.dto';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { CreateRuleDto } from '../dto/create-rule.dto';
import { UpdateRuleDto } from '../dto/update-rule.dto';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';
import { CreateDatarefDto } from '../dto/create-dataref.dto';
import { UpdateDatarefDto } from '../dto/update-dataref.dto';

// Deeply-nested include used to hydrate the full procedure tree, ordered.
const TREE_INCLUDE = {
  phases: {
    orderBy: { order: 'asc' },
    include: {
      subPhases: {
        orderBy: { order: 'asc' },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: {
              events: {
                include: {
                  eventDescription: true,
                  severity: true,
                  validationRules: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProcedureVersionInclude;

@Injectable()
export class ProceduresRepository {
  constructor(private prisma: PrismaService) {}

  // ===== Versions =====

  async findVersions(aircraftModelCode?: string) {
    return this.prisma.procedureVersion.findMany({
      where: aircraftModelCode ? { aircraftModelCode } : undefined,
      orderBy: [{ aircraftModelCode: 'asc' }, { version: 'desc' }],
    });
  }

  async findVersionTree(id: number) {
    return this.prisma.procedureVersion.findUnique({
      where: { id },
      include: TREE_INCLUDE,
    });
  }

  async findVersionById(id: number) {
    return this.prisma.procedureVersion.findUnique({ where: { id } });
  }

  async findMaxVersion(aircraftModelCode: string) {
    return this.prisma.procedureVersion.findFirst({
      where: { aircraftModelCode },
      orderBy: { version: 'desc' },
    });
  }

  async findDraftByModel(aircraftModelCode: string) {
    return this.prisma.procedureVersion.findFirst({
      where: { aircraftModelCode, status: ProcedureStatus.DRAFT },
    });
  }

  async findPublishedByModel(aircraftModelCode: string) {
    return this.prisma.procedureVersion.findFirst({
      where: { aircraftModelCode, status: ProcedureStatus.PUBLISHED },
      include: TREE_INCLUDE,
    });
  }

  async createVersion(
    dto: CreateProcedureVersionDto,
    version: number,
  ) {
    return this.prisma.procedureVersion.create({
      data: {
        aircraftModelCode: dto.aircraftModelCode,
        version,
        status: ProcedureStatus.DRAFT,
        ...(dto.baseScore !== undefined && { baseScore: dto.baseScore }),
        ...(dto.passingScore !== undefined && {
          passingScore: dto.passingScore,
        }),
        ...(dto.weightStd !== undefined && { weightStd: dto.weightStd }),
        ...(dto.weightExc !== undefined && { weightExc: dto.weightExc }),
        ...(dto.weightDev !== undefined && { weightDev: dto.weightDev }),
        ...(dto.weightCmp !== undefined && { weightCmp: dto.weightCmp }),
      },
    });
  }

  async updateVersion(id: number, dto: UpdateProcedureVersionDto) {
    return this.prisma.procedureVersion.update({
      where: { id },
      data: {
        ...(dto.aircraftModelCode !== undefined && {
          aircraftModelCode: dto.aircraftModelCode,
        }),
        ...(dto.baseScore !== undefined && { baseScore: dto.baseScore }),
        ...(dto.passingScore !== undefined && {
          passingScore: dto.passingScore,
        }),
        ...(dto.weightStd !== undefined && { weightStd: dto.weightStd }),
        ...(dto.weightExc !== undefined && { weightExc: dto.weightExc }),
        ...(dto.weightDev !== undefined && { weightDev: dto.weightDev }),
        ...(dto.weightCmp !== undefined && { weightCmp: dto.weightCmp }),
      },
    });
  }

  async deleteVersion(id: number) {
    await this.prisma.procedureVersion.delete({ where: { id } });
  }

  async publishVersion(id: number, aircraftModelCode: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.procedureVersion.updateMany({
        where: {
          aircraftModelCode,
          status: ProcedureStatus.PUBLISHED,
        },
        data: { status: ProcedureStatus.ARCHIVED },
      });

      return tx.procedureVersion.update({
        where: { id },
        data: {
          status: ProcedureStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: TREE_INCLUDE,
      });
    });
  }

  // Deep-clone a (published) version into a brand-new DRAFT with fresh Event ids.
  async cloneVersion(sourceId: number, newVersion: number) {
    const source = await this.findVersionTree(sourceId);
    if (!source) {
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.procedureVersion.create({
        data: {
          aircraftModelCode: source.aircraftModelCode,
          version: newVersion,
          status: ProcedureStatus.DRAFT,
          baseScore: source.baseScore,
          passingScore: source.passingScore,
          weightStd: source.weightStd,
          weightExc: source.weightExc,
          weightDev: source.weightDev,
          weightCmp: source.weightCmp,
        },
      });

      for (const phase of source.phases) {
        const newPhase = await tx.phase.create({
          data: {
            procedureVersionId: draft.id,
            name: phase.name,
            order: phase.order,
          },
        });

        for (const subPhase of phase.subPhases) {
          const newSubPhase = await tx.subPhase.create({
            data: {
              phaseId: newPhase.id,
              name: subPhase.name,
              order: subPhase.order,
            },
          });

          for (const item of subPhase.items) {
            const newItem = await tx.checklistItem.create({
              data: {
                subPhaseId: newSubPhase.id,
                name: item.name,
                order: item.order,
                verifiability: item.verifiability,
                source: item.source,
              },
            });

            let seq = 0;
            for (const event of item.events) {
              seq += 1;
              const newEventId = `EVT-${newItem.id}-${event.severityId}-${seq}`;

              await tx.event.create({
                data: {
                  id: newEventId,
                  name: event.name,
                  severityId: event.severityId,
                  reference: event.reference,
                  checklistItemId: newItem.id,
                  ...(event.eventDescription && {
                    eventDescription: {
                      create: {
                        description: event.eventDescription.description,
                      },
                    },
                  }),
                  validationRules: {
                    create: event.validationRules.map((rule) => ({
                      type: rule.type,
                      phase: rule.phase,
                      aliases: rule.aliases as Prisma.InputJsonValue,
                      expr: rule.expr,
                      params:
                        rule.params === null
                          ? Prisma.JsonNull
                          : (rule.params as Prisma.InputJsonValue),
                      details:
                        rule.details === null
                          ? Prisma.JsonNull
                          : (rule.details as Prisma.InputJsonValue),
                    })),
                  },
                },
              });
            }
          }
        }
      }

      return tx.procedureVersion.findUnique({
        where: { id: draft.id },
        include: TREE_INCLUDE,
      });
    });
  }

  // ===== Version lookups from child ids (to enforce DRAFT-only mutations) =====

  async findVersionByPhaseId(phaseId: number) {
    const phase = await this.prisma.phase.findUnique({
      where: { id: phaseId },
      include: { procedureVersion: true },
    });
    return phase?.procedureVersion ?? null;
  }

  async findVersionBySubPhaseId(subPhaseId: number) {
    const subPhase = await this.prisma.subPhase.findUnique({
      where: { id: subPhaseId },
      include: { phase: { include: { procedureVersion: true } } },
    });
    return subPhase?.phase.procedureVersion ?? null;
  }

  async findVersionByItemId(itemId: number) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        subPhase: { include: { phase: { include: { procedureVersion: true } } } },
      },
    });
    return item?.subPhase.phase.procedureVersion ?? null;
  }

  async findVersionByEventId(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        checklistItem: {
          include: {
            subPhase: {
              include: { phase: { include: { procedureVersion: true } } },
            },
          },
        },
      },
    });
    return event?.checklistItem?.subPhase.phase.procedureVersion ?? null;
  }

  async findVersionByRuleId(ruleId: number) {
    const rule = await this.prisma.validationRule.findUnique({
      where: { id: ruleId },
      include: {
        event: {
          include: {
            checklistItem: {
              include: {
                subPhase: {
                  include: { phase: { include: { procedureVersion: true } } },
                },
              },
            },
          },
        },
      },
    });
    return rule?.event.checklistItem?.subPhase.phase.procedureVersion ?? null;
  }

  // ===== Phases =====

  async createPhase(dto: CreatePhaseDto) {
    return this.prisma.phase.create({
      data: {
        procedureVersionId: dto.procedureVersionId,
        name: dto.name,
        order: dto.order ?? 0,
      },
    });
  }

  async updatePhase(id: number, dto: UpdatePhaseDto) {
    return this.prisma.phase.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async deletePhase(id: number) {
    await this.prisma.phase.delete({ where: { id } });
  }

  // ===== SubPhases =====

  async createSubPhase(dto: CreateSubPhaseDto) {
    return this.prisma.subPhase.create({
      data: {
        phaseId: dto.phaseId,
        name: dto.name,
        order: dto.order ?? 0,
      },
    });
  }

  async updateSubPhase(id: number, dto: UpdateSubPhaseDto) {
    return this.prisma.subPhase.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async deleteSubPhase(id: number) {
    await this.prisma.subPhase.delete({ where: { id } });
  }

  // ===== Checklist Items =====

  async createItem(dto: CreateItemDto) {
    return this.prisma.checklistItem.create({
      data: {
        subPhaseId: dto.subPhaseId,
        name: dto.name,
        order: dto.order ?? 0,
        ...(dto.verifiability !== undefined && {
          verifiability: dto.verifiability,
        }),
        ...(dto.source !== undefined && { source: dto.source }),
      },
    });
  }

  async updateItem(id: number, dto: UpdateItemDto) {
    return this.prisma.checklistItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.verifiability !== undefined && {
          verifiability: dto.verifiability,
        }),
        ...(dto.source !== undefined && { source: dto.source }),
      },
    });
  }

  async deleteItem(id: number) {
    await this.prisma.checklistItem.delete({ where: { id } });
  }

  // ===== Events =====

  private async generateEventId(
    checklistItemId: number,
    severityId: number,
  ): Promise<string> {
    const count = await this.prisma.event.count({
      where: { checklistItemId },
    });

    let seq = count + 1;
    let candidate = `EVT-${checklistItemId}-${severityId}-${seq}`;

    // Guard against collisions (e.g. after deletions) until we find a free id.
    while (await this.prisma.event.findUnique({ where: { id: candidate } })) {
      seq += 1;
      candidate = `EVT-${checklistItemId}-${severityId}-${seq}`;
    }

    return candidate;
  }

  async createEvent(dto: CreateEventDto) {
    const id = await this.generateEventId(dto.checklistItemId, dto.severityId);

    return this.prisma.event.create({
      data: {
        id,
        name: dto.name,
        severityId: dto.severityId,
        reference: dto.reference,
        checklistItemId: dto.checklistItemId,
        ...(dto.description !== undefined && {
          eventDescription: { create: { description: dto.description } },
        }),
      },
      include: {
        eventDescription: true,
        severity: true,
        validationRules: true,
      },
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.severityId !== undefined && { severityId: dto.severityId }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
        ...(dto.description !== undefined && {
          eventDescription: {
            upsert: {
              create: { description: dto.description },
              update: { description: dto.description },
            },
          },
        }),
      },
      include: {
        eventDescription: true,
        severity: true,
        validationRules: true,
      },
    });
  }

  async deleteEvent(id: string) {
    await this.prisma.event.delete({ where: { id } });
  }

  // ===== Validation Rules =====

  async createRule(dto: CreateRuleDto) {
    return this.prisma.validationRule.create({
      data: {
        eventId: dto.eventId,
        type: dto.type,
        phase: dto.phase,
        aliases: dto.aliases as Prisma.InputJsonValue,
        expr: dto.expr,
        ...(dto.params !== undefined && {
          params: dto.params as Prisma.InputJsonValue,
        }),
        ...(dto.details !== undefined && {
          details: dto.details as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async updateRule(id: number, dto: UpdateRuleDto) {
    return this.prisma.validationRule.update({
      where: { id },
      data: {
        ...(dto.eventId !== undefined && { eventId: dto.eventId }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.phase !== undefined && { phase: dto.phase }),
        ...(dto.aliases !== undefined && {
          aliases: dto.aliases as Prisma.InputJsonValue,
        }),
        ...(dto.expr !== undefined && { expr: dto.expr }),
        ...(dto.params !== undefined && {
          params: dto.params as Prisma.InputJsonValue,
        }),
        ...(dto.details !== undefined && {
          details: dto.details as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async deleteRule(id: number) {
    await this.prisma.validationRule.delete({ where: { id } });
  }

  // ===== Aircraft Packages =====

  async findPackages() {
    return this.prisma.aircraftPackage.findMany({
      include: { datarefs: true },
      orderBy: { code: 'asc' },
    });
  }

  async findPackagesByModel(model: string) {
    return this.prisma.aircraftPackage.findMany({
      where: { model },
      include: { datarefs: true },
    });
  }

  async createPackage(dto: CreatePackageDto) {
    return this.prisma.aircraftPackage.create({
      data: {
        code: dto.code,
        model: dto.model,
        author: dto.author,
        description: dto.description,
      },
      include: { datarefs: true },
    });
  }

  async updatePackage(id: number, dto: UpdatePackageDto) {
    return this.prisma.aircraftPackage.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: { datarefs: true },
    });
  }

  async findPackageById(id: number) {
    return this.prisma.aircraftPackage.findUnique({ where: { id } });
  }

  async deletePackage(id: number) {
    await this.prisma.aircraftPackage.delete({ where: { id } });
  }

  // ===== Dataref Catalog =====

  async createDataref(dto: CreateDatarefDto) {
    return this.prisma.datarefCatalog.create({
      data: {
        packageId: dto.packageId,
        alias: dto.alias,
        datarefName: dto.datarefName,
        unit: dto.unit,
        ...(dto.valueType !== undefined && { valueType: dto.valueType }),
        arrayIndex: dto.arrayIndex,
        description: dto.description,
      },
    });
  }

  async updateDataref(id: number, dto: UpdateDatarefDto) {
    return this.prisma.datarefCatalog.update({
      where: { id },
      data: {
        ...(dto.packageId !== undefined && { packageId: dto.packageId }),
        ...(dto.alias !== undefined && { alias: dto.alias }),
        ...(dto.datarefName !== undefined && { datarefName: dto.datarefName }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.valueType !== undefined && { valueType: dto.valueType }),
        ...(dto.arrayIndex !== undefined && { arrayIndex: dto.arrayIndex }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async findDatarefById(id: number) {
    return this.prisma.datarefCatalog.findUnique({ where: { id } });
  }

  async deleteDataref(id: number) {
    await this.prisma.datarefCatalog.delete({ where: { id } });
  }
}
