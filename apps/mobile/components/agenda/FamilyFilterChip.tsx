import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

interface FamilyFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FamilyFilterChip({ label, active, onPress }: FamilyFilterChipProps) {
  return (
    <Pressable
      style={[styles.chip, active ? styles.active : styles.inactive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text variant="label" style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    marginRight: spacing[2],
  },
  active: {
    backgroundColor: colors.white,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.navy40,
  },
  text: {
    fontSize: 12,
  },
  activeText: {
    color: colors.navy,
  },
  inactiveText: {
    color: 'rgba(255,255,255,0.75)',
  },
});
