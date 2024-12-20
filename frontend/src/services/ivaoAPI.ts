import axios from 'axios';
import toast from 'react-hot-toast';

export const ivaoAPI = axios.create({
  baseURL: 'https://api.ivao.aero/v2',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

ivaoAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  () => {
    return toast.error('VATSIM Endpoint Error');
  }
);
