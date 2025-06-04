import { useAirport } from '../../context/airport.context.tsx';
import Grid from '@mui/material/Grid2';
import { Tooltip, Zoom } from '@mui/material';

export default function AirportDetails({ icao }: { icao: string }) {
  const { getAirportMapData } = useAirport();

  const airportData = getAirportMapData(icao);

  const ATCPositionsElement = () => {
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

    return (
      <div
        className={`flex gap-0.5 leading-4 text-white font-semibold select-none`}
        style={{ fontSize: '0.6rem' }}
      >
        {airportData?.atc.ivao.map((positionLabel) => {
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

  const useFormattedAirportName = (text: string): string => {
    return text.replace('Airport', '').replace('International', '').trim();
  };

  const airportName = useFormattedAirportName(airportData?.details.name || '');

  return (
    <Grid container spacing={2}>
      {/*Airport Details*/}
      <Grid size={3}>
        <div className={'flex flex-col'}>
          <div className={'flex gap-2 items-center'}>
            <span className={'text-xl'}>{airportData?.details.icao}</span>
            <div>{ATCPositionsElement()}</div>
          </div>
          <span className={'text-xs text-slate-400 truncate'}>
            {airportName}
          </span>
          <span className={'text-sm text-slate-400 truncate'}>
            {airportData?.details?.city}, {airportData?.details?.state}
          </span>
        </div>
      </Grid>

      {/*Position Details*/}
      <Grid size={2}>
        <div className={'flex justify-between items-start gap-5'}>
          <div className={'flex flex-col justify-center items-center'}>
            <span className={'text-lg'}>--</span>
            <span className={'text-xs'}>Terminal</span>
          </div>

          <div className={'flex flex-col justify-center items-center'}>
            <span className={'text-lg'}>--</span>
            <span className={'text-xs'}>Gate</span>
          </div>
        </div>
      </Grid>

      {/*Weather*/}
      <Grid size={3}>Weather</Grid>

      {/*Reports*/}
      <Grid size={2}>Reports</Grid>

      {/*Docs*/}
      <Grid size={2}>Docs</Grid>
    </Grid>
  );
}
