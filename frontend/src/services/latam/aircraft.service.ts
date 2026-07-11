import api from '../api.ts';

export interface AircraftModelRef {
  code: string;
  model: string;
  manufacturer?: string;
}

export interface Aircraft {
  registration: string;
  type: string;
  engine: string;
  active: boolean;
  available: boolean;
  aircraftModelCode: string;
  aircraftModel?: AircraftModelRef;
}

export interface CreateAircraftPayload {
  registration: string;
  type: string;
  engine?: string;
  active?: boolean;
  available?: boolean;
  aircraftModelCode: string;
}
export type UpdateAircraftPayload = Partial<
  Omit<CreateAircraftPayload, 'registration'>
>;

export const getAircrafts = () => api.get<Aircraft[]>('aircraft');
export const getAircraftModels = () =>
  api.get<AircraftModelRef[]>('aircraft/models');
export const createAircraft = (data: CreateAircraftPayload) =>
  api.post<Aircraft>('aircraft', data);
export const updateAircraft = (
  registration: string,
  data: UpdateAircraftPayload
) => api.patch<Aircraft>(`aircraft/${registration}`, data);
