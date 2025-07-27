import api from '../api.ts';
import { AxiosResponse } from 'axios';
import { APILatamError, PostGenerateFlightDutyParams } from './latam.types.ts';
import { useQuery } from '@tanstack/react-query';

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

export interface Flight {
  id: number;
  flightDutyId: number;
  routeId: string;
  userId: number;
  aircraftRegistration: string;
  isClosed: boolean;
  index: number;
  route: Route;
  startAcarsTime: string;
  endAcarsTime: string;
  OUT: string;
  OFF: string;
  ON: string;
  IN: string;
  score?: number;
  amountOfProactiveExcellence?: number;
  amountOfStandardCompliance?: number;
  amountOfProceduralDeviation?: number;
  amountOfSafetyCompromise?: number;
  isReviewed: boolean;
  flightEvents?: Array<{
    id: number;
    flightId: number;
    eventId: string;
    timestamp: string;
    details?: Record<string, unknown>;
    event: {
      id: string;
      name: string;
      severityId: number;
      reference?: string;
      severity: {
        id: number;
        name: string;
        points: number;
        description: string;
      };
      eventDescription?: {
        eventID: string;
        description: string;
      };
    };
  }>;
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

export type EventSeverity = {
  description: string;
  id: number;
  name: string;
  points: number;
};

export type Event = {
  id: number;
  name: string;
  severityId: number;
  reference: string | null;
  eventDescription: {
    eventID: string;
    description: string;
  };
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

export const closeFlightDutyFlight = (
  flightId: number,
  flightDutyId: number
) => {
  return api.post<Flight, AxiosResponse<Flight, APILatamError>>(
    'flight-duty/flight',
    null,
    {
      params: { flightId, flightDutyId },
    }
  );
};

export const postGenerateFlightDuty = (
  params: PostGenerateFlightDutyParams
) => {
  return api.post('flight-duty', null, {
    params,
  });
};

export const updateRoutesFromCGNA = () => {
  return api.post('routes/update');
};

export const getEventSeverities = () => {
  return api.get<EventSeverity[]>('event/severity');
};

export const createEvent = (event: Omit<Event, 'id'>) => {
  return api.post<Event>('event', event);
};

export const getEvents = () => {
  return api.get<Event[]>('event');
};

export const getFlights = async () => {
  return api.get<Flight[]>('flight/me');
};

export const getFlightById = async (flightId: number) => {
  return api.get<Flight>(`flight/${flightId}`);
};

export function useGetFlights() {
  return useQuery({
    queryKey: ['flights-me'],
    queryFn: () => getFlights().then((res) => res.data),
    initialData: [],
  });
}

export function useGetFlightById(flightId: number) {
  return useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => getFlightById(flightId).then((res) => res.data),
    enabled: !!flightId,
  });
}

export const patchReviewFlight = ({ flightId }: { flightId: number }) => {
  return api.patch<Flight>(`flight/review/${flightId}`);
};
