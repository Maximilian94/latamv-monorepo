import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProcedureStatus } from '@prisma/client';
import { ProceduresRepository } from '../repositories/procedures.repository';
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
import { TestRuleDto } from '../dto/test-rule.dto';
import {
  ProcedureVersionSummaryDto,
  ProcedureVersionTreeDto,
  PhaseResponseDto,
  EventResponseDto,
  PublishedBundleDto,
} from '../dto/procedure-version-response.dto';
import {
  evaluateExpr,
  validateExpr,
  EvalResult,
} from '../../../common/expr/expr-eval';

@Injectable()
export class ProceduresService {
  constructor(private readonly repository: ProceduresRepository) {}

  // ===== Versions =====

  async listVersions(
    aircraftModelCode?: string,
  ): Promise<ProcedureVersionSummaryDto[]> {
    const versions = await this.repository.findVersions(aircraftModelCode);
    return versions.map((version) => this.mapSummary(version));
  }

  async getVersion(id: number): Promise<ProcedureVersionTreeDto> {
    const version = await this.repository.findVersionTree(id);
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    return this.mapTree(version);
  }

  async createVersion(
    dto: CreateProcedureVersionDto,
  ): Promise<ProcedureVersionSummaryDto> {
    const existingDraft = await this.repository.findDraftByModel(
      dto.aircraftModelCode,
    );
    if (existingDraft) {
      throw new BadRequestException(
        `A DRAFT procedure version already exists for aircraft model ${dto.aircraftModelCode}. Publish or delete it before creating a new one.`,
      );
    }

    const latest = await this.repository.findMaxVersion(dto.aircraftModelCode);
    const nextVersion = (latest?.version ?? 0) + 1;

    const created = await this.repository.createVersion(dto, nextVersion);
    return this.mapSummary(created);
  }

  async updateVersion(
    id: number,
    dto: UpdateProcedureVersionDto,
  ): Promise<ProcedureVersionTreeDto> {
    const version = await this.repository.findVersionById(id);
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    if (version.status !== ProcedureStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT procedure versions can be edited.',
      );
    }

    await this.repository.updateVersion(id, dto);
    return this.getVersion(id);
  }

  async deleteVersion(id: number): Promise<void> {
    const version = await this.repository.findVersionById(id);
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    if (version.status !== ProcedureStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT procedure versions can be deleted.',
      );
    }

    await this.repository.deleteVersion(id);
  }

  async publishVersion(id: number): Promise<ProcedureVersionTreeDto> {
    const version = await this.repository.findVersionTree(id);
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    if (version.status !== ProcedureStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT procedure versions can be published.',
      );
    }

    const problems = this.collectPublishProblems(version);
    if (problems.length > 0) {
      throw new BadRequestException({
        message: 'Procedure version cannot be published due to validation problems.',
        problems,
      });
    }

    const published = await this.repository.publishVersion(
      id,
      version.aircraftModelCode,
    );
    return this.mapTree(published);
  }

  async newDraftFromPublished(
    id: number,
  ): Promise<ProcedureVersionTreeDto> {
    const source = await this.repository.findVersionById(id);
    if (!source) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    if (source.status !== ProcedureStatus.PUBLISHED) {
      throw new BadRequestException(
        'A new draft can only be cloned from a PUBLISHED version.',
      );
    }

    const existingDraft = await this.repository.findDraftByModel(
      source.aircraftModelCode,
    );
    if (existingDraft) {
      throw new BadRequestException(
        `A DRAFT procedure version already exists for aircraft model ${source.aircraftModelCode}. Publish or delete it before cloning a new one.`,
      );
    }

    const latest = await this.repository.findMaxVersion(
      source.aircraftModelCode,
    );
    const nextVersion = (latest?.version ?? 0) + 1;

    const clone = await this.repository.cloneVersion(id, nextVersion);
    if (!clone) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    return this.mapTree(clone);
  }

  async getPublishedBundle(
    aircraftModelCode: string,
  ): Promise<PublishedBundleDto> {
    const version = await this.repository.findPublishedByModel(
      aircraftModelCode,
    );
    if (!version) {
      throw new NotFoundException(
        `No published procedure version found for aircraft model ${aircraftModelCode}`,
      );
    }
    return this.assembleBundle(version);
  }

  /**
   * Bundle for ANY version (draft included) so the desktop can test an
   * unpublished draft in real time before it goes live.
   */
  async getVersionBundle(id: number): Promise<PublishedBundleDto> {
    const version = await this.repository.findVersionTree(id);
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    return this.assembleBundle(version);
  }

  private async assembleBundle(version: any): Promise<PublishedBundleDto> {
    const packages = await this.repository.findPackagesByModel(
      version.aircraftModelCode,
    );
    const datarefs = packages.flatMap((pkg) =>
      pkg.datarefs.map((dataref) => ({
        id: dataref.id,
        packageId: dataref.packageId,
        alias: dataref.alias,
        datarefName: dataref.datarefName,
        unit: dataref.unit,
        valueType: dataref.valueType,
        arrayIndex: dataref.arrayIndex,
        description: dataref.description,
      })),
    );

    return {
      version: this.mapSummary(version),
      phases: version.phases.map((phase) => this.mapPhase(phase)),
      datarefs,
    };
  }

  // ===== Phases =====

  async createPhase(dto: CreatePhaseDto) {
    const version = await this.repository.findVersionById(
      dto.procedureVersionId,
    );
    this.assertVersionDraft(version, dto.procedureVersionId);
    return this.repository.createPhase(dto);
  }

  async updatePhase(id: number, dto: UpdatePhaseDto) {
    const version = await this.repository.findVersionByPhaseId(id);
    this.assertOwningDraft(version, 'Phase', id);
    return this.repository.updatePhase(id, dto);
  }

  async deletePhase(id: number): Promise<void> {
    const version = await this.repository.findVersionByPhaseId(id);
    this.assertOwningDraft(version, 'Phase', id);
    await this.repository.deletePhase(id);
  }

  // ===== SubPhases =====

  async createSubPhase(dto: CreateSubPhaseDto) {
    const version = await this.repository.findVersionByPhaseId(dto.phaseId);
    this.assertOwningDraft(version, 'Phase', dto.phaseId);
    return this.repository.createSubPhase(dto);
  }

  async updateSubPhase(id: number, dto: UpdateSubPhaseDto) {
    const version = await this.repository.findVersionBySubPhaseId(id);
    this.assertOwningDraft(version, 'SubPhase', id);
    return this.repository.updateSubPhase(id, dto);
  }

  async deleteSubPhase(id: number): Promise<void> {
    const version = await this.repository.findVersionBySubPhaseId(id);
    this.assertOwningDraft(version, 'SubPhase', id);
    await this.repository.deleteSubPhase(id);
  }

  // ===== Checklist Items =====

  async createItem(dto: CreateItemDto) {
    const version = await this.repository.findVersionBySubPhaseId(
      dto.subPhaseId,
    );
    this.assertOwningDraft(version, 'SubPhase', dto.subPhaseId);
    return this.repository.createItem(dto);
  }

  async updateItem(id: number, dto: UpdateItemDto) {
    const version = await this.repository.findVersionByItemId(id);
    this.assertOwningDraft(version, 'ChecklistItem', id);
    return this.repository.updateItem(id, dto);
  }

  async deleteItem(id: number): Promise<void> {
    const version = await this.repository.findVersionByItemId(id);
    this.assertOwningDraft(version, 'ChecklistItem', id);
    await this.repository.deleteItem(id);
  }

  // ===== Events =====

  async createEvent(dto: CreateEventDto): Promise<EventResponseDto> {
    const version = await this.repository.findVersionByItemId(
      dto.checklistItemId,
    );
    this.assertOwningDraft(version, 'ChecklistItem', dto.checklistItemId);
    const event = await this.repository.createEvent(dto);
    return this.mapEvent(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<EventResponseDto> {
    const version = await this.repository.findVersionByEventId(id);
    this.assertOwningDraft(version, 'Event', id);
    const event = await this.repository.updateEvent(id, dto);
    return this.mapEvent(event);
  }

  async deleteEvent(id: string): Promise<void> {
    const version = await this.repository.findVersionByEventId(id);
    this.assertOwningDraft(version, 'Event', id);
    await this.repository.deleteEvent(id);
  }

  // ===== Validation Rules =====

  async createRule(dto: CreateRuleDto) {
    const version = await this.repository.findVersionByEventId(dto.eventId);
    this.assertOwningDraft(version, 'Event', dto.eventId);
    return this.repository.createRule(dto);
  }

  async updateRule(id: number, dto: UpdateRuleDto) {
    const version = await this.repository.findVersionByRuleId(id);
    this.assertOwningDraft(version, 'ValidationRule', id);
    return this.repository.updateRule(id, dto);
  }

  async deleteRule(id: number): Promise<void> {
    const version = await this.repository.findVersionByRuleId(id);
    this.assertOwningDraft(version, 'ValidationRule', id);
    await this.repository.deleteRule(id);
  }

  testRule(dto: TestRuleDto): EvalResult {
    return evaluateExpr(dto.expr, dto.frame);
  }

  // ===== Aircraft Packages =====

  async listPackages() {
    return this.repository.findPackages();
  }

  async createPackage(dto: CreatePackageDto) {
    return this.repository.createPackage(dto);
  }

  async updatePackage(id: number, dto: UpdatePackageDto) {
    const pkg = await this.repository.findPackageById(id);
    if (!pkg) {
      throw new NotFoundException(`Aircraft package with ID ${id} not found`);
    }
    return this.repository.updatePackage(id, dto);
  }

  async deletePackage(id: number): Promise<void> {
    const pkg = await this.repository.findPackageById(id);
    if (!pkg) {
      throw new NotFoundException(`Aircraft package with ID ${id} not found`);
    }
    await this.repository.deletePackage(id);
  }

  // ===== Dataref Catalog =====

  async createDataref(dto: CreateDatarefDto) {
    const pkg = await this.repository.findPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException(
        `Aircraft package with ID ${dto.packageId} not found`,
      );
    }
    return this.repository.createDataref(dto);
  }

  async updateDataref(id: number, dto: UpdateDatarefDto) {
    const dataref = await this.repository.findDatarefById(id);
    if (!dataref) {
      throw new NotFoundException(`Dataref with ID ${id} not found`);
    }
    return this.repository.updateDataref(id, dto);
  }

  async deleteDataref(id: number): Promise<void> {
    const dataref = await this.repository.findDatarefById(id);
    if (!dataref) {
      throw new NotFoundException(`Dataref with ID ${id} not found`);
    }
    await this.repository.deleteDataref(id);
  }

  // ===== Guards / helpers =====

  private assertVersionDraft(version: any, id: number): void {
    if (!version) {
      throw new NotFoundException(`Procedure version with ID ${id} not found`);
    }
    if (version.status !== ProcedureStatus.DRAFT) {
      throw new BadRequestException(
        'The procedure tree can only be modified while its version is a DRAFT.',
      );
    }
  }

  private assertOwningDraft(
    version: any,
    label: string,
    id: number | string,
  ): void {
    if (!version) {
      throw new NotFoundException(`${label} with ID ${id} not found`);
    }
    if (version.status !== ProcedureStatus.DRAFT) {
      throw new BadRequestException(
        'The procedure tree can only be modified while its version is a DRAFT.',
      );
    }
  }

  private collectPublishProblems(version: any): string[] {
    const problems: string[] = [];

    for (const phase of version.phases ?? []) {
      for (const subPhase of phase.subPhases ?? []) {
        for (const item of subPhase.items ?? []) {
          for (const event of item.events ?? []) {
            for (const rule of event.validationRules ?? []) {
              if (!rule.expr || String(rule.expr).trim() === '') {
                problems.push(
                  `Item "${item.name}" / event "${event.name}": validation rule ${rule.id} has an empty expression.`,
                );
              } else {
                const check = validateExpr(String(rule.expr));
                if (!check.ok) {
                  problems.push(
                    `Item "${item.name}" / event "${event.name}": validation rule ${rule.id} has an invalid expression (${check.error}).`,
                  );
                }
              }

              if (item.verifiability === 'AUTO') {
                const aliases = rule.aliases;
                if (!Array.isArray(aliases) || aliases.length === 0) {
                  problems.push(
                    `AUTO item "${item.name}" / event "${event.name}": validation rule ${rule.id} has empty aliases.`,
                  );
                }
              }
            }
          }
        }
      }
    }

    return problems;
  }

  // ===== Mappers =====

  private mapSummary(version: any): ProcedureVersionSummaryDto {
    return {
      id: version.id,
      aircraftModelCode: version.aircraftModelCode,
      version: version.version,
      status: version.status,
      publishedAt: version.publishedAt,
      baseScore: version.baseScore,
      passingScore: version.passingScore,
      weightStd: version.weightStd,
      weightExc: version.weightExc,
      weightDev: version.weightDev,
      weightCmp: version.weightCmp,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  private mapTree(version: any): ProcedureVersionTreeDto {
    return {
      ...this.mapSummary(version),
      phases: (version.phases ?? []).map((phase: any) => this.mapPhase(phase)),
    };
  }

  private mapPhase(phase: any): PhaseResponseDto {
    return {
      id: phase.id,
      procedureVersionId: phase.procedureVersionId,
      name: phase.name,
      order: phase.order,
      entryExpr: phase.entryExpr ?? null,
      subPhases: (phase.subPhases ?? []).map((subPhase: any) => ({
        id: subPhase.id,
        phaseId: subPhase.phaseId,
        name: subPhase.name,
        order: subPhase.order,
        items: (subPhase.items ?? []).map((item: any) => ({
          id: item.id,
          subPhaseId: item.subPhaseId,
          name: item.name,
          order: item.order,
          verifiability: item.verifiability,
          source: item.source,
          events: (item.events ?? []).map((event: any) => this.mapEvent(event)),
        })),
      })),
    };
  }

  private mapEvent(event: any): EventResponseDto {
    return {
      id: event.id,
      name: event.name,
      severityId: event.severityId,
      reference: event.reference,
      checklistItemId: event.checklistItemId,
      description: event.eventDescription?.description ?? null,
      severity: event.severity
        ? {
            id: event.severity.id,
            name: event.severity.name,
            points: event.severity.points,
          }
        : undefined,
      validationRules: (event.validationRules ?? []).map((rule: any) => ({
        id: rule.id,
        eventId: rule.eventId,
        type: rule.type,
        phase: rule.phase,
        aliases: rule.aliases,
        expr: rule.expr,
        params: rule.params,
        details: rule.details,
      })),
    };
  }
}
