import { Flight } from '../../services/latam/latam.service.ts';
import { getExpectedFlightTime, getFlightTime } from '../../utils/flight.ts';
import Grid from '@mui/material/Grid2';
import dayjs from 'dayjs';

export const FlightTime = ({ flight }: { flight: Flight }) => {
  return (
    <Grid container spacing={2} alignItems="center" justifyContent={'center'}>
      <Grid size={2}>
        <div className={'flex flex-col items-center'}>
          <span className={'text-base'}>
            {dayjs(flight.OUT).format('HH:mm')}
          </span>
          <span className={'text-xs text-slate-400'}>Push Back</span>
        </div>
      </Grid>
      <Grid size={2}>
        <div className={'flex flex-col items-center'}>
          <span className={'text-base'}>
            {dayjs(flight.OFF).format('HH:mm')}
          </span>
          <span className={'text-xs text-slate-400'}>Take-off</span>
        </div>
      </Grid>
      <Grid size={4}>
        <div className={'flex flex-col items-center'}>
          <span className={'text-xl'}>{getFlightTime({ flight })}</span>
          <span className={'text-xs text-slate-400'}>
            {getExpectedFlightTime({ flight })}
          </span>
        </div>
      </Grid>
      <Grid size={2}>
        <div className={`flex flex-col items-center`}>
          <span className={'text-base'}>
            {dayjs(flight.ON).format('HH:mm')}
          </span>
          <span className={'text-xs text-slate-400'}>Landing</span>
        </div>
      </Grid>
      <Grid size={2}>
        <div className={'flex flex-col items-center'}>
          <span className={'text-base'}>
            {dayjs(flight.IN).format('HH:mm')}
          </span>
          <span className={'text-xs text-slate-400'}>Parking</span>
        </div>
      </Grid>
    </Grid>
  );
};
