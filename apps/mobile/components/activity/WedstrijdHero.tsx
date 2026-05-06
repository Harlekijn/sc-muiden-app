import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, formatScore } from '@sc-muiden/shared';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

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

type StatusBadge = { label: string; bg: string; text: string };

const statusBadges: Record<string, StatusBadge> = {
  live: { label: 'LIVE', bg: colors.error, text: colors.white },
  gepland: { label: 'GEPLAND', bg: colors.navy40, text: colors.white },
  gespeeld: { label: 'GESPEELD', bg: colors.success, text: colors.white },
  afgelast: { label: 'AFGELAST', bg: colors.text2, text: colors.white },
};

interface WedstrijdHeroProps {
  activity: ActivityWithDetails;
}

export function WedstrijdHero({ activity }: WedstrijdHeroProps) {
  const match = activity.match;
  const status = match?.status ?? 'gepland';
  const badge = statusBadges[status] ?? statusBadges.gepland;
  const isGespeeld = status === 'gespeeld';

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text variant="label" style={[styles.badgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      {match && (
        <Text variant="h3" style={styles.teams}>
          {match.home_team} – {match.away_team}
        </Text>
      )}

      {isGespeeld && match?.score_home != null && match?.score_away != null && (
        <Text style={styles.score}>
          {formatScore(match.score_home, match.score_away)}
        </Text>
      )}

      <Text variant="body" style={styles.datetime}>
        {formatDutchDate(activity.starts_at)}
      </Text>
      <Text variant="body" style={styles.datetime}>
        {formatTime(activity.starts_at)}
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
    marginBottom: spacing[2],
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  teams: {
    color: colors.white,
    fontFamily: 'Barlow Condensed',
  },
  score: {
    color: colors.yellow,
    fontSize: 48,
    fontFamily: 'Barlow Condensed',
    fontWeight: '800',
    lineHeight: 52,
  },
  datetime: {
    color: colors.white85,
    fontSize: 15,
  },
});
