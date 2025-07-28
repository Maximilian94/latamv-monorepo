import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';
import { Typography, Box } from '@mui/material';
import { Flight } from '../../services/latam/latam.service';
import SeverityIcon from '../severity/severityIcon/severityIcon';
import { Severity } from '../../services/latam/latam.types';


interface FlightEventsTimelineProps {
  flight: Flight;
}

export default function FlightEventsTimeline({ flight }: FlightEventsTimelineProps) {
  if (!flight.flightEvents || flight.flightEvents.length === 0) {
    return (
      <Box className="p-4">
        <Typography variant="body2" className="text-slate-400 text-center">
          Nenhum evento registrado para este voo.
        </Typography>
      </Box>
    );
  }

  // Ordenar eventos por timestamp
  const sortedEvents = [...flight.flightEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Timeline className="p-0" sx={{
      [`& .${timelineOppositeContentClasses.root}`]: {
        flex: 0,
      },
    }}>
      {sortedEvents.map((event, index) => {
        const eventTime = new Date(event.timestamp);
        const timeString = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Mapear o nome da severidade para o ID numérico
        const severityMap: Record<string, number> = {
          'StandardCompliance': Severity.StandardCompliance,
          'ProactiveExcellence': Severity.ProactiveExcellence,
          'ProceduralDeviation': Severity.ProceduralDeviation,
          'SafetyCompromise': Severity.SafetyCompromise,
        };
        
        const severityId = severityMap[event.event.severity.name] || Severity.StandardCompliance;

        return (
          <TimelineItem key={event.id}>
            <TimelineOppositeContent className="text-slate-400 text-sm m-0 p-0 mr-2">
              {timeString}
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot className="bg-inherit border-0 p-0 m-0 mb-2">
                <div className="flex items-center justify-center w-full h-full text-xl">
                  <SeverityIcon severity={severityId} />
                </div>
              </TimelineDot>
              {index < sortedEvents.length - 1 && (
                <TimelineConnector className="bg-slate-600 mb-2" />
              )}
            </TimelineSeparator>
            
            <TimelineContent className="p-0 m-0 ml-2">
              <Box className="space-y-1">
                <Typography variant="body1" className="text-slate-200 font-medium">
                  {event.event.name}
                </Typography>
                {event.event.eventDescription && (
                  <Typography variant="body2" className="text-slate-400">
                    {event.event.eventDescription.description}
                  </Typography>
                )}
              </Box>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
} 