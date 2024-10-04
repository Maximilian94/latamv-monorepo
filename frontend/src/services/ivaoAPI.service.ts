import axios from 'axios';
import { ivaoAPI } from './ivaoAPI.ts';

const OPENID_URL = 'https://api.ivao.aero/.well-known/openid-configuration';

type GetOAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export const getAndSetOAuthToken = async () => {
  const openIdConfig = await ivaoAPI.get(OPENID_URL).then((res) => res.data);
  const token = await axios
    .post<GetOAuthTokenResponse>(openIdConfig.token_endpoint, {
      grant_type: 'client_credentials',
      client_id: 'a9467ae9-8a35-4fe7-aa5b-3e73bb1178ec',
      client_secret: '0acy9YL0q55yIW3tSfTnaI9f93Km2nI0',
      // scope: 'tracker'
    })
    .then((res) => res.data);
  localStorage.setItem('ivao-access-token', token.access_token);
  return token;
};

export const getUserInformation = (id: string) => {
  return ivaoAPI.get(`v2/users/${id}`);
};
export const getUseMe = () => {
  return ivaoAPI.get(`v2/users/me`);
};
