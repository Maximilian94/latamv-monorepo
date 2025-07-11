import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Flight, getFlights } from '../../../services/latam/latam.service.ts';
import FlightCard from '../../../components/flightCard/flightCard.tsx';

export const Route = createFileRoute('/_auth/logbook/')({
  component: () => <LogBook />,
});

const LogBook = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  useEffect(() => {
    getFlights().then((e) => {
      setFlights(e.data);
    });
  }, []);
  return (
    <div className={'flex flex-col gap-2 h-full overflow-scroll'}>
      {flights.map((flight) => {
        return <FlightCard flight={flight} />;
      })}
    </div>
  );
};
