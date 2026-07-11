import {
  ProcedureStatus,
  Verifiability,
  ProcedureItemSource,
  ValidationRuleType,
} from '@prisma/client';

export class ValidationRuleResponseDto {
  id: number;
  eventId: string;
  type: ValidationRuleType;
  phase: string;
  aliases: any;
  expr: string;
  params?: any;
  details?: any;
}

export class EventSeverityResponseDto {
  id: number;
  name: string;
  points: number;
}

export class EventResponseDto {
  id: string;
  name: string;
  severityId: number;
  reference?: string | null;
  checklistItemId?: number | null;
  description?: string | null;
  severity?: EventSeverityResponseDto;
  validationRules: ValidationRuleResponseDto[];
}

export class ChecklistItemResponseDto {
  id: number;
  subPhaseId: number;
  name: string;
  order: number;
  verifiability: Verifiability;
  source: ProcedureItemSource;
  events: EventResponseDto[];
}

export class SubPhaseResponseDto {
  id: number;
  phaseId: number;
  name: string;
  order: number;
  items: ChecklistItemResponseDto[];
}

export class PhaseResponseDto {
  id: number;
  procedureVersionId: number;
  name: string;
  order: number;
  entryExpr?: string | null;
  subPhases: SubPhaseResponseDto[];
}

export class ProcedureVersionSummaryDto {
  id: number;
  aircraftModelCode: string;
  version: number;
  status: ProcedureStatus;
  publishedAt?: Date | null;
  baseScore: number;
  passingScore: number;
  weightStd: number;
  weightExc: number;
  weightDev: number;
  weightCmp: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProcedureVersionTreeDto extends ProcedureVersionSummaryDto {
  phases: PhaseResponseDto[];
}

export class DatarefResponseDto {
  id: number;
  packageId: number;
  alias: string;
  datarefName: string;
  unit?: string | null;
  valueType: string;
  arrayIndex?: number | null;
  description?: string | null;
}

export class PublishedBundleDto {
  version: ProcedureVersionSummaryDto;
  phases: PhaseResponseDto[];
  datarefs: DatarefResponseDto[];
}
