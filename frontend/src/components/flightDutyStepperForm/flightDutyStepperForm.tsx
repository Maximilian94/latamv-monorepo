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
import { useQuery } from '@tanstack/react-query';
import {
  postGenerateFlightDuty,
  getAircraftOptions,
} from '../../services/latam/latam.service.ts';
import { PostGenerateFlightDutyParams } from '../../services/latam/latam.types.ts';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';
import ProtectedElement from '../protection/protectedElement.tsx';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
} from '@mui/material';

// Per-leg flight-time range bounds (minutes) for the generation slider.
const EET_MIN = 20;
const EET_MAX = 300;
const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
};

export interface GenerateFlightDuty {
  aircraft: Array<string>;
  numberOfFlights: number;
}

export type AircraftModelBase = {
  label: string; // Nome da aeronave
  url: string; // URL da imagem da aeronave
  icao: string; // Código ICAO da aeronave
  count?: number; // Aeronaves disponíveis no efetivo
};

export type AircraftModelEnabled = AircraftModelBase & {
  disable?: false; // Explicitamente indicando que `disable` é falso ou ausente
};

export type AircraftModelDisabled = AircraftModelBase & {
  disable: true;
  disableReason: string; // Obrigatório se `disable` for true
};

export type AircraftModel = AircraftModelEnabled | AircraftModelDisabled;

// Card artwork per selection code; the labels + availability come from the API.
const AIRCRAFT_IMAGES: Record<string, string> = {
  A319: '/aircraft/A319.png',
  A320: '/aircraft/A320.png',
  A20N: '/aircraft/A320-neo.png',
  A321: '/aircraft/A321.png',
  A21N: '/aircraft/A321-neo.png',
};
const DEFAULT_AIRCRAFT_IMAGE = '/aircraft/A320.png';

export default function FlightDutyStepperForm() {
  const [activeStep, setActiveStep] = React.useState(0);
  const flightDuty = useFlightDuty();
  const { handleSubmit, setValue, getValues, watch } =
    useForm<PostGenerateFlightDutyParams>({
      mode: 'onChange',
      defaultValues: {
        aircraft: [],
        numberOfFlights: 2,
        minEet: 40,
        maxEet: 180,
      },
    });

  const onSubmit = (data: PostGenerateFlightDutyParams) => {
    postGenerateFlightDuty(data)
      .then(() => {
        flightDuty.refetch();
      })
      .catch(() => {
        // API errors are surfaced by the axios interceptor toast.
      });
  };

  const eetRange: number[] = [
    watch('minEet') ?? EET_MIN,
    watch('maxEet') ?? EET_MAX,
  ];

  const aircraftOptionsQuery = useQuery({
    queryKey: ['aircraft-options'],
    queryFn: getAircraftOptions,
    staleTime: 5 * 60 * 1000,
  });

  const aircraftList: Array<AircraftModel> = (
    aircraftOptionsQuery.data?.data ?? []
  ).map((o) =>
    o.count > 0
      ? {
          label: o.label,
          url: AIRCRAFT_IMAGES[o.code] ?? DEFAULT_AIRCRAFT_IMAGE,
          icao: o.code,
          count: o.count,
        }
      : {
          label: o.label,
          url: AIRCRAFT_IMAGES[o.code] ?? DEFAULT_AIRCRAFT_IMAGE,
          icao: o.code,
          count: 0,
          disable: true,
          disableReason: 'Sem aeronaves disponíveis no efetivo',
        }
  );

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

                {aircraftOptionsQuery.isLoading && (
                  <Typography color="text.secondary">
                    Carregando aeronaves disponíveis…
                  </Typography>
                )}
                {aircraftOptionsQuery.isError && (
                  <Typography color="error">
                    Não foi possível carregar as aeronaves. Atualize a página e
                    tente novamente.
                  </Typography>
                )}
                {!aircraftOptionsQuery.isLoading &&
                  !aircraftOptionsQuery.isError &&
                  aircraftList.length === 0 && (
                    <Typography color="text.secondary">
                      Nenhuma aeronave cadastrada no efetivo.
                    </Typography>
                  )}

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

                <div className={'w-full max-w-md pr-2'}>
                  <Typography gutterBottom>
                    Flight time per leg: {formatMinutes(eetRange[0])} –{' '}
                    {formatMinutes(eetRange[1])}
                  </Typography>
                  <Slider
                    value={eetRange}
                    onChange={(_, value) => {
                      const [min, max] = value as number[];
                      setValue('minEet', min);
                      setValue('maxEet', max);
                    }}
                    min={EET_MIN}
                    max={EET_MAX}
                    step={5}
                    marks={[
                      { value: EET_MIN, label: formatMinutes(EET_MIN) },
                      { value: 60, label: '1h' },
                      { value: 120, label: '2h' },
                      { value: 180, label: '3h' },
                      { value: 240, label: '4h' },
                      { value: EET_MAX, label: formatMinutes(EET_MAX) },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatMinutes}
                    disableSwap
                  />
                  <Typography variant="caption" color="text.secondary">
                    Only routes whose enroute time falls in this range will be
                    picked for each leg.
                  </Typography>
                </div>

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
