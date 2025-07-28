import { api } from './api';

export type UpdatePlanRequest = {
  plan: 'FREE' | 'GOLD';
};

export const updateUserPlan = async (data: UpdatePlanRequest) => {
  const response = await api.put('/user/plan', data);
  return response.data;
}; 