import { createFileRoute } from '@tanstack/react-router';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import FlightCard from '../../components/flightCard.tsx';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import isEmpty from 'lodash/isEmpty';
import FlightDutyStepperForm from '../../components/flightDutyStepperForm/flightDutyStepperForm.tsx';

const FlightDuty = () => {
  const { flightDuty } = useFlightDuty();
  const currentFlightIndex = flightDuty?.flights
    ? flightDuty?.flights.findIndex(({ isClosed }) => !isClosed)
    : 0;

  const getIcon = (index: number) => {
    if (currentFlightIndex == index)
      return <FlightTakeoffIcon className={'text-amber-300'} />;
    if (flightDuty?.flights[index].isClosed)
      return <CheckCircleOutlineIcon className={'text-emerald-600'} />;
    return <AccessTimeIcon />;
  };

  return (
    <div>
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
            return (
              <TimelineItem key={flight.route.flight_number + index}>
                <TimelineSeparator>
                  <TimelineConnector
                    className={
                      index <= currentFlightIndex ? 'bg-emerald-600' : ''
                    }
                  />
                  {getIcon(index)}
                  <TimelineConnector
                    className={
                      index + 1 <= currentFlightIndex ? 'bg-emerald-600' : ''
                    }
                  />
                </TimelineSeparator>
                <TimelineContent
                  className={'flex w-full justify-center items-center'}
                >
                  <FlightCard
                    permissionToThisFlight={{ havePermission: true }}
                    flight={flight}
                  ></FlightCard>
                </TimelineContent>
              </TimelineItem>
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
