import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getExamTemplates, 
  getExamTemplateWithQuestions,
  createExamTemplate, 
  updateExamTemplate, 
  deleteExamTemplate} from '../../services/latam/exam.service';

export const useExamTemplates = () => {
  return useQuery({
    queryKey: ['exam-templates'],
    queryFn: async () => {
      const response = await getExamTemplates();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExamTemplate = (id: number) => {
  return useQuery({
    queryKey: ['exam-template', id],
    queryFn: async () => {
      const response = await getExamTemplateWithQuestions(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateExamTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof createExamTemplate>[0]) => {
      const response = await createExamTemplate(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
    },
  });
};

export const useUpdateExamTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Parameters<typeof updateExamTemplate>[1] }) => {
      const response = await updateExamTemplate(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
      queryClient.invalidateQueries({ queryKey: ['exam-template', id] });
    },
  });
};

export const useDeleteExamTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteExamTemplate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-templates'] });
    },
  });
};
