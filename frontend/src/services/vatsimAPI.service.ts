import { vatsimAPI } from './vatsimAPI.ts';

export const getVATSIMATCsOnline = () => {
  return vatsimAPI.get(`/tracker/whazzup`);
};
