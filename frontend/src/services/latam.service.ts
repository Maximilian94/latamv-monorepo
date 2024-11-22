import api from './api.ts';

export type Route = {
  aircraft_model_code: string;
  arrival_icao: string;
  available: boolean;
  departure_icao: string;
  eet: string;
  eobt: string;
  flight_level: string;
  flight_number: string;
  id: string;
  rmk: string;
  route: string;
  speed: string;
  updated_at: string;
  weekday: string;
};

export const checkIfUsernameExistsByUsernameOrEmail = (
  usernameOrEmail: string
) => {
  return api.get<boolean>(`user`, { params: { usernameOrEmail } });
};

export const getRoutes = () => {
  return api.get<Array<Route>>('routes');
};
