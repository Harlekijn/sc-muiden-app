import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, formatActivityType } from '@sc-muiden/shared';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { Text } from '../ui/Text';
import { sportLabel } from '@sc-muiden/shared';

const DUTCH_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DUTCH_MONTHS_LONG = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

function formatDutchDate(iso: string): string {
  const d = new Date(iso);
  return `${DUTCH_DAYS[d.getDay()]} ${d.getDate()} ${DUTCH_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

interface ActivityHeroProps {
  activity: ActivityWithDetails;
}

export function ActivityHero({ activity }: ActivityHeroProps) {
  const teamName = activity.team?.name ?? 'SC Muiden';

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.typeBadge}>
          <Text variant="label" style={styles.typeBadgeText}>
            {formatActivityType(activity.type)}
          </Text>
        </View>
        {activity.sport && (
          <View style={styles.sportBadge}>
            <Text variant="label" style={styles.sportBadgeText}>
              {sportLabel(activity.sport)}
            </Text>
          </View>
        )}
      </View>
      <Text variant="h3" style={styles.teamName}>{teamName}</Text>
      <Text variant="body" style={styles.datetime}>
        {formatDutchDate(activity.starts_at)}
      </Text>
      <Text variant="body" style={styles.datetime}>
        {formatTime(activity.starts_at)}
        {activity.ends_at ? ` – ${formatTime(activity.ends_at)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[1],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  typeBadge: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: colors.navy,
    fontSize: 11,
  },
  sportBadge: {
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  sportBadgeText: {
    color: colors.navy,
    fontSize: 11,
  },
  teamName: {
    color: colors.white,
    fontFamily: 'Barlow Condensed',
  },
  datetime: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
});
