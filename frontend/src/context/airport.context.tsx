import React, { ReactNode, useEffect } from 'react';
import airportsJSON from '../utils/airports.json';
import { useQuery } from '@tanstack/react-query';
import {
  getMetar,
  getSuntimes,
  MetarRespose,
  SunriseSunsetTypes,
  SuntimesRespose,
} from '../services/latam.service.ts';
import { getVATSIMATCsOnline } from '../services/vatsimAPI.service.ts';

export interface AirportContext {
  airports: any;
  getAirportData: (icao: string) => any;
  getMetarData: (icao: string) => MetarRespose[string] | null;
  getSuntimesData: (icao: string | null) => SuntimesRespose[string] | null;
  getWeatherIcon: (icao: string | null) => string;
  getATCsOnline: (icao: string) => ('T' | 'D' | 'G' | 'A')[];
}

export const AirportContext = React.createContext<AirportContext | undefined>(
  undefined
);

export function AirportProvider({ children }: { children: ReactNode }) {
  const [airports, setAirports] = React.useState<any>(null);
  const metarQuery = useQuery({
    queryKey: ['weather', 'metar'],
    queryFn: getMetar,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });
  const getMillisecondsUntilNextDay = (): number => {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    return tomorrow.getTime() - now.getTime();
  };
  const suntimesQuery = useQuery({
    queryKey: ['weather', 'suntimes'],
    queryFn: getSuntimes,
    staleTime: getMillisecondsUntilNextDay(),
    refetchOnWindowFocus: true,
  });

  const vatsimATCQuery = useQuery({
    queryKey: ['vatsim', 'atc'],
    queryFn: getVATSIMATCsOnline,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const getAirportData = (icao: string) => {
    const icaoAsArray = icao.split('');
    const airport =
      airports[icaoAsArray[0]][icaoAsArray[1]][icaoAsArray[2]][icaoAsArray[3]];

    if (!airport) {
      return {
        icao: icao,
        iata: `${icao} error`,
        name: `${icao} error`,
        city: `${icao} error`,
        state: `${icao} error`,
        country: `${icao} error`,
        elevation: `${icao} error`,
        lat: `${icao} error`,
        lon: `${icao} error`,
        tz: `${icao} error`,
      };
    }

    return airport;
  };

  const getMetarData = (icao: string | null): MetarRespose[string] | null => {
    if (!icao) return null;
    return metarQuery.data?.data[icao] || null;
  };

  function getDayTimeSufix(
    utc: SunriseSunsetTypes['sunrise_sunset']['utc']
  ): 'day' | 'night' {
    const current = Date.parse(`1970-01-01T${utc.current.split('T')[1]}Z`);
    const sunrise = Date.parse(`1970-01-01T${utc.sunrise}Z`);
    const sunset = Date.parse(`1970-01-01T${utc.sunset}Z`);
    const isDay = current >= sunrise && current <= sunset;

    return isDay ? 'day' : 'night';
  }

  const getSuntimesData = (
    icao: string | null
  ): SuntimesRespose[string] | null => {
    if (!icao) return null;
    return suntimesQuery.data?.data[icao] || null;
  };

  const getWeatherIcon = (icao: string | null) => {
    const PATH = '/weather/';
    const MAX_SIGNIFICANT_CLOUD_ALTITUDE = 5000;
    const airportSuntimeData = getSuntimesData(icao);
    if (!airportSuntimeData) {
      console.error('Error getting suntimeData');
      return '';
    }
    const airportMetar = getMetarData(icao);
    const dayTimeSufix = getDayTimeSufix(airportSuntimeData.sunrise_sunset.utc);
    const significandCloudsCode = airportMetar?.clouds
      .filter((cloud) => cloud.base_feet_agl <= MAX_SIGNIFICANT_CLOUD_ALTITUDE)
      .map((cloud) => cloud.code);

    if (significandCloudsCode?.length) {
      if (significandCloudsCode.includes('OVC'))
        return `${PATH}ovc-${dayTimeSufix}.svg`;

      if (significandCloudsCode.includes('BKN'))
        return `${PATH}bkn-${dayTimeSufix}.svg`;

      if (significandCloudsCode.includes('SCT'))
        return `${PATH}sct-${dayTimeSufix}.svg`;

      if (significandCloudsCode.includes('FEW'))
        return `${PATH}few-${dayTimeSufix}.svg`;
    }

    return `${PATH}clear-${dayTimeSufix}.svg`;
  };

  const getATCsOnline = (icao: string): Array<'D' | 'G' | 'T' | 'A'> => {
    //@ts-ignore
    return vatsimATCQuery.data?.data.clients.atcs
      .filter((atcData) => (atcData.callsign as string).includes(icao))
      .map((atcData) => {
        if ((atcData.callsign as string).includes('DEL')) return 'D';
        if ((atcData.callsign as string).includes('GND')) return 'G';
        if ((atcData.callsign as string).includes('TWR')) return 'T';
        return 'A';
      });
  };

  useEffect(() => {
    setAirports(airportsJSON);
  }, []);

  useEffect(() => {
    metarQuery.refetch();
  }, [airports]);

  useEffect(() => {
    console.log('Aoba');
  }, [metarQuery.data?.data]);

  return (
    <AirportContext.Provider
      value={{
        airports,
        getAirportData,
        getMetarData,
        getSuntimesData,
        getWeatherIcon,
        getATCsOnline,
      }}
    >
      {children}
    </AirportContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAirport() {
  const context = React.useContext(AirportContext);
  if (context == undefined) {
    throw new Error('useAirport must be used within an AirportProvider');
  }
  return context;
}
