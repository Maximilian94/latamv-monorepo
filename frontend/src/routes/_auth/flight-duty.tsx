import { createFileRoute } from '@tanstack/react-router';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator,
} from '@mui/lab';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import isEmpty from 'lodash/isEmpty';
import FlightDutyStepperForm from '../../components/flightDutyStepperForm/flightDutyStepperForm.tsx';
import CurrentFlightCard from '../../components/currentFlightCard/currentFlightCard.tsx';
import FlightCard from '../../components/flightCard/flightCard.tsx';

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
