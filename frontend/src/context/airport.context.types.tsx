import { MetarRespose } from '../services/latam/latam.service.ts';

export interface AirportJSONData {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state: string;
  country: string;
  elevation: number;
  lat: number;
  lon: number;
  tz: string;
}

export type SingleAirportDataMapMETAR = MetarRespose[string] & {
  svg: string;
};

export type SingleAirportDataMap = {
  atc: {
    ivao: Array<'D' | 'G' | 'T' | 'A'>;
    vatsim: Array<'D' | 'G' | 'T' | 'A'>;
  };
  metar: SingleAirportDataMapMETAR | { svg: string; raw_text: string };
  details: AirportJSONData;
};
export type AirportDataMap = Map<string, SingleAirportDataMap>;
