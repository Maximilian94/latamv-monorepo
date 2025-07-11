import {
  Flight,
  patchReviewFlight,
} from '../../services/latam/latam.service.ts';
import Grid from '@mui/material/Grid2';
import { Card } from '../card.tsx';
import { ExpectedFlightTime } from './expectedFlightTime.tsx';
import { FlightTime } from './flightTime.tsx';
import SeverityInfo from '../severity/severityInfo.tsx';
import Button from '@mui/material/Button';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircularProgress } from '@mui/material';

type CardProps = {
  flight: Flight;
};

export default function FlightCard({ flight }: CardProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      patchReviewFlight({ flightId: flight.id }).then((res) => res.data),
    onSuccess: (updatedFlight: Flight) => {
      queryClient.setQueryData<Flight[]>(['flights-me'], (oldData) =>
        oldData?.map((f) => (f.id === updatedFlight.id ? updatedFlight : f))
      );
    },
  });

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
        <Grid size={6}>
          {!flight.isClosed && <ExpectedFlightTime flight={flight} />}
          {flight.isClosed && <FlightTime flight={flight} />}
        </Grid>
        <Grid size={3}>
          <div className={'flex flex-col items-end justify-center h-full'}>
            {flight.isClosed && (
              <>
                <span>Score: {flight.score || 'No info'}</span>
                {flight.isReviewed && (
                  <SeverityInfo flight={flight} small={true} />
                )}
                {!flight.isReviewed && (
                  <Button
                    variant={'contained'}
                    color={'secondary'}
                    startIcon={
                      mutation.isPending ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <ContentPasteSearchIcon />
                      )
                    }
                    size="small"
                    onClick={() => mutation.mutate()}
                  >
                    {mutation.isPending ? 'Reviewing' : 'Review'}
                  </Button>
                )}
              </>
            )}
          </div>
        </Grid>
      </Grid>
    </Card>
  );
}
