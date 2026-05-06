import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@sc-muiden/shared';
import { Text } from '../ui/Text';

interface NotitiesCardProps {
  notes: string;
}

export function NotitiesCard({ notes }: NotitiesCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="body" style={styles.text}>{notes}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light,
    borderRadius: radius.lg,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[3],
  },
  text: {
    color: colors.text,
  },
});
