import Typography from '@mui/material/Typography';
import CreditCardIcon from '@mui/icons-material/CreditCard';

import { SelectedCardFlag } from './selectedCardFlag.tsx';
import {
  AircraftModel,
  GenerateFlightDuty,
} from '../flightDutyStepperForm.tsx';
import {
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Tooltip } from '@mui/material';

export const AircraftOption = ({
  aircraftData,
  name,
  setValue,
  getValues,
  watch,
}: {
  aircraftData: AircraftModel;
  name: 'aircraft';
  setValue: UseFormSetValue<GenerateFlightDuty>;
  getValues: UseFormGetValues<GenerateFlightDuty>;
  watch: UseFormWatch<GenerateFlightDuty>;
}) => {
  const selectedAircrafts = watch(name) || [];
  const isSelected = selectedAircrafts.includes(aircraftData.icao);

  const toggleSelection = () => {
    if (aircraftData.disable) return;
    const currentValues = getValues(name) || [];
    if (isSelected) {
      // Remove a aeronave selecionada
      setValue(
        name,
        currentValues.filter((value: string) => value !== aircraftData.icao)
      );
    } else {
      // Adiciona a aeronave selecionada
      setValue(name, [...currentValues, aircraftData.icao]);
    }
  };

  return (
    <Tooltip title={aircraftData.disable ? aircraftData.disableReason : ''}>
      <div
        className={`
        flex flex-col gap-2 relative overflow-hidden
        rounded-lg
        ${isSelected ? 'border-green-600 border-2 border-solid bg-emerald-950' : 'border border-solid border-slate-400'}
        ${aircraftData.disable && 'border-red-600 border-2 border-solid'}
        p-2 w-72 h-60
        ${!aircraftData.disable && 'hover:bg-indigo-900'}
        ${!isSelected && !aircraftData.disable && 'hover:bg-indigo-600'}
        ${aircraftData.disable && 'bg-red-950 border-red-900 border-2 border-solid'}
        cursor-pointer
        group
      `}
        onClick={toggleSelection}
      >
        {isSelected && <SelectedCardFlag />}
        <div className="w-full h-32 transition-all ease-out duration-500">
          <img
            src={aircraftData.url}
            className="object-contain w-full h-full"
            alt={aircraftData.label}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <CreditCardIcon />
            <Typography className="text-xl">{aircraftData.label}</Typography>
          </div>

          <Typography>Código ICAO: {aircraftData.icao}</Typography>
        </div>

        <div>
          <Typography>Only A320 can fly to the airports below:</Typography>
          <Typography>SBGR - SBSP - SBJP</Typography>
        </div>
      </div>
    </Tooltip>
  );
};
