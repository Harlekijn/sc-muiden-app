import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { colors, spacing, formatDutchDate } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { Logo } from '../../components/ui/Logo';
import { ActivityCard } from '../../components/agenda/ActivityCard';
import { useUpcomingActivities } from '../../hooks/useUpcomingActivities';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useAuthStore } from '../../stores/authStore';
import { useAgendaStore } from '../../stores/agendaStore';

const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function todayLabel(): string {
  const d = new Date();
  return `${formatDutchDate(d)} ${d.getFullYear()}`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

interface FamilyAvatarChipProps {
  initials: string;
  name: string;
  active: boolean;
  onPress: () => void;
}

function FamilyAvatarChip({ initials, name, active, onPress }: FamilyAvatarChipProps) {
  return (
    <Pressable style={styles.famChip} onPress={onPress} accessibilityRole="button">
      <View
        style={[
          styles.famAvatar,
          active && styles.famAvatarActive,
        ]}
      >
        <Text variant="label" style={styles.famInitials}>{initials}</Text>
      </View>
      <Text
        variant="caption"
        style={[styles.famName, active && styles.famNameActive]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { familyFilter, setFamilyFilter } = useAgendaStore();
  const { data: familyMembers = [] } = useFamilyMembers();
  const { data: activities = [], isLoading, refetch } = useUpcomingActivities();

  if (!profile) return null;

  const displayName = profile.display_name.split(' ')[0] ?? profile.display_name;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Logo height={44} />
        <Pressable style={styles.bellBtn} accessibilityRole="button" accessibilityLabel="Meldingen">
          <Bell size={18} color={colors.white} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Greeting strip */}
      <View style={styles.greetingStrip}>
        <Text variant="h2" style={styles.greetingName}>
          {greeting()}, {displayName}
        </Text>
        <Text variant="caption" style={styles.greetingDate}>{todayLabel()}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.blue}
          />
        }
      >
        {/* Family switcher */}
        {familyMembers.length > 0 && (
          <View>
            <Text variant="label" style={styles.sectionMeta}>Mijn familie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.famRow}
            >
              <FamilyAvatarChip
                initials={getInitials(
                  profile.display_name.split(' ')[0] ?? '',
                  profile.display_name.split(' ').slice(-1)[0] ?? '',
                )}
                name={(profile.display_name.split(' ')[0] ?? profile.display_name)}
                active={familyFilter === 'all'}
                onPress={() => setFamilyFilter('all')}
              />
              {familyMembers.map((m) => (
                <FamilyAvatarChip
                  key={m.id}
                  initials={getInitials(m.first_name, m.last_name)}
                  name={m.first_name}
                  active={familyFilter === m.id}
                  onPress={() => setFamilyFilter(m.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upcoming activities */}
        <View style={styles.sectionHead}>
          <Text variant="h4" style={styles.sectionTitle}>Aankomend</Text>
        </View>

        {isLoading ? (
          <SkeletonCards />
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body" style={styles.emptyText}>
              Geen activiteiten gepland voor de komende 30 dagen.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onPress={() => router.push(`/activiteit/${activity.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SkeletonCards() {
  return (
    <View style={styles.cardList}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeleton} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[5],
    paddingTop: ANDROID_TOP + spacing[3],
    paddingBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingStrip: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
  },
  greetingName: {
    color: colors.white,
    lineHeight: 34,
  },
  greetingDate: {
    color: 'rgba(255,255,255,0.50)',
    marginTop: spacing[1],
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  sectionMeta: {
    color: colors.text2,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    letterSpacing: 0.5,
  },
  famRow: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  famChip: {
    alignItems: 'center',
    gap: spacing[1],
    width: 52,
  },
  famAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  famAvatarActive: {
    borderColor: colors.blue,
  },
  famInitials: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'BarlowCondensed_700Bold',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  famName: {
    color: colors.text2,
    fontSize: 11,
    textAlign: 'center',
  },
  famNameActive: {
    color: colors.blue,
    fontFamily: 'Barlow_700Bold',
  },
  sectionHead: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    color: colors.text,
  },
  cardList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  emptyState: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text2,
    textAlign: 'center',
  },
  skeleton: {
    height: 80,
    backgroundColor: colors.mid,
    borderRadius: 10,
    marginHorizontal: spacing[4],
  },
});
