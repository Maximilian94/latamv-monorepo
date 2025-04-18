import { Grid2, Tooltip, Zoom } from '@mui/material';
import { useState } from 'react';
import { useAirport } from '../context/airport.context.tsx';
import LoadingButton from '@mui/lab/LoadingButton';
import { useFlightDuty } from '../context/flight-duty.context.tsx';
import { Flight } from '../services/latam/latam.service.ts';
import { SingleAirportDataMap } from '../context/airport.context.types.tsx';

type FlightStatus =
  | 'Looking for Pilot'
  | 'On gate to Departure'
  | 'Climbing'
  | 'In cruise'
  | 'On Final Approach';

export type CardFlightData = {
  status: FlightStatus;
  departure: string;
  arrival: string;
  aircraft: string;
  flightTime: string;
  flightNumber: string;
};

type FlightRouteStatus = 'current' | 'done' | 'after-current';

type CardProps = {
  permissionToThisFlight: FlightPermission;
  flight: Flight;
  flightStatus: FlightRouteStatus;
};

type TailwindColors = 'indigo' | 'green' | 'red' | 'amber' | 'pink';

type TailwindBgColor =
  `bg-${TailwindColors}-${100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`;

type HaveFlightPermission = {
  havePermission: true;
};

type DontHaveFlightPermission = {
  havePermission: false;
  reason: string;
};

export type FlightPermission = HaveFlightPermission | DontHaveFlightPermission;

export default function FlightCard({
  permissionToThisFlight,
  flight,
  flightStatus,
}: CardProps) {
  const { getAirportMapData } = useAirport();
  const { closeFlightDutyFlight } = useFlightDuty();
  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    closeFlightDutyFlight(flight.index, flight.flightDutyId).then(() => {
      setLoading(false);
    });
  }

  const departureAirportData2 = getAirportMapData(flight.route.departure_icao);
  const arrivalAirportData2 = getAirportMapData(flight.route.arrival_icao);

  const getButtonMessage = () => {
    if (flightStatus == 'done') return 'Flight closed';
    if (flightStatus == 'after-current') return 'Waiting';
    if (!hover) return 'Look for a copilot';
    if (permissionToThisFlight.havePermission) {
      return 'Finish Flight';
    }

    return `You can't fly`;
  };

  const Airport = (
    airportData2: SingleAirportDataMap,
    reverse: boolean = false
  ) => {
    const ATCPositions = {
      D: {
        label: 'D',
        bgColor: 'bg-indigo-700',
        tooltip: 'Clearance Delivery',
      },
      G: { label: 'G', bgColor: 'bg-green-500', tooltip: 'Ground' },
      T: { label: 'T', bgColor: 'bg-red-700', tooltip: 'Tower' },
      A: { label: 'A', bgColor: 'bg-amber-600', tooltip: 'Approach' },
    };

    const ATCPositionsElement = () => {
      return (
        <div
          className={`flex ${reverse && 'flex-row-reverse'} gap-0.5 leading-4 text-white font-semibold select-none`}
          style={{ fontSize: '0.6rem' }}
        >
          {airportData2.atc.ivao.map((positionLabel) => {
            return (
              <Tooltip
                title={ATCPositions[positionLabel].tooltip}
                arrow
                slots={{
                  transition: Zoom,
                }}
                enterDelay={350}
                className={'cursor-pointer'}
                key={positionLabel}
              >
                <span
                  className={`px-1 rounded ${ATCPositions[positionLabel].bgColor}`}
                >
                  {ATCPositions[positionLabel].label}
                </span>
              </Tooltip>
            );
          })}
        </div>
      );
    };

    return (
      <div
        className={`flex ${reverse && 'flex-row-reverse'} items-center gap-1`}
      >
        <div className={'w-10 h-10'}>
          <Tooltip
            title={airportData2.metar?.raw_text}
            arrow
            slots={{
              transition: Zoom,
            }}
            enterDelay={350}
            className={'cursor-pointer'}
          >
            <img
              src={airportData2.metar?.svg}
              alt={'weather-icon'}
              className={'w-full h-full object-cover'}
            />
          </Tooltip>
        </div>

        <div className={'flex flex-col w-36'}>
          <div
            className={`flex ${reverse && 'flex-row-reverse'} gap-1 items-center`}
          >
            <span
              className={`
            text-lg
            leading-5
            ${flight.isClosed ? 'text-gray-50' : 'text-slate-200'}
            `}
            >
              {airportData2.details?.icao}
            </span>
            {ATCPositionsElement()}
          </div>
          <div className={`flex ${reverse && 'justify-end'}`}>
            <span
              className={`
            text-xs
            font-extralight
            ${flight.isClosed ? 'text-gray-100' : 'text-slate-400'}
            truncate`}
            >
              {airportData2.details?.city}, {airportData2.details?.state}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const LabelInfo = ({
    children,
    bgColor,
  }: {
    children: React.ReactNode;
    bgColor: TailwindBgColor;
  }) => {
    return (
      <div
        className={`flex items-center justify-center rounded-tl-lg rounded-tr-lg border-solid border-0 border-b border-slate-600 box-border ${bgColor} px-2`}
      >
        {children}
      </div>
    );
  };

  const Points = () => {
    return (
      <LabelInfo bgColor={'bg-green-500'}>
        <span className={'text-xs text-white font-extralight'}>+800 xp</span>
      </LabelInfo>
    );
  };

  const RankNecessary = () => {
    return (
      <LabelInfo bgColor={'bg-pink-600'}>
        <span className={'text-xs text-white font-extralight'}>
          Only Captain
        </span>
      </LabelInfo>
    );
  };

  const AwardNecessary = () => {
    return (
      <LabelInfo bgColor={'bg-pink-600'}>
        <span className={'text-xs text-white font-extralight'}>RNAV APCH</span>
      </LabelInfo>
    );
  };

  const CardLabels = () => {
    return (
      <div className={'absolute -top-3 right-1 h-3 flex gap-2'}>
        {AwardNecessary()}
        {RankNecessary()}
        {Points()}
      </div>
    );
  };

  function formatTime(value: string | undefined): string {
    if (!value) return 'no time provided';
    const hours = parseInt(value.slice(0, 2), 10);
    const minutes = parseInt(value.slice(2, 4), 10);

    return `${hours}h ${minutes}m`;
  }

  return (
    <Grid2
      container
      columnSpacing={4}
      className={`
      w-full relative
      border border-solid
      border-l-8
      rounded py-1 px-2 box-border
      text-slate-300
      items-center
      ${flightStatus == 'current' && 'bg-indigo-900'}
      ${flightStatus == 'current' && 'border-l-indigo-700'}
      ${flightStatus == 'current' && ' border-indigo-700'}
      
      ${flightStatus == 'done' && 'bg-emerald-900'}
      ${flightStatus == 'done' && 'border-l-emerald-700'}
      ${flightStatus == 'done' && 'border-emerald-700'}
      
      ${flightStatus == 'after-current' && 'bg-slate-900'}
      ${flightStatus == 'after-current' && 'border-l-slate-700'}
      ${flightStatus == 'after-current' && 'border-slate-700'}
      `}
    >
      {CardLabels()}

      <Grid2 size="auto">
        <LoadingButton
          size="small"
          onClick={handleClick}
          loading={loading}
          variant="contained"
          onMouseOver={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={'w-40'}
          disabled={flightStatus != 'current'}
        >
          {getButtonMessage()}
        </LoadingButton>
      </Grid2>

      <Grid2 size="auto">
        <div className={'flex flex-col items-center justify-center'}>
          <span className={'text-base font-medium text-slate-50'}>
            {flight.route.aircraft_model_code}
          </span>
          <span className={'text-xs font-extralight'}>
            {flight.aircraftRegistration}
          </span>
        </div>
      </Grid2>

      <Grid2 size="grow">
        <div className={'flex w-full justify-between'}>
          {/*Departure*/}
          {departureAirportData2 && Airport(departureAirportData2)}

          {/*Route*/}
          <div className={'flex flex-col items-center justify-center'}>
            <span>{formatTime(flight.route.eet)}</span>
          </div>

          {/*Arrival*/}
          {arrivalAirportData2 && Airport(arrivalAirportData2, true)}
        </div>
      </Grid2>

      <Grid2 size="auto">
        {/*Flight Number*/}
        <div>{flight.route.flight_number}</div>
      </Grid2>

      <Grid2 size="auto">
        {/*Pilots Info*/}
        <div className={'flex gap-2'}>
          <div
            className={
              'bg-indigo-700 w-10 h-10 flex justify-center items-center rounded text-white'
            }
          >
            CM1
          </div>
          <div
            className={
              'bg-indigo-700 w-10 h-10 flex justify-center items-center rounded text-white'
            }
          >
            CM2
          </div>
        </div>
      </Grid2>
    </Grid2>
  );
}
