import { Pressable, View, StyleSheet } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { colors, radius, spacing, formatActivityType, getActivityTypeColor } from '@sc-muiden/shared';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { Text } from '../ui/Text';
import { sportLabel } from '@sc-muiden/shared';

interface ActivityCardProps {
  activity: ActivityWithDetails;
  onPress: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const typeColor = getActivityTypeColor(activity.type);

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={[styles.colorStrip, { backgroundColor: typeColor }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text variant="h4" style={styles.title} numberOfLines={1}>
            {activity.title}
          </Text>
          <ChevronRight size={20} color={colors.text2} />
        </View>
        <View style={styles.timeRow}>
          <Clock size={14} color={colors.text2} />
          <Text variant="caption" style={styles.time}>{formatTime(activity.starts_at)}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: typeColor + '33' }]}>
            <Text variant="label" style={[styles.badgeText, { color: typeColor }]}>
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  colorStrip: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing[3],
    paddingLeft: spacing[4],
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    color: colors.text2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
  },
  sportBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    backgroundColor: colors.blue,
  },
  sportBadgeText: {
    fontSize: 11,
    color: colors.white,
  },
});
