import { api } from './api';

export interface Award {
  id: number;
  name: string;
  image?: string;
  description: string;
  tooltip: string;
  validityDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAward {
  id: number;
  userId: number;
  awardId: number;
  obtainedAt: string;
  expiresAt: string;
  updatedAt: string;
  award?: Award;
}

export interface AwardWithUserAward extends Award {
  userAward?: UserAward;
  isExpired?: boolean;
  daysUntilExpiration?: number;
}

export interface CreateAwardDto {
  name: string;
  image?: string;
  description: string;
  tooltip: string;
  validityDuration: number;
}

export interface UpdateAwardDto {
  name?: string;
  image?: string;
  description?: string;
  tooltip?: string;
  validityDuration?: number;
}

export class AwardsService {
  static async getAllAwards(): Promise<Award[]> {
    const response = await api.get('/awards');
    return response.data;
  }

  static async getAwardById(id: number): Promise<Award> {
    const response = await api.get(`/awards/${id}`);
    return response.data;
  }

  static async createAward(data: CreateAwardDto): Promise<Award> {
    const response = await api.post('/awards', data);
    return response.data;
  }

  static async updateAward(id: number, data: UpdateAwardDto): Promise<Award> {
    const response = await api.put(`/awards/${id}`, data);
    return response.data;
  }

  static async deleteAward(id: number): Promise<Award> {
    const response = await api.delete(`/awards/${id}`);
    return response.data;
  }

  static async getUserAwards(userId: number): Promise<UserAward[]> {
    const response = await api.get(`/awards/user/${userId}`);
    return response.data;
  }

  static async getAllAwardsWithUserStatus(userId: number): Promise<AwardWithUserAward[]> {
    const response = await api.get(`/awards/user/${userId}/all`);
    return response.data;
  }

  static async getUserAward(userId: number, awardId: number): Promise<UserAward> {
    const response = await api.get(`/awards/user/${userId}/${awardId}`);
    return response.data;
  }

  static async obtainAward(awardId: number): Promise<UserAward> {
    const response = await api.post(`/awards/${awardId}/obtain`);
    return response.data;
  }

  static async removeUserAward(userId: number, awardId: number): Promise<UserAward> {
    const response = await api.delete(`/awards/user/${userId}/${awardId}`);
    return response.data;
  }
}
