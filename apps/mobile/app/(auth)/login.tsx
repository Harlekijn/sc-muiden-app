import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>Inloggen</Text>
      <Text variant="body" style={styles.subtitle}>Welkom terug bij SC Muiden</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  title: {
    color: colors.navy,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.text2,
  },
});
