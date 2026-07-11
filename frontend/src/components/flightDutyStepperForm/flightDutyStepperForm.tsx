import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { AircraftOption } from './AircraftOption/aircraftOption.tsx';
import { useForm } from 'react-hook-form';
import { postGenerateFlightDuty } from '../../services/latam/latam.service.ts';
import { PostGenerateFlightDutyParams } from '../../services/latam/latam.types.ts';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import ProtectedElement from '../protection/protectedElement.tsx';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';

export interface GenerateFlightDuty {
  aircraft: Array<string>;
  numberOfFlights: number;
}

export type AircraftModelBase = {
  label: string; // Nome da aeronave
  url: string; // URL da imagem da aeronave
  icao: string; // Código ICAO da aeronave
};

export type AircraftModelEnabled = AircraftModelBase & {
  disable?: false; // Explicitamente indicando que `disable` é falso ou ausente
};

export type AircraftModelDisabled = AircraftModelBase & {
  disable: true;
  disableReason: string; // Obrigatório se `disable` for true
};

export type AircraftModel = AircraftModelEnabled | AircraftModelDisabled;

const aircraftList: Array<AircraftModel> = [
  {
    label: 'Airbus A319',
    url: '/aircraft/A319.png',
    icao: 'A319',
  },
  {
    label: 'Airbus A320 (CEO)',
    url: '/aircraft/A320.png',
    icao: 'A320',
  },
  {
    label: 'Airbus A320neo (NEO)',
    url: '/aircraft/A320-neo.png',
    icao: 'A20N',
  },
  {
    label: 'Airbus A321',
    url: '/aircraft/A321.png',
    icao: 'A321',
    disable: false,
  },
  {
    label: 'Airbus A321-Neo',
    url: '/aircraft/A321-neo.png',
    icao: 'A21N',
    disable: true,
    disableReason: 'Sem aeronaves NEO no efetivo',
  },
];

export default function FlightDutyStepperForm() {
  const [activeStep, setActiveStep] = React.useState(0);
  const flightDuty = useFlightDuty();
  const { handleSubmit, setValue, getValues, watch } =
    useForm<PostGenerateFlightDutyParams>({
      mode: 'onChange',
      defaultValues: {
        aircraft: [],
        numberOfFlights: 2,
      },
    });

  const onSubmit = (data: PostGenerateFlightDutyParams) => {
    postGenerateFlightDuty(data).then(() => {
      flightDuty.refetch();
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleNumberOfFlights = (event: SelectChangeEvent) => {
    setValue('numberOfFlights', +event.target.value);
  };

  const StepButton = () => {
    return (
      <div className={'flex gap-2'}>
        {activeStep !== 0 && (
          <Button onClick={handleBack} variant="contained" color={'primary'}>
            Back
          </Button>
        )}
        <Button variant="contained" onClick={handleNext} color={'secondary'}>
          {activeStep === 1 ? 'Finish' : 'Continue'}
        </Button>
      </div>
    );
  };

  return (
    <ProtectedElement requiredPermission={['GENERATE_FLIGHT']}>
      <Box className={'w-full'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={'bg-amber-600'}>
            🚧 Under construction. The idea is to show possible destinations based on what
            the pilot is selecting
          </div>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step key={'aircraft'} active={activeStep === 0}>
            <StepLabel
              optional={
                'Select one or more aircraft for your flight duty schedule'
              }
            >
              Aircraft
            </StepLabel>
            <StepContent>
              <div className={'pt-4 flex flex-col gap-4'}>
                <Typography>
                  Select one or more aircraft for your flight duty schedule
                </Typography>

                <div className="flex gap-4 flex-wrap w-full">
                  {aircraftList.map((aircraftData) => (
                    <AircraftOption
                      key={aircraftData.label}
                      aircraftData={aircraftData}
                      name="aircraft"
                      setValue={setValue}
                      getValues={getValues}
                      watch={watch}
                    />
                  ))}
                </div>

                <StepButton />
              </div>
            </StepContent>
          </Step>
          <Step key={'flight-duty'} active={activeStep === 1}>
            <StepLabel
              optional={
                'Define how many flights you want in your duty schedule (minimum: 2)'
              }
            >
              Flight Duty Options
            </StepLabel>
            <StepContent>
              <div className={'pt-4 flex flex-col gap-4'}>
                <FormControl className={'w-52'}>
                  <InputLabel id="demo-simple-select-label">
                    Number of flights
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={watch('numberOfFlights')?.toString()}
                    label="Number of flights"
                    onChange={handleNumberOfFlights}
                    variant={'outlined'}
                  >
                    {[
                      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                      18, 19, 20,
                    ].map((number) => (
                      <MenuItem value={number} key={number}>
                        {number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <StepButton />
              </div>
            </StepContent>
          </Step>
        </Stepper>
        {activeStep === 2 && (
          <div className={'pt-4 flex flex-col gap-4'}>
            <Typography>Review Your Flight Duty Preferences</Typography>
            <Typography>
              Take a moment to review your selections. Ensure that all options
              are correct before generating your flight duty schedule.
            </Typography>

            <div className={'bg-amber-600'}>
              🚧 Em construção: A ideia é mostrar o remuso do que foi
              selecionado
            </div>
            <div className={'flex gap-2'}>
              <Button
                onClick={handleReset}
                color={'primary'}
                variant={'contained'}
              >
                Reset
              </Button>
              <Button type="submit" color={'secondary'} variant={'contained'}>
                Generate Flight Duty
              </Button>
            </div>
          </div>
        )}
      </form>
    </Box>
    </ProtectedElement>
  );
}
