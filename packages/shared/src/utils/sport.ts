import type { Sport } from '../types/app.types';
import { colors } from '../tokens';

export function sportLabel(sport: Sport): string {
  return sport === 'voetbal' ? 'Voetbal' : 'Hockey';
}

export function sportBadgeColor(sport: Sport): string {
  return sport === 'voetbal' ? colors.blue : colors.success;
}

export function sportTextColor(_sport: Sport): string {
  return colors.white;
}

export const SPORT_OPTIONS: { value: Sport; label: string }[] = [
  { value: 'voetbal', label: 'Voetbal' },
  { value: 'hockey', label: 'Hockey' },
];
