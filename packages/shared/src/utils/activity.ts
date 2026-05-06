import type { ActivityType } from '../types/app.types';

const activityTypeLabels: Record<ActivityType, string> = {
  training: 'Training',
  wedstrijd: 'Wedstrijd',
  bardienst: 'Bardienst',
  clubactiviteit: 'Clubactiviteit',
};

export function formatActivityType(type: ActivityType): string {
  return activityTypeLabels[type];
}

// Returns the hex value corresponding to the design token per activity type
const activityTypeColors: Record<ActivityType, string> = {
  training: '#046bba',     // --color-blue
  wedstrijd: '#011d50',    // --color-navy
  bardienst: '#f5c518',    // --color-yellow
  clubactiviteit: '#1a8c5c', // --color-success
};

export function getActivityTypeColor(type: ActivityType): string {
  return activityTypeColors[type];
}
