import { ApiResponse } from './metar.types';

export type SuntimeAPIResponse = ApiResponse<SunriseSunsetTypes>;

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
