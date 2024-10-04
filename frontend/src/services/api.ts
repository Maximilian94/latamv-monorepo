import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export type ApiError = {
  message: string;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log('Resposta', response);
    return response;
  },
  (error: AxiosError<ApiError> | AxiosError<never>) => {
    console.log('Vish', error);
    if (error.response) {
      if (error.response.data.message) {
        return toast.error(error.response.data.message);
      }
      return toast.error("This didn't work.");
    } else {
      return toast.error(error.message);
    }
  }
);

export default api;
