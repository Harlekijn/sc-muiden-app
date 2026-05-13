import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function RegisterBevestigdScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <CheckCircle size={48} color={colors.success} strokeWidth={1.5} style={styles.icon} />
          <Text variant="h3" style={styles.title}>Aanvraag ingediend</Text>
          <Text variant="body" style={styles.body}>
            Je aanvraag is ontvangen. Een beheerder koppelt je account aan je lidmaatschap en stuurt je een activatiemail zodra je aanvraag is goedgekeurd.
          </Text>
          <Link href="/(auth)/login" replace style={styles.link}>
            <Text variant="label" style={styles.linkText}>Terug naar inloggen</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  headerTitle: {
    color: colors.white,
    fontFamily: 'BarlowCondensed_800ExtraBold',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginBottom: spacing[4],
  },
  title: {
    color: colors.navy,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  body: {
    color: colors.text2,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: colors.blue,
  },
});
