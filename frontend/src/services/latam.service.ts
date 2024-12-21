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

interface Flight {
  id: number;
  flightDutyId: number;
  routeId: string;
  userId: number;
  aircraftRegistration: string;
  isClosed: boolean;
  index: number;
  route: Route;
}

export interface FlightDutyResponse {
  id: number;
  createdAt: string; // ISO8601 date format
  expirationDate: string; // ISO8601 date format
  userId: number;
  aircraftRegistration: string;
  isClosed: boolean;
  flights: Flight[]; // Lista de voos
}

interface WeatherCondition {
  code: string;
  text: string;
}

interface RainCondition extends WeatherCondition {
  code: 'RA';
  text: 'Light Rain' | 'Moderate Rain' | 'Heavy Rain';
}

interface ThunderstormCondition extends WeatherCondition {
  code: 'TSRA';
}

type MetarCondition = RainCondition | ThunderstormCondition | WeatherCondition;

type CloudCode = 'FEW' | 'SCT' | 'BKN' | 'OVC';

export interface MetarData {
  icao: string;
  barometer: {
    hg: number;
    hpa: number;
    kpa: number;
    mb: number;
  };
  clouds: Array<{
    base_feet_agl: number;
    base_meters_agl: number;
    code: CloudCode;
    text: string;
    feet: number;
    meters: number;
  }>;
  dewpoint: {
    celsius: number;
    fahrenheit: number;
  };
  elevation: {
    feet: number;
    meters: number;
  };
  flight_category: string;
  humidity: {
    percent: number;
  };
  observed: string; // Ex: "2024-12-13T21:51:00"
  station: {
    geometry: {
      coordinates: [number, number];
      type: string;
    };
    location: string;
    name: string;
    type: string;
  };
  temperature: {
    celsius: number;
    fahrenheit: number;
  };
  raw_text: string;
  visibility: {
    miles: string;
    miles_float: number;
    meters: string;
    meters_float: number;
  };
  wind: {
    degrees: number;
    speed_kph: number;
    speed_kts: number;
    speed_mph: number;
    speed_mps: number;
  };
  conditions?: Array<MetarCondition>;
}

export type SunriseSunsetTypes = {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
    type: 'POINT';
  };
  icao: string; // ICAO airport code or station indicator
  name: string; // Airport or station name
  sunrise_sunset: {
    local: {
      current: string; // Current local timestamp in ISO format
      dawn: string; // Dawn local HH:MM:SS
      dusk: string; // Dusk local HH:MM:SS
      noon: string; // Noon local HH:MM:SS
      sunrise: string; // Sunrise local HH:MM:SS
      sunset: string; // Sunset local HH:MM:SS
    };
    utc: {
      current: string; // Current UTC timestamp in ISO format
      dawn: string; // Dawn UTC HH:MM:SS
      dusk: string; // Dusk UTC HH:MM:SS
      noon: string; // Noon UTC HH:MM:SS
      sunrise: string; // Sunrise UTC HH:MM:SS
      sunset: string; // Sunset UTC HH:MM:SS
    };
  };
  timezone: {
    dst: number; // Timezone offset subtracted or added to GMT time including DST
    gmt: number; // Timezone offset subtracted or added to GMT time
    tzid: string; // Timezone id string
    zone: string; // Timezone text string
  };
};

export type MetarRespose = {
  [airport: string]: MetarData;
};

export type SuntimesRespose = {
  [airport: string]: SunriseSunsetTypes;
};

export const checkIfUsernameExistsByUsernameOrEmail = (
  usernameOrEmail: string
) => {
  return api.get<boolean>(`user`, { params: { usernameOrEmail } });
};

export const getRoutes = () => {
  return api.get<Array<Route>>('routes');
};

export const getMetar = () => {
  return api.get<MetarRespose>('weather/metar');
};

export const getSuntimes = () => {
  return api.get<SuntimesRespose>('weather/suntimes');
};

export const getFlightDutyRequest = () => {
  return api.get<FlightDutyResponse>('flight-duty');
};
