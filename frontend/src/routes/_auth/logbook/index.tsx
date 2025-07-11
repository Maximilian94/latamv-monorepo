import { createFileRoute } from '@tanstack/react-router';
import { getFlights } from '../../../services/latam/latam.service.ts';
import FlightCard from '../../../components/flightCard/flightCard.tsx';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_auth/logbook/')({
  component: () => <LogBook />,
});

const LogBook = () => {
  const { data: flights = [] } = useQuery({
    queryKey: ['flights-me'],
    queryFn: () => getFlights().then((res) => res.data),
  });

  return (
    <div className={'flex flex-col gap-2 h-full overflow-scroll'}>
      {flights.map((flight) => {
        return <FlightCard flight={flight} />;
      })}
    </div>
  );
};
