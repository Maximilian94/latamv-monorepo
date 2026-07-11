import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import isEmpty from 'lodash/isEmpty';
import FlightDutyStepperForm from '../../components/flightDutyStepperForm/flightDutyStepperForm.tsx';
import CurrentFlightCard from '../../components/currentFlightCard/currentFlightCard.tsx';
import FlightCard from '../../components/flightCard/flightCard.tsx';

const FlightDuty = () => {
  const { flightDuty, leaveFlightDuty } = useFlightDuty();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const hasDuty = !isEmpty(flightDuty);
  const currentFlightIndex = flightDuty?.flights
    ? flightDuty?.flights.findIndex(({ isClosed }) => !isClosed)
    : 0;

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveFlightDuty();
      setConfirmLeave(false);
    } finally {
      setLeaving(false);
    }
  };

  const getIcon = (index: number) => {
    if (currentFlightIndex == index)
      return <FlightTakeoffIcon className={'text-amber-300'} />;
    if (flightDuty?.flights[index].isClosed)
      return <CheckCircleOutlineIcon className={'text-emerald-600'} />;
    return <AccessTimeIcon />;
  };

  return (
    <div>
      {hasDuty && (
        <div className="flex justify-end px-4 pt-2">
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => setConfirmLeave(true)}
          >
            Sair da escala
          </Button>
        </div>
      )}

      <Dialog open={confirmLeave} onClose={() => setConfirmLeave(false)}>
        <DialogTitle>Sair da escala atual?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Os voos ainda não realizados desta escala serão descartados e você
            poderá gerar uma nova escala. Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeave(false)} disabled={leaving}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleLeave} disabled={leaving}>
            {leaving ? 'Saindo…' : 'Sair da escala'}
          </Button>
        </DialogActions>
      </Dialog>

      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {flightDuty &&
          flightDuty.flights?.map((flight, index) => {
            const getIsCurrentFlight = () => {
              if (flight.isClosed) return false;

              if (index == 0)
                return flightDuty.flights[index + 1]?.isClosed == false;

              return flightDuty.flights[index - 1]?.isClosed;
            };
            const isCurrentFlight = getIsCurrentFlight();

            return (
              <>
                <TimelineItem key={flight.flightNumber + index}>
                  <TimelineSeparator>
                    <TimelineConnector
                      className={`
                    ${index <= currentFlightIndex && 'bg-emerald-600'}
                    ${isCurrentFlight && index != 0 && `pt-6`}
                    `}
                    />

                    {getIcon(index)}

                    <TimelineConnector
                      className={`
                    ${index <= currentFlightIndex && 'bg-emerald-600'}
                    ${isCurrentFlight && `pb-6`}
                    transition-all duration-300 ease-in-out
                    `}
                    />
                  </TimelineSeparator>
                  <TimelineContent
                    className={`
                  ${isCurrentFlight && `mb-6`}
                  ${isCurrentFlight && index != 0 && `mt-6`}
                  flex w-full justify-center items-center
                  transition-all duration-300 ease-in-out`}
                  >
                    {isCurrentFlight && <CurrentFlightCard flight={flight} />}
                    {!isCurrentFlight && (
                      <FlightCard flight={flight} />
                      // <FlightCard
                      //   permissionToThisFlight={{ havePermission: true }}
                      //   flight={flight}
                      //   flightStatus={
                      //     isCurrentFlight
                      //       ? 'current'
                      //       : flight.isClosed
                      //         ? 'done'
                      //         : 'after-current'
                      //   }
                      // ></FlightCard>
                    )}
                  </TimelineContent>
                </TimelineItem>
              </>
            );
          })}

        {isEmpty(flightDuty) && <FlightDutyStepperForm />}
      </Timeline>
    </div>
  );
};

export const Route = createFileRoute('/_auth/flight-duty')({
  component: () => <FlightDuty />,
});
