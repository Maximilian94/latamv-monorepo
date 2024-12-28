import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AircraftOption } from './AircraftOption/aircraftOption.tsx';
import { useForm } from 'react-hook-form';
import { postGenerateFlightDuty } from '../../services/latam/latam.service.ts';
import { PostGenerateFlightDutyParams } from '../../services/latam/latam.types.ts';
import { useFlightDuty } from '../../context/flight-duty.context.tsx';

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
    label: 'Airbus A319-Neo',
    url: '/aircraft/A319-neo.png',
    icao: 'A19N',
    disable: true,
    disableReason: 'GCNA não computa aerones da linha NEO',
  },
  {
    label: 'Airbus A320',
    url: '/aircraft/A320.png',
    icao: 'A320',
  },
  {
    label: 'Airbus A320-Neo',
    url: '/aircraft/A320-neo.png',
    icao: 'A20N',
    disable: true,
    disableReason: 'GCNA não computa aerones da linha NEO',
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
    disableReason: 'GCNA não computa aerones da linha NEO',
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
    console.log('Form Data:', data);
    postGenerateFlightDuty(data).then((e) => {
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

  return (
    <Box className={'w-full'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>Resumo da seleção: 200 possíveis destinos</div>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step key={'step.label'} active={activeStep === 0}>
            <StepLabel optional={'Label optional'}>label teste</StepLabel>
            <StepContent>
              <Typography>Descrição de teste</Typography>

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

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                >
                  {activeStep === 1 ? 'Finalizar' : 'Continuar'}
                </Button>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Voltar
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
        {activeStep === 1 && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>Todas as etapas foram concluídas</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Resetar
            </Button>
            <Button type="submit" sx={{ mt: 1, mr: 1 }}>
              Enviar
            </Button>
          </Paper>
        )}
      </form>
    </Box>
  );
}
