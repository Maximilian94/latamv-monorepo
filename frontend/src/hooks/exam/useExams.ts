import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getExams, 
  getExamDetail,
  startExam, 
  submitAnswer, 
  finishExam, 
  abandonExam 
} from '../../services/latam/exam.service';

export const useExams = (params?: {
  userId?: number;
  examTemplateId?: number;
  status?: string;
  skip?: number;
  take?: number;
}) => {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: async () => {
      const response = await getExams(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useExam = (id: number) => {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await getExamDetail(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useStartExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof startExam>[0]) => {
      const response = await startExam(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ examId, data }: { examId: number; data: Parameters<typeof submitAnswer>[1] }) => {
      const response = await submitAnswer(examId, data);
      return response.data;
    },
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useFinishExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (examId: number) => {
      const response = await finishExam(examId);
      return response.data;
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useAbandonExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (examId: number) => {
      const response = await abandonExam(examId);
      return response.data;
    },
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};
