import React, { ReactNode, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeFlightDutyFlight as closeFlightDutyFlightAPI,
  FlightDutyResponse,
  getFlightDutyRequest,
} from '../services/latam/latam.service.ts';

export interface FlightDutyContext {
  flightDuty: FlightDutyResponse | undefined;
  closeFlightDutyFlight: (
    flightIndex: number,
    flightDutyId: number
  ) => Promise<void>;
  refetch: () => void;
}

export const FlightDutyContext = React.createContext<
  FlightDutyContext | undefined
>(undefined);

export function FlightDutyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const flightDutyQuery = useQuery({
    queryKey: ['flight-duty'],
    queryFn: getFlightDutyRequest,
    staleTime: 15 * 60 * 1000, // 15 minutos antes de marcar os dados como "stale"
    refetchInterval: 15 * 60 * 1000, // Atualiza automaticamente a cada 15 minutos
    refetchOnWindowFocus: false, // Opcional: Evita refetch ao mudar para a aba do navegador
  });

  const flightDuty = useMemo(() => {
    return flightDutyQuery.data?.data;
  }, [flightDutyQuery.data]);

  const closeFlightDutyFlight = async (
    flightIndex: number,
    flightDutyId: number
  ) => {
    try {
      if (!flightDuty) return console.error('No Flight Duty found');
      const currentFlight = flightDuty.flights[flightIndex];
      if (!currentFlight) return console.error('No Flight found');

      const updatedFlight = await closeFlightDutyFlightAPI(
        currentFlight.id,
        flightDutyId
      );

      const isLastFlight = flightDuty.flights.length == currentFlight.index + 1;

      if (isLastFlight) {
        await flightDutyQuery.refetch();
        return;
      }

      queryClient.setQueryData(
        ['flight-duty'],
        (oldData: (typeof flightDutyQuery)['data']) => {
          if (!oldData || !oldData.data) return oldData;

          const updatedFlights = oldData.data.flights.map((flight) =>
            flight.id === currentFlight.id ? updatedFlight.data : flight
          );

          return {
            ...oldData,
            data: {
              ...oldData.data,
              flights: updatedFlights,
            },
          };
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const refetch = () => {
    flightDutyQuery.refetch();
  };

  return (
    <FlightDutyContext.Provider
      value={{ flightDuty, closeFlightDutyFlight, refetch }}
    >
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
