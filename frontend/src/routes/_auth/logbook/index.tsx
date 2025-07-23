import { createFileRoute } from '@tanstack/react-router';
import { useGetFlights } from '../../../services/latam/latam.service.ts';
import FlightCard from '../../../components/flightCard/flightCard.tsx';

export const Route = createFileRoute('/_auth/logbook/')({
  component: () => <LogBook />,
});

const LogBook = () => {
  const { data: flights } = useGetFlights();

  return (
    <div className={'flex flex-col gap-2 h-full overflow-scroll'}>
      {flights.map((flight) => {
        return <FlightCard flight={flight} />;
      })}
    </div>
  );
};
