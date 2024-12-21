import { createFileRoute } from '@tanstack/react-router';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineOppositeContent,
  timelineOppositeContentClasses,
  TimelineSeparator,
} from '@mui/lab';
import FlightCard from '../../components/flightCard.tsx';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import { Avatar } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FlightDuty = () => {
  const { getFlightDuty } = useFlightDuty();
  const flightDuty = getFlightDuty();
  const currentFlightIndex =
    flightDuty?.flights.findIndex(({ isClosed }) => !isClosed) | 0;

  const getIcon = (index: number) => {
    if (currentFlightIndex == index)
      return <FlightTakeoffIcon className={'text-amber-300'} />;
    if (flightDuty?.flights[index].isClosed) return <CheckCircleOutlineIcon />;
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
        {getFlightDuty()?.flights.map((flight, index) => {
          return (
            <TimelineItem key={flight.route.flight_number + index}>
              <TimelineSeparator>
                <TimelineConnector
                  className={
                    index <= currentFlightIndex ? 'bg-emerald-600' : ''
                  }
                />
                {getIcon(index)}
                {/*<TimelineDot />*/}
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
                  flight={{
                    flightNumber: flight.route.flight_number,
                    flightTime: flight.route.eet,
                    departure: flight.route.departure_icao,
                    arrival: flight.route.arrival_icao,
                    aircraft: flight.route.aircraft_model_code,
                    status: 'Looking for Pilot',
                  }}
                ></FlightCard>
              </TimelineContent>
            </TimelineItem>
          );
        })}
        {/*<TimelineItem>*/}
        {/*  <TimelineOppositeContent color="textSecondary">*/}
        {/*    09:30 am*/}
        {/*  </TimelineOppositeContent>*/}
        {/*  <TimelineSeparator>*/}
        {/*    <TimelineDot />*/}
        {/*    <TimelineConnector />*/}
        {/*  </TimelineSeparator>*/}
        {/*  <TimelineContent></TimelineContent>*/}
        {/*</TimelineItem>*/}
        {/*<TimelineItem>*/}
        {/*  <TimelineOppositeContent color="textSecondary">*/}
        {/*    10:00 am*/}
        {/*  </TimelineOppositeContent>*/}
        {/*  <TimelineSeparator>*/}
        {/*    <TimelineDot />*/}
        {/*  </TimelineSeparator>*/}
        {/*  <TimelineContent>Code</TimelineContent>*/}
        {/*</TimelineItem>*/}
      </Timeline>
    </div>
  );
};

export const Route = createFileRoute('/_auth/flight-duty')({
  component: () => <FlightDuty />,
});
