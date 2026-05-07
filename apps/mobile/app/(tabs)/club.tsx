import { View, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { AppHeader } from '../../components/ui/AppHeader';

export default function ClubScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />

      {/* Sub-header: page title */}
      <View style={styles.subHeader}>
        <Text variant="h3" style={styles.subHeaderTitle}>Club</Text>
      </View>

      <View style={styles.body}>
        <Text variant="body" style={styles.placeholder}>Wordt binnenkort gevuld</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  subHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  subHeaderTitle: {
    color: colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  placeholder: {
    color: colors.text2,
  },
});
