import { ivaoAPI } from './ivaoAPI.ts';

export const getIvaoUsersOnline = () => {
  return ivaoAPI.get<IVAOUsersOnline>(`/tracker/whazzup`);
};
