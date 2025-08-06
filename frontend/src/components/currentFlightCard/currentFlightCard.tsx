import { Divider } from '@mui/material';
import { Flight } from '../../services/latam/latam.service.ts';
import AirportDetails from './airportDetails.tsx';
import { Card } from '../card.tsx';
import { formatEET } from '../../utils/date.ts';

type CardProps = {
  flight: Flight;
};

export default function CurrentFlightCard({ flight }: CardProps) {
  return (
    <Card bgColor="bg-indigo-950" borderColor={'border-gray-950'}>
      <div className={'flex justify-between w-full'}>
        <div className={'flex flex-col'}>
          <span className={'text-xl'}>{flight.flightNumber}</span>
          <span className={'text-xs text-slate-400'}>Flight Number</span>
        </div>

        <div className={'flex flex-col'}>
          <span className={'text-xl'}>{flight.aircraftRegistration}</span>
          <span className={'text-xs text-slate-400'}>
            {flight.aircraftModel}
          </span>
        </div>

        <div className={'flex flex-col'}>
          <span className={'text-xl'}>{formatEET(flight.eet)}</span>
          <span className={'text-xs text-slate-400'}>Flight Time</span>
        </div>

        <div className={'flex flex-col'}>
          <span className={'text-xl'}>---</span>
          <span className={'text-xs text-slate-400'}>Flight Level</span>
        </div>

        <div className={'flex flex-col'}>
          <span className={'text-xl'}>---</span>
          <span className={'text-xs text-slate-400'}>Passengers</span>
        </div>
        <div>Generate OFP</div>
      </div>

      <Divider className={'my-2'} />

      <div className={'flex flex-col w-full justify-between h-full gap-4 mt-4'}>
        <AirportDetails icao={flight.departureIcao} />
        <AirportDetails icao={flight.arrivalIcao} />
      </div>
    </Card>
  );
}
