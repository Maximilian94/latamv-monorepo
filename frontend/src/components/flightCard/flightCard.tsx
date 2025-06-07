import { Flight } from '../../services/latam/latam.service.ts';
import Grid from '@mui/material/Grid2';
import { Card } from '../card.tsx';
import { ExpectedFlightTime } from './expectedFlightTime.tsx';
import { FlightTime } from './flightTime.tsx';

type CardProps = {
  flight: Flight;
};

export default function FlightCard({ flight }: CardProps) {
  return (
    <Card borderColor={(flight.isClosed && 'border-emerald-600') || undefined}>
      <Grid container spacing={2}>
        <Grid size={2}>
          <div className={'flex flex-col'}>
            <span className={'text-base'}>
              {flight.route.departure_icao} - {flight.route.arrival_icao}
            </span>
            <span className={'text-xs text-slate-400'}>
              {flight.route.flight_number}
            </span>
          </div>
        </Grid>
        <Grid size={1}>
          <div className={'flex flex-col'}>
            <span className={'text-base'}>
              {flight.route.aircraft_model_code}
            </span>
            <span className={'text-xs text-slate-400'}>
              {flight.aircraftRegistration}
            </span>
          </div>
        </Grid>
        <Grid size={7}>
          {!flight.isClosed && <ExpectedFlightTime flight={flight} />}
          {flight.isClosed && <FlightTime flight={flight} />}
        </Grid>
        <Grid size={2}>Points</Grid>
      </Grid>
    </Card>
  );
}
