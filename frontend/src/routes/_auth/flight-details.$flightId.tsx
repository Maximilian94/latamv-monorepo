import { createFileRoute } from '@tanstack/react-router';
import { Card } from '../../components/card.tsx';
import { useGetFlightById } from '../../services/latam/latam.service.ts';
import Grid from '@mui/material/Grid2';
import { Skeleton, Typography, Chip, Box } from '@mui/material';
import { ArrowForward, Flight, Schedule, LocationOn, PendingActions } from '@mui/icons-material';
import SeverityInfo from '../../components/severity/severityInfo.tsx';
import FlightEventsTimeline from '../../components/flightEventsTimeline/flightEventsTimeline.tsx';
import { formatDateTime, calculateDuration } from '../../utils/date.ts';

const FlightDetails = () => {
  const { flightId } = Route.useParams();
  const { data: flight, isLoading, error } = useGetFlightById(Number(flightId));

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton variant="rectangular" height={200} />
        <Skeleton variant="rectangular" height={100} className="mt-4" />
        <Skeleton variant="rectangular" height={100} className="mt-4" />
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="p-6">
        <Typography variant="h6" color="error">
          Erro ao carregar detalhes do voo
        </Typography>
      </div>
    );
  }

  // Verificar se o voo foi revisado
  if (!flight.isReviewed) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <PendingActions className="text-slate-400 text-6xl mb-4" />
          <Typography variant="h5" className="text-slate-200 text-center">
            Flight not reviewed
          </Typography>
          <Typography variant="body1" className="text-slate-400 text-center max-w-md">
            This flight has not been reviewed yet. Details and events will only be available after review.
          </Typography>
          <Chip 
            label="Pending review" 
            color="warning"
            variant="outlined"
            className="mt-2"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography variant="h4" className="text-slate-200">
          Detalhes do Voo
        </Typography>
        <Chip 
          label={flight.isClosed ? 'Concluído' : 'Em andamento'} 
          color={flight.isClosed ? 'success' : 'warning'}
          variant="outlined"
        />
      </div>

      {/* Flight Information */}
      <Card>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Typography variant="h5" className="text-slate-200 mb-4">
              Informações do Voo
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Box className="space-y-3">
              <div className="flex items-center gap-2">
                <Flight className="text-slate-400" />
                <Typography variant="body1" className="text-slate-200">
                  <strong>Número do Voo:</strong> {flight.flightNumber}
                </Typography>
              </div>
              
              <div className="flex items-center gap-2">
                <LocationOn className="text-slate-400" />
                <Typography variant="body1" className="text-slate-200">
                  <strong>Rota:</strong> {flight.departureIcao} 
                  <ArrowForward className="mx-2" fontSize="small" />
                  {flight.arrivalIcao}
                </Typography>
              </div>
              
              <div className="flex items-center gap-2">
                <Schedule className="text-slate-400" />
                <Typography variant="body1" className="text-slate-200">
                  <strong>Aeronave:</strong> {flight.aircraftRegistration} ({flight.aircraftModel})
                </Typography>
              </div>
              
              <div className="flex items-center gap-2">
                <Schedule className="text-slate-400" />
                <Typography variant="body1" className="text-slate-200">
                  <strong>EET:</strong> {flight.eet.slice(0, 2)}h {flight.eet.slice(2, 4)}m
                </Typography>
              </div>
            </Box>
          </Grid>
          
          <Grid size={6}>
            <Box className="space-y-3">
              <Typography variant="body1" className="text-slate-200">
                <strong>Status:</strong> {flight.isClosed ? 'Concluído' : 'Em andamento'}
              </Typography>
              <Typography variant="body1" className="text-slate-200">
                <strong>Revisado:</strong> {flight.isReviewed ? 'Sim' : 'Não'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Flight Times */}
      {flight.isClosed && (
        <Card>
          <Typography variant="h6" className="text-slate-200 mb-4">
            Horários do Voo
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={6}>
              <Box className="space-y-2">
                <Typography variant="body2" className="text-slate-400">
                  <strong>OUT:</strong> {formatDateTime(flight.OUT)}
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  <strong>OFF:</strong> {formatDateTime(flight.OFF)}
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  <strong>ON:</strong> {formatDateTime(flight.ON)}
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  <strong>IN:</strong> {formatDateTime(flight.IN)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={6}>
              <Box className="space-y-2">
                <Typography variant="body2" className="text-slate-400">
                  <strong>Duração do Voo:</strong> {calculateDuration(flight.OUT, flight.IN)}
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  <strong>Início ACARS:</strong> {formatDateTime(flight.startAcarsTime)}
                </Typography>
                <Typography variant="body2" className="text-slate-400">
                  <strong>Fim ACARS:</strong> {formatDateTime(flight.endAcarsTime)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Flight Score and Review */}
      {flight.isClosed && (
        <Card>
          <Typography variant="h6" className="text-slate-200 mb-4">
            Avaliação do Voo
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={6}>
              <Box className="space-y-2">
                <Typography variant="body1" className="text-slate-200">
                  <strong>Score:</strong> {flight.score || 'Não avaliado'}
                </Typography>
                
                {flight.isReviewed && (
                  <div className="mt-4 animate-fade-in">
                    <Typography variant="body2" className="text-slate-400 mb-2">
                      <strong>Eventos Registrados:</strong>
                    </Typography>
                    <div className="space-y-1">
                      <Typography variant="body2" className="text-slate-400">
                        Excelência Proativa: {flight.amountOfProactiveExcellence || 0}
                      </Typography>
                      <Typography variant="body2" className="text-slate-400">
                        Conformidade Padrão: {flight.amountOfStandardCompliance || 0}
                      </Typography>
                      <Typography variant="body2" className="text-slate-400">
                        Desvio Procedural: {flight.amountOfProceduralDeviation || 0}
                      </Typography>
                      <Typography variant="body2" className="text-slate-400">
                        Comprometimento de Segurança: {flight.amountOfSafetyCompromise || 0}
                      </Typography>
                    </div>
                  </div>
                )}
              </Box>
            </Grid>
            
            <Grid size={6}>
              <div className="flex justify-center items-center h-full">
                {flight.isReviewed && (
                  <div className="animate-fade-in">
                    <SeverityInfo flight={flight} small={false} />
                  </div>
                )}
              </div>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Flight Events */}
      {flight.flightEvents && flight.flightEvents.length > 0 && (
        <Card>
          <Typography variant="h6" className="text-slate-200 mb-4">
            Eventos do Voo
          </Typography>
          
          <div className="w-full h-full p-2 pl-4">
            <FlightEventsTimeline flight={flight} />
          </div>

        </Card>
      )}
    </div>
  );
};

export const Route = createFileRoute('/_auth/flight-details/$flightId')({
  component: FlightDetails,
}); 