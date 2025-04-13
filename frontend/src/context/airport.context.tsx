import React, { ReactNode, useEffect } from 'react';
import airportsJSON from '../utils/airports.json';
import { useQuery } from '@tanstack/react-query';
import {
  getMetar,
  getSuntimes,
  MetarData,
  SunriseSunsetTypes,
  SuntimesRespose,
} from '../services/latam/latam.service.ts';
import { getIvaoUsersOnline } from '../services/ivaoAPI.service.ts';
import {
  AirportDataMap,
  AirportJSONData,
  SingleAirportDataMap,
} from './airport.context.types.tsx';
import { AtcData } from '../services/ivaoAPI.type.ts';

export interface AirportContext {
  getSuntimesData: (icao: string | null) => SuntimesRespose[string] | null;
  getAirportMapData: (icao: string) => SingleAirportDataMap | undefined;
}

export const AirportContext = React.createContext<AirportContext | undefined>(
  undefined
);

const ICON_PATH = '/weather/';

export function AirportProvider({ children }: { children: ReactNode }) {
  const [airportDataMap, setAirportDataMap] = React.useState<AirportDataMap>(
    new Map()
  );

  const [airports, setAirports] = React.useState<{
    [icao: string]: AirportJSONData;
  } | null>(null);
  const metarQuery = useQuery({
    queryKey: ['weather', 'metar'],
    queryFn: getMetar,
    retry: 0,
    enabled: !!airports,
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
    retry: 0,
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const ivaoUsersOnlineQuery = useQuery({
    queryKey: ['vatsim', 'atc'],
    queryFn: getIvaoUsersOnline,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador,
  });

  const getDayTimeSufix = React.useCallback(
    (utc: SunriseSunsetTypes['sunrise_sunset']['utc']): 'day' | 'night' => {
      const current = Date.parse(`1970-01-01T${utc.current.split('T')[1]}Z`);
      const sunrise = Date.parse(`1970-01-01T${utc.sunrise}Z`);
      const sunset = Date.parse(`1970-01-01T${utc.sunset}Z`);
      const isDay = current >= sunrise && current <= sunset;

      return isDay ? 'day' : 'night';
    },
    [] // Sem dependências externas, pois a lógica depende apenas do argumento `utc`
  );

  const getSuntimesData = React.useCallback(
    (icao: string | null): SuntimesRespose[string] | null => {
      if (!icao) return null;
      return suntimesQuery.data?.data[icao] || null;
    },
    [suntimesQuery.data?.data] // Dependência do resultado da query
  );

  const getWeatherIcon = React.useCallback(
    (icao: string | null, metarData: MetarData) => {
      const MAX_SIGNIFICANT_CLOUD_ALTITUDE = 5000;
      const airportSuntimeData = getSuntimesData(icao);
      if (!airportSuntimeData) {
        console.error('Error getting suntimeData');
        return '';
      }
      const airportMetar = metarData;
      const dayTimeSufix = getDayTimeSufix(
        airportSuntimeData.sunrise_sunset.utc
      );
      const significandCloudsCode = airportMetar?.clouds
        .filter(
          (cloud) => cloud.base_feet_agl <= MAX_SIGNIFICANT_CLOUD_ALTITUDE
        )
        .map((cloud) => cloud.code);

      const isRaining = airportMetar.conditions?.find(
        (condition) => condition.code == 'RA'
      );
      const isThunderstormWithRain = airportMetar.conditions?.find(
        (condition) => condition.code == 'TSRA'
      );

      let isRainingSufix = '';
      if (isRaining) {
        const isHeavy = isRaining?.text.includes('Heavy');
        if (isHeavy) isRainingSufix = '-+rain';
        if (!isHeavy) isRainingSufix = '-rain';
      }

      let isThunderstormWithRainSufix = '';
      if (isThunderstormWithRain) {
        isThunderstormWithRainSufix = '-thunderstorm-rain';
      }

      if (significandCloudsCode?.length) {
        if (significandCloudsCode.includes('OVC'))
          return `${ICON_PATH}ovc-${dayTimeSufix}${isRainingSufix}${isThunderstormWithRainSufix}.svg`;

        if (significandCloudsCode.includes('BKN'))
          return `${ICON_PATH}bkn-${dayTimeSufix}${isRainingSufix}${isThunderstormWithRainSufix}.svg`;

        if (significandCloudsCode.includes('SCT'))
          return `${ICON_PATH}sct-${dayTimeSufix}${isRainingSufix}${isThunderstormWithRainSufix}.svg`;

        if (significandCloudsCode.includes('FEW'))
          return `${ICON_PATH}few-${dayTimeSufix}${isRainingSufix}${isThunderstormWithRainSufix}.svg`;
      }

      return `${ICON_PATH}clear-${dayTimeSufix}.svg`;
    },
    [getSuntimesData, getDayTimeSufix]
  );

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
      if (!airports[icao]) return;
      map.set(icao, {
        atc: { ivao: [], vatsim: [] },
        metar: {
          svg: `${ICON_PATH}not-available.svg`,
          raw_text: 'No METAR Available',
        },
        details: airports[icao],
      });
    });

    setAirportDataMap(map);
  }, [airports]);

  useEffect(() => {
    if (!metarQuery.data?.data || !suntimesQuery.data?.data) return;
    setAirportDataMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      Object.entries(metarQuery.data.data).forEach(([icao, metarQueryData]) => {
        const airportData = updatedMap.get(icao);
        if (!airportData) return prevMap;
        const metar: SingleAirportDataMap['metar'] = {
          ...metarQueryData,
          svg: getWeatherIcon(icao, metarQueryData),
        };
        if (Object.keys(airportData).length > 0) {
          updatedMap.set(icao, { ...airportData, metar });
        }
      });
      return updatedMap;
    });
  }, [
    metarQuery,
    metarQuery.data?.data,
    suntimesQuery.data?.data,
    getWeatherIcon,
  ]);

  useEffect(() => {
    if (!ivaoUsersOnlineQuery.data?.data) return;

    function getStringBeforeUnderscore(input: string): string {
      return input.split('_')[0];
    }

    setAirportDataMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      Object.values<AtcData>(
        ivaoUsersOnlineQuery.data.data.clients.atcs
      ).forEach((atcData) => {
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
      });
      return updatedMap;
    });
  }, [ivaoUsersOnlineQuery.data?.data]);

  return (
    <AirportContext.Provider
      value={{
        getSuntimesData,
        getAirportMapData,
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
