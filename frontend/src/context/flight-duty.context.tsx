import React, { ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FlightDutyResponse,
  getFlightDutyRequest,
} from '../services/latam.service.ts';
import { getIvaoUsersOnline } from '../services/ivaoAPI.service.ts';

export interface FlightDutyContext {
  getFlightDuty: () => FlightDutyResponse | undefined;
}

export const FlightDutyContext = React.createContext<
  FlightDutyContext | undefined
>(undefined);

export function FlightDutyProvider({ children }: { children: ReactNode }) {
  const flightDutyQuery = useQuery({
    queryKey: ['flight-duty'],
    queryFn: getFlightDutyRequest,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const getFlightDuty = useCallback(() => {
    return flightDutyQuery.data?.data;
  }, [flightDutyQuery.data]);

  return (
    <FlightDutyContext.Provider value={{ getFlightDuty }}>
      {children}
    </FlightDutyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFlightDuty() {
  const context = React.useContext(FlightDutyContext);
  if (context == undefined) {
    throw new Error('useAuth must be used within an FlightDutyProvider');
  }
  return context;
}
