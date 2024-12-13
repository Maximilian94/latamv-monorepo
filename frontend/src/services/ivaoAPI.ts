import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export type ApiError = {
  message: string;
};

export const ivaoAPI = axios.create({
  baseURL: 'https://api.ivao.aero',
  timeout: 10000,
});

ivaoAPI.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('ivao-access-token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

ivaoAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (_error: AxiosError<ApiError> | AxiosError<never>) => {
    return toast.error('IVAO Endpoint Error');
  }
);
