import api from './api.ts';

export const checkIfUsernameExistsByUsernameOrEmail = (
  usernameOrEmail: string
) => {
  return api.get<boolean>(`user`, { params: { usernameOrEmail } });
};
