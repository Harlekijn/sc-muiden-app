import { View, Pressable, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { colors, radius, spacing } from '@sc-muiden/shared';
import type { BarAssignmentWithMember } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

interface BardienstSectieProps {
  assignments: BarAssignmentWithMember[];
  onConfirm: (id: string) => void;
  isConfirming: boolean;
  error: string | null;
}

export function BardienstSectie({
  assignments,
  onConfirm,
  isConfirming,
  error,
}: BardienstSectieProps) {
  if (assignments.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text variant="h4" style={styles.title}>Bardienst</Text>
      {assignments.map((ba) => (
        <View key={ba.id} style={styles.row}>
          <Text variant="body" style={styles.name}>
            {ba.member.first_name} {ba.member.last_name}
          </Text>
          {ba.confirmed_at ? (
            <View style={styles.confirmedBadge}>
              <CheckCircle size={16} color={colors.success} />
              <Text variant="label" style={styles.confirmedText}>Bevestigd</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.confirmBtn, isConfirming && styles.confirmBtnDisabled]}
              onPress={() => onConfirm(ba.id)}
              disabled={isConfirming}
              accessibilityRole="button"
            >
              <Text variant="label" style={styles.confirmBtnText}>
                {isConfirming ? 'Bezig...' : 'Bevestigen'}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
      {error && (
        <Text variant="caption" style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[4],
    shadowColor: '#011d50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    gap: spacing[3],
  },
  title: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    flex: 1,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.mid,
    borderRadius: radius.md,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
  },
  confirmedText: {
    color: colors.success,
    fontSize: 12,
  },
  confirmBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 12,
  },
  error: {
    color: colors.error,
  },
});
