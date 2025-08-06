import { Flight } from '../services/latam/latam.service.ts';
import dayjs from 'dayjs';

export const getFlightTime = ({ flight }: { flight: Flight }) => {
  const OUT = dayjs(flight.OUT);
  const IN = dayjs(flight.IN);

  const diffInMinutes = IN.diff(OUT, 'minute');

  return convertMinutesTo_HH_MM(diffInMinutes);
};

export const getExpectedFlightTime = ({ flight }: { flight: Flight }) => {
  const totalMinutes = Math.floor(flight.eet / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${hours}h ${formattedMinutes}m`;
};

export const convertMinutesTo_HH_MM = (time: number) => {
  const hours = Math.floor(time / 60);
  const minutes = Math.round(time % 60);
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${hours}h ${formattedMinutes}m`;
};
