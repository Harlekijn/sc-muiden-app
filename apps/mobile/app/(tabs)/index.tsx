import { View, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function ThuisScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>SC Muiden</Text>
      </View>
      <View style={styles.body}>
        <Text variant="body" style={styles.placeholder}>Geen activiteiten vandaag</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  headerTitle: {
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
