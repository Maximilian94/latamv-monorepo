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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircularProgress } from '@mui/material';
import { Link } from '@tanstack/react-router';
import Tooltip from '@mui/material/Tooltip';

// icons
import IconButton from '@mui/material/IconButton';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

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

  const hasProactiveExcellence =
    flight.amountOfProactiveExcellence &&
    flight.amountOfProactiveExcellence > 0;
  const hasStandardCompliance =
    flight.amountOfStandardCompliance && flight.amountOfStandardCompliance > 0;
  const hasProceduralDeviation =
    flight.amountOfProceduralDeviation &&
    flight.amountOfProceduralDeviation > 0;
  const hasSafetyCompromise =
    flight.amountOfSafetyCompromise && flight.amountOfSafetyCompromise > 0;
  const hasEvent =
    hasProactiveExcellence ||
    hasStandardCompliance ||
    hasProceduralDeviation ||
    hasSafetyCompromise;
  const shouldShowSeverity = flight.isReviewed && hasEvent;

  return (
    <div className={`${shouldShowSeverity ? 'mt-2' : ''} pt-4 relative w-full`}>
      <Card
        borderColor={(flight.isClosed && 'border-emerald-600') || undefined}
      >
        <Grid container spacing={2}>
          <Grid size={2}>
            <div className={'flex flex-col'}>
              <span className={'text-base'}>
                {flight.departureIcao} - {flight.arrivalIcao}
              </span>
              <span className={'text-xs text-slate-400'}>
                {flight.flightNumber}
              </span>
            </div>
          </Grid>
          <Grid size={1}>
            <div className={'flex flex-col'}>
              <span className={'text-base'}>
                {flight.aircraftRegistration}
              </span>
              <span className={'text-xs text-slate-400'}>
                {flight.aircraftRegistration}
              </span>
            </div>
          </Grid>
          <Grid size={5}>
            {!flight.isClosed && <ExpectedFlightTime flight={flight} />}
            {flight.isClosed && <FlightTime flight={flight} />}
          </Grid>
          <Grid size={4}>
            <div
              className={'flex flex-col items-end justify-center h-full gap-2'}
            >
              {flight.isClosed && (
                <>
                  {/* <span>Score: {flight.score || 'No info'}</span> */}
                  <div className="flex gap-2">
                    {!flight.isReviewed ? (
                      <Button
                        variant={'contained'}
                        color={'secondary'}
                        startIcon={
                          mutation.isPending ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <TroubleshootIcon />
                          )
                        }
                        size="small"
                        onClick={() => mutation.mutate()}
                        className="transition-all duration-500 ease-in-out"
                      >
                        {mutation.isPending ? 'Reviewing' : 'Review'}
                      </Button>
                    ) : (
                      <Link
                        to="/flight-details/$flightId"
                        params={{ flightId: flight.id.toString() }}
                        className="no-underline transition-all duration-500 ease-in-out"
                      >
                        <Tooltip title="See details">
                          <IconButton>
                            <ContentPasteSearchIcon />
                          </IconButton>
                        </Tooltip>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </Grid>
        </Grid>
      </Card>
      {shouldShowSeverity ? (
        <div className="absolute -top-1 right-4 bg-slate-900 px-2 rounded-t-lg border border-solid border-slate-900 border-t-emerald-600 border-x-emerald-600 animate-fade-in">
          <SeverityInfo flight={flight} small={true} />
        </div>
      ) : null}
    </div>
  );
}
