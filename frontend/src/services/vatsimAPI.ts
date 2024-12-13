import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export type ApiError = {
  message: string;
};

export const vatsimAPI = axios.create({
  baseURL: 'https://auth.vatsim.net',
  timeout: 10000,
});

vatsimAPI.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('vatsim-authorization-code');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

vatsimAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  () => {
    return toast.error('VATSIM Endpoint Error');
  }
);
