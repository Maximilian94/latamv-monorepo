import api from './api';
import { AxiosResponse } from 'axios';

export type Credentials = {
  emailOrUsername: string;
  password: string;
};

export type LoginResponse = {
  authToken: string;
  user: User;
};

export type User = {
  id: number;
  name: string;
  email: string;
  username: string;
  roles?: Role[];
  flightHours?: number;
  permissions?: Array<Permission>;
};

export type CreateUser = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export type PermissionMame = 'ACCESS_ADMIN_PANEL';

export type Permission = {
  id: number;
  name: PermissionMame;
  description: string;
  groupId: number;
};

export type Role = { id: number; name: string };

export const login = async (
  credentials: Credentials
): Promise<AxiosResponse<LoginResponse>> => {
  return api.post<LoginResponse>('/auth/login', credentials);
};

export const validateToken = async (): Promise<
  AxiosResponse<LoginResponse>
> => {
  return api.get<LoginResponse>('/auth/validate-token');
};

export const createUser = async (newUser: CreateUser) => {
  return api.post<LoginResponse>('/auth/register', newUser);
};
