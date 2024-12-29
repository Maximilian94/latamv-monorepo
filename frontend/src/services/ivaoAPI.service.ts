import { ivaoAPI } from './ivaoAPI.ts';
import { IVAOUsersOnline } from './ivaoAPI.type.ts';

export const getIvaoUsersOnline = () => {
  return ivaoAPI.get<IVAOUsersOnline>(`/tracker/whazzup`);
};
