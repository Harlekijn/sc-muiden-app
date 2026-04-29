import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export function formatDutchDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE d MMMM', { locale: nl });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

export function formatDutchDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayPart = format(d, 'EEEE d MMMM', { locale: nl });
  const timePart = format(d, 'HH:mm');
  return `${dayPart} om ${timePart}`;
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM', { locale: nl });
}
