import axios from 'axios';
import toast from 'react-hot-toast';

export const vatsimAPI = axios.create({
  baseURL: 'https://api.ivao.aero/v2',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

vatsimAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  () => {
    return toast.error('VATSIM Endpoint Error');
  }
);

// https://api.ivao.aero/v2/tracker/whazzup
