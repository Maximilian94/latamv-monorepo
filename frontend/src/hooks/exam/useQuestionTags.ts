import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getQuestionTags, 
  createQuestionTag, 
  updateQuestionTag, 
  deleteQuestionTag
} from '../../services/latam/exam.service';

export const useQuestionTags = () => {
  return useQuery({
    queryKey: ['question-tags'],
    queryFn: async () => {
      const response = await getQuestionTags();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateQuestionTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof createQuestionTag>[0]) => {
      const response = await createQuestionTag(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
    },
  });
};

export const useUpdateQuestionTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Parameters<typeof updateQuestionTag>[1] }) => {
      const response = await updateQuestionTag(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
    },
  });
};

export const useDeleteQuestionTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteQuestionTag(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-tags'] });
    },
  });
};
