import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion 
} from '../../services/latam/exam.service';

export const useQuestions = (params?: {
  tagId?: number;
  tagIds?: number[];
  isActive?: boolean;
  difficulty?: number;
  skip?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: async () => {
      const response = await getQuestions(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof createQuestion>[0]) => {
      const response = await createQuestion(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Parameters<typeof updateQuestion>[1] }) => {
      const response = await updateQuestion(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteQuestion(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
};
