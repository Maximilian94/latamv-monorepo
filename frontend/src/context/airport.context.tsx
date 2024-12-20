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
import { getIvaoUsersOnline } from '../services/ivaoAPI.service.ts';

export type SingleAirportDataMapMETAR = MetarRespose[string] & {
  svg: string;
};

export type SingleAirportDataMap = {
  atc: {
    ivao: Array<'D' | 'G' | 'T' | 'A'>;
    vatsim: Array<'D' | 'G' | 'T' | 'A'>;
  };
  metar: SingleAirportDataMapMETAR | null;
  details: any;
};
export type AirportDataMap = Map<string, SingleAirportDataMap>;

export interface AirportContext {
  airports: any;
  getAirportData: (icao: string) => any;
  getMetarData: (icao: string) => MetarRespose[string] | null;
  getSuntimesData: (icao: string | null) => SuntimesRespose[string] | null;
  getWeatherIcon: (icao: string | null) => string;
  getAirportMapData: (icao: string) => SingleAirportDataMap | undefined;
}

export const AirportContext = React.createContext<AirportContext | undefined>(
  undefined
);

export function AirportProvider({ children }: { children: ReactNode }) {
  const [airportDataMap, setAirportDataMap] = React.useState<AirportDataMap>(
    new Map()
  );

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
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const ivaoUsersOnlineQuery = useQuery({
    queryKey: ['vatsim', 'atc'],
    queryFn: getIvaoUsersOnline,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const getAirportData = (icao: string) => {
    const airport = airports[icao];

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

  const getATCPotisionLetter = (callsign: string): 'D' | 'G' | 'T' | 'A' => {
    if (callsign.includes('DEL')) return 'D';
    if (callsign.includes('GND')) return 'G';
    if (callsign.includes('TWR')) return 'T';
    return 'A';
  };

  const getAirportMapData = (icao: string) => {
    return airportDataMap.get(icao);
  };

  useEffect(() => {
    setAirports(airportsJSON);
  }, []);

  useEffect(() => {
    const map: AirportDataMap = new Map();

    if (!airports) return;

    Object.keys(airports).forEach((icao) => {
      map.set(icao, {
        atc: { ivao: [], vatsim: [] },
        metar: null,
        details: airports[icao],
      });
    });

    setAirportDataMap(map);

    metarQuery.refetch();
  }, [airports]);

  useEffect(() => {
    if (!metarQuery.data?.data) return;
    setAirportDataMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      Object.entries(metarQuery.data.data).forEach(([icao, metarQueryData]) => {
        const airportData = updatedMap.get(icao);
        if (!airportData) return prevMap;
        const metar: SingleAirportDataMap['metar'] = {
          ...metarQueryData,
          svg: getWeatherIcon(icao),
        };
        if (Object.keys(airportData).length > 0) {
          updatedMap.set(icao, { ...airportData, metar });
        }
      });
      return updatedMap;
    });
  }, [metarQuery.data?.data]);

  useEffect(() => {
    if (!ivaoUsersOnlineQuery.data?.data) return;

    function getStringBeforeUnderscore(input: string): string {
      return input.split('_')[0];
    }

    setAirportDataMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      Object.values(ivaoUsersOnlineQuery.data.data.clients.atcs).forEach(
        (atcData) => {
          const icao = getStringBeforeUnderscore(atcData.callsign);
          const airportData = updatedMap.get(icao);
          if (!airportData) return prevMap;
          if (Object.keys(airportData).length > 0) {
            updatedMap.set(icao, {
              ...airportData,
              atc: {
                ivao: [
                  ...airportData.atc.ivao,
                  getATCPotisionLetter(atcData.callsign),
                ],
                vatsim: airportData.atc.vatsim,
              },
            });
          }
        }
      );
      return updatedMap;
    });
  }, [ivaoUsersOnlineQuery.data?.data]);

  return (
    <AirportContext.Provider
      value={{
        airports,
        getAirportData,
        getMetarData,
        getSuntimesData,
        getWeatherIcon,
        getAirportMapData,
      }}
    >
      {console.log('airportData', airportDataMap)}
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
