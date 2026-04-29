import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>Registreren</Text>
      <Text variant="body" style={styles.subtitle}>Maak een account aan bij SC Muiden</Text>
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
