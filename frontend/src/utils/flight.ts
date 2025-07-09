import { Flight } from '../services/latam/latam.service.ts';
import dayjs from 'dayjs';

export const getFlightTime = ({ flight }: { flight: Flight }) => {
  const OUT = dayjs(flight.OUT);
  const IN = dayjs(flight.IN);

  const diffInMinutes = IN.diff(OUT, 'minute');

  return convertMinutesTo_HH_MM(diffInMinutes);
};

export const getExpectedFlightTime = ({ flight }: { flight: Flight }) => {
  const hours = flight.route.eet.slice(0, 2);
  const minutes = flight.route.eet.slice(2, 4);
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${hours}h ${formattedMinutes}m`;
};

export const convertMinutesTo_HH_MM = (time: number) => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${hours}h ${formattedMinutes}m`;
};
