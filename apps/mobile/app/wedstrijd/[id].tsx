import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function WedstrijdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>Wedstrijd</Text>
      </View>
      <View style={styles.body}>
        <Text variant="body" style={styles.placeholder}>Wedstrijd {id}</Text>
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
