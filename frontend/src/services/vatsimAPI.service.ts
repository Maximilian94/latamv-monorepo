import { vatsimAPI } from './vatsimAPI.ts';

type GetOAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export const getAndSetOAuthToken = async () => {
  const token = await vatsimAPI
    .post<GetOAuthTokenResponse>(
      'oauth/token',
      {
        // grant_type: 'authorization_code',
        // client_id: '1157540',
        // client_secret: '320882',
        // scope: 'full_name',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      }
    )
    .then((res) => res.data);
  localStorage.setItem('vatsim-authorization-code', token.access_token);
  return token;
};

export const getAndSetOAuthToken2 = async () => {
  const clientID = '1157540'; // Substitua pelo seu Client ID
  const redirectURI = 'http://localhost:3000/callback'; // Substitua pela sua URL de callback
  const scope = 'full_name email vatsim_details'; // Defina os escopos que você precisa
  const state = 'algum-valor-para-seguranca'; // Um valor opcional de estado para prevenir CSRF
  const prompt = 'login'; // Pode ser 'none', 'login', ou 'consent'

  const token = await vatsimAPI
    .get<any>(
      `oauth/authorize?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scope}&state=${state}&prompt=${prompt}`
    )
    .then((res) => res.data);
  return token;
};

export const getUserInformation = (id: string) => {
  return vatsimAPI.get(`v2/members/${id}`);
};
export const getUseMe = () => {
  return vatsimAPI.get(`v2/users/me`);
};
