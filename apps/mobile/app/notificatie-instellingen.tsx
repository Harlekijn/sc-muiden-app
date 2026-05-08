import {
  View,
  Switch,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, Clock, Dumbbell } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@sc-muiden/shared';
import { Text } from '../components/ui/Text';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { useUpdateNotificationPreferences } from '../hooks/useUpdateNotificationPreferences';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

function ToggleRow({ icon, label, value, onValueChange, isLast }: ToggleRowProps) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          {icon}
          <Text variant="body" style={styles.rowLabel}>{label}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.mid, true: colors.blue }}
          thumbColor={colors.white}
          accessibilityLabel={label}
        />
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function NotificatieInstellingenScreen() {
  const router = useRouter();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: update } = useUpdateNotificationPreferences();

  function handleToggle(field: 'wedstrijd' | 'bardienst' | 'training', value: boolean) {
    update(
      { [field]: value },
      {
        onError: () => {
          Alert.alert('Fout', 'Instellingen konden niet worden opgeslagen. Probeer het opnieuw.');
        },
      }
    );
  }

  const wedstrijd = prefs?.wedstrijd ?? true;
  const bardienst = prefs?.bardienst ?? true;
  const training  = prefs?.training  ?? true;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Terug"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text variant="h4" style={styles.headerTitle}>Notificatie-instellingen</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.card}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.skeleton, i < 2 && styles.skeletonDivider]} />
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <ToggleRow
              icon={<Bell size={20} color={colors.blue} />}
              label="Wedstrijdherinneringen"
              value={wedstrijd}
              onValueChange={(v) => handleToggle('wedstrijd', v)}
            />
            <ToggleRow
              icon={<Clock size={20} color={colors.blue} />}
              label="Bardienst-herinneringen"
              value={bardienst}
              onValueChange={(v) => handleToggle('bardienst', v)}
            />
            <ToggleRow
              icon={<Dumbbell size={20} color={colors.blue} />}
              label="Trainingsherinneringen"
              value={training}
              onValueChange={(v) => handleToggle('training', v)}
              isLast
            />
          </View>
        )}

        <Text variant="caption" style={styles.caption}>
          Herinneringen worden 24 uur van tevoren verstuurd. Bardienst-herinneringen worden 48 uur van tevoren verstuurd.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
  },
  headerTitle: {
    color: colors.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: 'rgba(1,29,80,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.mid,
    marginHorizontal: spacing[4],
  },
  caption: {
    color: colors.text2,
    lineHeight: 18,
    fontFamily: 'Barlow_400Regular',
    fontSize: typography.scale.xs,
  },
  skeleton: {
    height: 52,
    backgroundColor: colors.mid,
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: radius.sm,
  },
  skeletonDivider: {
    marginBottom: 0,
  },
});
