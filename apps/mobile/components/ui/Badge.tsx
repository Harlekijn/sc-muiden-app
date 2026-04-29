import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@sc-muiden/shared';
import { Text } from './Text';

type BadgeVariant =
  | 'voetbal'
  | 'hockey'
  | 'live'
  | 'gepland'
  | 'gespeeld'
  | 'success'
  | 'error'
  | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  voetbal: { bg: colors.blue, text: colors.white },
  hockey: { bg: colors.success, text: colors.white },
  live: { bg: colors.error, text: colors.white },
  gepland: { bg: colors.navy12, text: colors.navy },
  gespeeld: { bg: colors.mid, text: colors.text2 },
  success: { bg: colors.success, text: colors.white },
  error: { bg: colors.error, text: colors.white },
  warning: { bg: colors.warning, text: colors.white },
};

export function Badge({ label, variant = 'gepland' }: BadgeProps) {
  const { bg, text: textColor } = badgeColors[variant];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text variant="label" style={[styles.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
  },
});
