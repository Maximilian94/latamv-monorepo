import { Flight } from '../services/latam/latam.service.ts';
import Grid from '@mui/material/Grid2';
import { Card } from './card.tsx';
import dayjs from 'dayjs';

type CardProps = {
  flight: Flight;
};

export default function FlightCard({ flight }: CardProps) {
  const timeNotFlew = '00:00';
  const flightTime = () => {
    if (!flight.isClosed)
      return `${flight.route.eet.slice(0, 2)}:${flight.route.eet.slice(2, 4)}`;
    const OUT = dayjs(flight.OUT);
    const IN = dayjs(flight.IN);

    const diffInMinutes = IN.diff(OUT, 'minute');

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}h ${formattedMinutes}m`;
  };

  return (
    <Card>
      <Grid container spacing={2}>
        <Grid size={3}>
          <div className={'flex flex-col'}>
            <span className={'text-base'}>
              {flight.route.departure_icao} - {flight.route.arrival_icao}
            </span>
            <span className={'text-xs text-slate-400'}>
              {flight.route.flight_number}
            </span>
          </div>
        </Grid>
        <Grid size={3}>
          <div className={'flex flex-col'}>
            <span className={'text-base'}>
              {flight.route.aircraft_model_code}
            </span>
            <span className={'text-xs text-slate-400'}>
              {flight.aircraftRegistration}
            </span>
          </div>
        </Grid>
        <Grid size={3}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent={'center'}
            className={`${!flight.isClosed && 'text-slate-400'}`}
          >
            <Grid size={2}>
              <div className={'flex flex-col items-center'}>
                <span className={'text-base'}>
                  {flight.isClosed
                    ? dayjs(flight.OUT).format('HH:mm')
                    : timeNotFlew}
                </span>
                <span className={'text-xs text-slate-400'}>OUT</span>
              </div>
            </Grid>
            <Grid size={2}>
              <div className={'flex flex-col items-center'}>
                <span className={'text-base'}>
                  {flight.isClosed
                    ? dayjs(flight.OFF).format('HH:mm')
                    : timeNotFlew}
                </span>
                <span className={'text-xs text-slate-400'}>OFF</span>
              </div>
            </Grid>
            <Grid size={4}>
              <div className={'flex flex-col items-center'}>
                <span className={'text-xl'}>{flightTime()}</span>
                {!flight.isClosed && (
                  <span className={'text-xs'}>Expected</span>
                )}
              </div>
            </Grid>
            <Grid size={2}>
              <div className={`flex flex-col items-center`}>
                <span className={'text-base'}>
                  {flight.isClosed
                    ? dayjs(flight.ON).format('HH:mm')
                    : timeNotFlew}
                </span>
                <span className={'text-xs text-slate-400'}>ON</span>
              </div>
            </Grid>
            <Grid size={2}>
              <div className={'flex flex-col items-center'}>
                <span className={'text-base'}>
                  {flight.isClosed
                    ? dayjs(flight.IN).format('HH:mm')
                    : timeNotFlew}
                </span>
                <span className={'text-xs text-slate-400'}>IN</span>
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid size={3}>Points</Grid>
      </Grid>
    </Card>
  );
}
