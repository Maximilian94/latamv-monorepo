import { Button, Grid2, Tooltip, Typography, Zoom } from '@mui/material';
import { useState } from 'react';
import {
  SingleAirportDataMap,
  useAirport,
} from '../context/airport.context.tsx';
import { MetarRespose } from '../services/latam.service.ts';

type FlightStatus =
  | 'Looking for Pilot'
  | 'On gate to Departure'
  | 'Climbing'
  | 'In cruise'
  | 'On Final Approach';

export type AirportData = {
  icao: string;
  city?: string;
  state?: string;
};

export type CardFlightData = {
  status: FlightStatus;
  departure: AirportData;
  arrival: AirportData;
  aircraft: string;
  flightTime: string;
  flightNumber: string;
};

type CardProps = {
  permissionToThisFlight: FlightPermission;
  flight: CardFlightData;
};

type TailwindColors = 'indigo' | 'green' | 'red' | 'amber' | 'pink';

type TailwindBgColor =
  `bg-${TailwindColors}-${100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`;

type ATCPositionsType = {
  label: string;
  bgColor: TailwindBgColor;
  tooltip: string;
};

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
}: CardProps) {
  const { getAirportMapData } = useAirport();
  const [hover, setHover] = useState(false);

  const departureAirportData2 = getAirportMapData(flight.departure.icao);
  const arrivalAirportData2 = getAirportMapData(flight.arrival.icao);

  const getButtonMessage = () => {
    if (!hover) return 'Looking co-pilot';
    if (permissionToThisFlight.havePermission) {
      return 'Fly with him';
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

        <div className={'flex flex-col'}>
          <div
            className={`flex ${reverse && 'flex-row-reverse'} gap-1 items-center`}
          >
            <span className={'text-lg leading-5 text-slate-200'}>
              {airportData2.details?.icao}
            </span>
            {ATCPositionsElement()}
          </div>
          <div className={`flex ${reverse && 'justify-end'}`}>
            <span className={'text-xs font-extralight text-slate-400'}>
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

    return `${hours}h ${minutes}min`;
  }

  return (
    <div className={`transition-all duration-300 mb-2`}>
      <div
        className={`
          flex gap-6 justify-between items-center
          w-full
          border-solid border border-slate-500 border-l-8 border-l-blue-600
          rounded py-1 px-2 box-border relative
          bg-indigo-900 text-slate-300
        `}
      >
        {CardLabels()}
        <div className={'flex flex-col items-center justify-center'}>
          <span className={'text-base font-medium text-slate-50'}>
            {flight.aircraft}
          </span>
          <span className={'text-xs font-extralight'}>PTMAX</span>
        </div>

        <div className={'flex gap-10'}>
          {/*Departure*/}
          {departureAirportData2 && Airport(departureAirportData2)}

          {/*Route*/}
          <div className={'flex flex-col items-center justify-center'}>
            <span>{formatTime(flight.flightTime)}</span>
          </div>

          {/*Arrival*/}
          {arrivalAirportData2 && Airport(arrivalAirportData2, true)}
        </div>

        {/*Flight Number*/}
        <div>{flight.flightNumber}</div>

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
      </div>
    </div>
  );
}
