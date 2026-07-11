import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDataref,
  createEvent,
  createItem,
  createPackage,
  createPhase,
  createProcedureVersion,
  createRule,
  createSubPhase,
  deleteDataref,
  deleteEvent,
  deleteItem,
  deletePackage,
  deletePhase,
  deleteProcedureVersion,
  deleteRule,
  deleteSubPhase,
  getPackages,
  getProcedureVersion,
  getProcedureVersions,
  newDraftFromPublished,
  publishProcedureVersion,
  testRule,
  updateDataref,
  updateEvent,
  updateItem,
  updatePackage,
  updatePhase,
  updateProcedureVersion,
  updateRule,
  updateSubPhase,
  type CreateDatarefPayload,
  type CreateEventPayload,
  type CreateItemPayload,
  type CreatePackagePayload,
  type CreatePhasePayload,
  type CreateProcedureVersionPayload,
  type CreateRulePayload,
  type CreateSubPhasePayload,
  type UpdateDatarefPayload,
  type UpdateEventPayload,
  type UpdateItemPayload,
  type UpdatePackagePayload,
  type UpdatePhasePayload,
  type UpdateProcedureVersionPayload,
  type UpdateRulePayload,
  type UpdateSubPhasePayload,
} from '../../services/latam/procedures.service';

const STALE = 5 * 60 * 1000;

// ===== Queries =====
export const useProcedureVersions = (aircraftModelCode?: string) =>
  useQuery({
    queryKey: ['procedure-versions', aircraftModelCode ?? 'all'],
    queryFn: async () => {
      const res = await getProcedureVersions(aircraftModelCode);
      return res.data;
    },
    staleTime: STALE,
  });

export const useProcedureVersion = (id?: number) =>
  useQuery({
    queryKey: ['procedure-version', id],
    queryFn: async () => {
      const res = await getProcedureVersion(id as number);
      return res.data;
    },
    enabled: !!id,
  });

export const useProcedurePackages = () =>
  useQuery({
    queryKey: ['procedure-packages'],
    queryFn: async () => {
      const res = await getPackages();
      return res.data;
    },
    staleTime: STALE,
  });

// Helper that invalidates every version-scoped query.
const useInvalidateProcedures = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['procedure-versions'] });
    queryClient.invalidateQueries({ queryKey: ['procedure-version'] });
  };
};

// ===== Version mutations =====
export const useCreateProcedureVersion = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreateProcedureVersionPayload) => {
      const res = await createProcedureVersion(data);
      return res.data;
    },
    onSuccess: invalidate,
  });
};

export const useUpdateProcedureVersion = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProcedureVersionPayload }) => {
      const res = await updateProcedureVersion(id, data);
      return res.data;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteProcedureVersion = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteProcedureVersion(id);
      return res.data;
    },
    onSuccess: invalidate,
  });
};

export const usePublishProcedureVersion = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await publishProcedureVersion(id);
      return res.data;
    },
    onSuccess: invalidate,
  });
};

export const useNewDraftFromPublished = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await newDraftFromPublished(id);
      return res.data;
    },
    onSuccess: invalidate,
  });
};

// ===== Phase mutations =====
export const useCreatePhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreatePhasePayload) => (await createPhase(data)).data,
    onSuccess: invalidate,
  });
};
export const useUpdatePhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePhasePayload }) =>
      (await updatePhase(id, data)).data,
    onSuccess: invalidate,
  });
};
export const useDeletePhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => (await deletePhase(id)).data,
    onSuccess: invalidate,
  });
};

// ===== SubPhase mutations =====
export const useCreateSubPhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreateSubPhasePayload) => (await createSubPhase(data)).data,
    onSuccess: invalidate,
  });
};
export const useUpdateSubPhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSubPhasePayload }) =>
      (await updateSubPhase(id, data)).data,
    onSuccess: invalidate,
  });
};
export const useDeleteSubPhase = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => (await deleteSubPhase(id)).data,
    onSuccess: invalidate,
  });
};

// ===== Item mutations =====
export const useCreateItem = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreateItemPayload) => (await createItem(data)).data,
    onSuccess: invalidate,
  });
};
export const useUpdateItem = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateItemPayload }) =>
      (await updateItem(id, data)).data,
    onSuccess: invalidate,
  });
};
export const useDeleteItem = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => (await deleteItem(id)).data,
    onSuccess: invalidate,
  });
};

// ===== Event mutations =====
export const useCreateEvent = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreateEventPayload) => (await createEvent(data)).data,
    onSuccess: invalidate,
  });
};
export const useUpdateEvent = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventPayload }) =>
      (await updateEvent(id, data)).data,
    onSuccess: invalidate,
  });
};
export const useDeleteEvent = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: string) => (await deleteEvent(id)).data,
    onSuccess: invalidate,
  });
};

// ===== Rule mutations =====
export const useCreateRule = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (data: CreateRulePayload) => (await createRule(data)).data,
    onSuccess: invalidate,
  });
};
export const useUpdateRule = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRulePayload }) =>
      (await updateRule(id, data)).data,
    onSuccess: invalidate,
  });
};
export const useDeleteRule = () => {
  const invalidate = useInvalidateProcedures();
  return useMutation({
    mutationFn: async (id: number) => (await deleteRule(id)).data,
    onSuccess: invalidate,
  });
};

export const useTestRule = () =>
  useMutation({
    mutationFn: async (data: { expr: string; frame: Record<string, number> }) =>
      (await testRule(data)).data,
  });

// ===== Package & Dataref mutations =====
export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePackagePayload) => (await createPackage(data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePackagePayload }) =>
      (await updatePackage(id, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await deletePackage(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
export const useCreateDataref = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDatarefPayload) => (await createDataref(data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
export const useUpdateDataref = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDatarefPayload }) =>
      (await updateDataref(id, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
export const useDeleteDataref = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await deleteDataref(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-packages'] }),
  });
};
