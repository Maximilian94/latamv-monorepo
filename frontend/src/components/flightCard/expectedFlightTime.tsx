import { Flight } from '../../services/latam/latam.service.ts';
import { getExpectedFlightTime } from '../../utils/flight.ts';

export const ExpectedFlightTime = ({ flight }: { flight: Flight }) => {
  return (
    <div className={'flex flex-col items-center'}>
      <span className={'text-xl'}>{getExpectedFlightTime({ flight })}</span>
      <span className={'text-xs text-slate-400'}>Expected</span>
    </div>
  );
};
