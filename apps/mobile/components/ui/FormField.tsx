import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from './Text';

interface Props {
  label: string;
  error?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function FormField({ label, error, children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text variant="label" style={styles.label}>{label}</Text>
      {children}
      {error ? <Text variant="caption" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    color: colors.text,
  },
  error: {
    color: colors.error,
  },
});
