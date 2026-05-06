import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';

const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
import { colors, spacing } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';

export default function ClubScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>Club</Text>
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
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingTop: ANDROID_TOP + spacing[4],
    paddingBottom: spacing[4],
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
