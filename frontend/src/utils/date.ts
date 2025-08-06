import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Configurar locale português
dayjs.locale('pt-br');

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Não registrado';
  return dayjs(dateString).format('DD/MM/YYYY [às] HH:mm');
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Não registrado';
  return dayjs(dateString).format('DD/MM/YYYY');
};

export const formatTime = (dateString: string | null): string => {
  if (!dateString) return 'Não registrado';
  return dayjs(dateString).format('HH:mm');
};

export const formatEET = (seconds: number): string => {
  if (!seconds) return '00:00';
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const calculateDuration = (startDate: string | null, endDate: string | null): string => {
  if (!startDate || !endDate) return 'Não disponível';
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const durationMinutes = end.diff(start, 'minute');
  
  return convertMinutesTo_HH_MM(durationMinutes);
};

// Função auxiliar para converter minutos em formato HH:MM
const convertMinutesTo_HH_MM = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}; 