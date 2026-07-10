import { api } from '../api';

// ===== Enums (mirrors backend Prisma enums) =====
export type ProcedureStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Verifiability = 'AUTO' | 'MANUAL' | 'NOT_SIMULATED';
export type ProcedureItemSource = 'FCOM' | 'OPERATOR_POLICY';
export type ValidationRuleType =
  | 'SNAPSHOT'
  | 'CONTINUOUS'
  | 'PRECONDITION'
  | 'SEQUENCE';

// ===== Response types (mirror procedure-version-response.dto.ts) =====
export interface ValidationRule {
  id: number;
  eventId: string;
  type: ValidationRuleType;
  phase: string;
  aliases: string[];
  expr: string;
  params?: Record<string, unknown> | null;
  details?: unknown;
}

export interface EventSeverity {
  id: number;
  name: string;
  points: number;
}

export interface ProcedureEvent {
  id: string;
  name: string;
  severityId: number;
  reference?: string | null;
  checklistItemId?: number | null;
  description?: string | null;
  severity?: EventSeverity;
  validationRules: ValidationRule[];
}

export interface ChecklistItem {
  id: number;
  subPhaseId: number;
  name: string;
  order: number;
  verifiability: Verifiability;
  source: ProcedureItemSource;
  events: ProcedureEvent[];
}

export interface SubPhase {
  id: number;
  phaseId: number;
  name: string;
  order: number;
  items: ChecklistItem[];
}

export interface Phase {
  id: number;
  procedureVersionId: number;
  name: string;
  order: number;
  entryExpr?: string | null;
  subPhases: SubPhase[];
}

export interface ProcedureVersionSummary {
  id: number;
  aircraftModelCode: string;
  version: number;
  status: ProcedureStatus;
  publishedAt?: string | null;
  baseScore: number;
  passingScore: number;
  weightStd: number;
  weightExc: number;
  weightDev: number;
  weightCmp: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedureVersionTree extends ProcedureVersionSummary {
  phases: Phase[];
}

export interface Dataref {
  id: number;
  packageId: number;
  alias: string;
  datarefName: string;
  unit?: string | null;
  valueType: string;
  arrayIndex?: number | null;
  description?: string | null;
}

export interface AircraftPackage {
  id: number;
  code: string;
  model: string;
  author?: string | null;
  description?: string | null;
  datarefs: Dataref[];
}

export interface PublishedBundle {
  version: ProcedureVersionSummary;
  phases: Phase[];
  datarefs: Dataref[];
}

export interface TestRuleResult {
  result: boolean;
  resolved: Record<string, unknown>;
  error?: string;
}

// ===== Payload types =====
export interface CreateProcedureVersionPayload {
  aircraftModelCode: string;
  baseScore?: number;
  passingScore?: number;
  weightStd?: number;
  weightExc?: number;
  weightDev?: number;
  weightCmp?: number;
}
export type UpdateProcedureVersionPayload = Partial<CreateProcedureVersionPayload>;

export interface CreatePhasePayload {
  procedureVersionId: number;
  name: string;
  order?: number;
  entryExpr?: string;
}
export type UpdatePhasePayload = Partial<Omit<CreatePhasePayload, 'procedureVersionId'>>;

export interface CreateSubPhasePayload {
  phaseId: number;
  name: string;
  order?: number;
}
export type UpdateSubPhasePayload = Partial<Omit<CreateSubPhasePayload, 'phaseId'>>;

export interface CreateItemPayload {
  subPhaseId: number;
  name: string;
  order?: number;
  verifiability?: Verifiability;
  source?: ProcedureItemSource;
}
export type UpdateItemPayload = Partial<Omit<CreateItemPayload, 'subPhaseId'>>;

export interface CreateEventPayload {
  checklistItemId: number;
  name: string;
  severityId: number;
  reference?: string;
  description?: string;
}
export type UpdateEventPayload = Partial<Omit<CreateEventPayload, 'checklistItemId'>> & {
  checklistItemId?: number;
};

export interface CreateRulePayload {
  eventId: string;
  type: ValidationRuleType;
  phase: string;
  aliases: string[];
  expr: string;
  params?: Record<string, unknown>;
  details?: unknown;
}
export type UpdateRulePayload = Partial<CreateRulePayload>;

export interface CreatePackagePayload {
  code: string;
  model: string;
  author?: string;
  description?: string;
}
export type UpdatePackagePayload = Partial<CreatePackagePayload>;

export interface CreateDatarefPayload {
  packageId: number;
  alias: string;
  datarefName: string;
  unit?: string;
  valueType?: string;
  arrayIndex?: number;
  description?: string;
}
export type UpdateDatarefPayload = Partial<Omit<CreateDatarefPayload, 'packageId'>>;

// ===== Versions =====
export const getProcedureVersions = (aircraftModelCode?: string) =>
  api.get<ProcedureVersionSummary[]>('/procedures/versions', {
    params: aircraftModelCode ? { aircraftModelCode } : undefined,
  });
export const getProcedureVersion = (id: number) =>
  api.get<ProcedureVersionTree>(`/procedures/versions/${id}`);
export const createProcedureVersion = (data: CreateProcedureVersionPayload) =>
  api.post<ProcedureVersionSummary>('/procedures/versions', data);
export const updateProcedureVersion = (id: number, data: UpdateProcedureVersionPayload) =>
  api.patch<ProcedureVersionTree>(`/procedures/versions/${id}`, data);
export const deleteProcedureVersion = (id: number) =>
  api.delete(`/procedures/versions/${id}`);
export const publishProcedureVersion = (id: number) =>
  api.post<ProcedureVersionTree>(`/procedures/versions/${id}/publish`);
export const newDraftFromPublished = (id: number) =>
  api.post<ProcedureVersionTree>(`/procedures/versions/${id}/new-draft`);
export const getPublishedBundle = (aircraftModelCode: string) =>
  api.get<PublishedBundle>('/procedures/published', {
    params: { aircraftModelCode },
  });

// ===== Phases =====
export const createPhase = (data: CreatePhasePayload) =>
  api.post<Phase>('/procedures/phases', data);
export const updatePhase = (id: number, data: UpdatePhasePayload) =>
  api.patch<Phase>(`/procedures/phases/${id}`, data);
export const deletePhase = (id: number) => api.delete(`/procedures/phases/${id}`);

// ===== SubPhases =====
export const createSubPhase = (data: CreateSubPhasePayload) =>
  api.post<SubPhase>('/procedures/subphases', data);
export const updateSubPhase = (id: number, data: UpdateSubPhasePayload) =>
  api.patch<SubPhase>(`/procedures/subphases/${id}`, data);
export const deleteSubPhase = (id: number) =>
  api.delete(`/procedures/subphases/${id}`);

// ===== Items =====
export const createItem = (data: CreateItemPayload) =>
  api.post<ChecklistItem>('/procedures/items', data);
export const updateItem = (id: number, data: UpdateItemPayload) =>
  api.patch<ChecklistItem>(`/procedures/items/${id}`, data);
export const deleteItem = (id: number) => api.delete(`/procedures/items/${id}`);

// ===== Events =====
export const createEvent = (data: CreateEventPayload) =>
  api.post<ProcedureEvent>('/procedures/events', data);
export const updateEvent = (id: string, data: UpdateEventPayload) =>
  api.patch<ProcedureEvent>(`/procedures/events/${id}`, data);
export const deleteEvent = (id: string) => api.delete(`/procedures/events/${id}`);

// ===== Rules =====
export const createRule = (data: CreateRulePayload) =>
  api.post<ValidationRule>('/procedures/rules', data);
export const updateRule = (id: number, data: UpdateRulePayload) =>
  api.patch<ValidationRule>(`/procedures/rules/${id}`, data);
export const deleteRule = (id: number) => api.delete(`/procedures/rules/${id}`);
export const testRule = (data: { expr: string; frame: Record<string, number> }) =>
  api.post<TestRuleResult>('/procedures/rules/test', data);

// ===== Packages =====
export const getPackages = () => api.get<AircraftPackage[]>('/procedures/packages');
export const createPackage = (data: CreatePackagePayload) =>
  api.post<AircraftPackage>('/procedures/packages', data);
export const updatePackage = (id: number, data: UpdatePackagePayload) =>
  api.patch<AircraftPackage>(`/procedures/packages/${id}`, data);
export const deletePackage = (id: number) =>
  api.delete(`/procedures/packages/${id}`);

// ===== Datarefs =====
export const createDataref = (data: CreateDatarefPayload) =>
  api.post<Dataref>('/procedures/datarefs', data);
export const updateDataref = (id: number, data: UpdateDatarefPayload) =>
  api.patch<Dataref>(`/procedures/datarefs/${id}`, data);
export const deleteDataref = (id: number) =>
  api.delete(`/procedures/datarefs/${id}`);
