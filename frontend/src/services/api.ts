import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Backend errors come in a few shapes: NestJS default `{ message }` (string or
// string[] for validation), our custom `{ error }`, or a bare string.
export type ApiError = {
  message?: string | string[];
  error?: string;
};

/**
 * Turn any axios failure into a human message that ALWAYS says what happened
 * and, where possible, what to do next. Never surfaces a bare "it failed".
 */
export function humanizeApiError(
  error: AxiosError<ApiError> | AxiosError<never>
): string {
  // No response: network down, CORS, or timeout.
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'A solicitação demorou demais para responder. Verifique sua conexão e tente novamente.';
    }
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente em instantes.';
  }

  const data = error.response.data as ApiError | string | undefined;
  const raw =
    typeof data === 'string'
      ? data
      : Array.isArray(data?.message)
        ? data?.message.join(' ')
        : data?.message ?? data?.error;

  if (typeof raw === 'string' && raw.trim()) return raw;

  // No usable message from the server: explain by status + offer a next step.
  switch (error.response.status) {
    case 400:
      return 'Alguns dados enviados são inválidos. Revise os campos e tente novamente.';
    case 401:
      return 'Sua sessão expirou. Faça login novamente para continuar.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'Não encontramos o que você procurava. Atualize a página e tente novamente.';
    case 409:
      return 'Esta ação conflita com o estado atual. Atualize a página e tente novamente.';
    case 500:
      return 'Tivemos um problema no servidor. Tente novamente em alguns instantes.';
    default:
      return `Algo deu errado (erro ${error.response.status}). Tente novamente em instantes.`;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('_auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError> | AxiosError<never>) => {
    toast.error(humanizeApiError(error));
    return Promise.reject(error);
  }
);

export default api;
