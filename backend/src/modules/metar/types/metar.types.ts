export interface ApiResponse<T> {
  results: number;
  data: T[];
}

export type MetarAPIResponse = ApiResponse<MetarData>;

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
    code: string;
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
}
