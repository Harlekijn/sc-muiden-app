import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, formatDutchDate } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { AppHeader } from '../../components/ui/AppHeader';
import { ActivityCard } from '../../components/agenda/ActivityCard';
import { useUpcomingActivities } from '../../hooks/useUpcomingActivities';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useAuthStore } from '../../stores/authStore';
import { useAgendaStore } from '../../stores/agendaStore';
import type { ActivityWithDetails } from '@sc-muiden/shared';

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
      <View style={[styles.famAvatar, active && styles.famAvatarActive]}>
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

interface ActivitySectionProps {
  label: string;
  activities: ActivityWithDetails[];
  emptyText: string;
  onPress: (id: string) => void;
}

function ActivitySection({ label, activities, emptyText, onPress }: ActivitySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body" style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => onPress(activity.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { familyFilter, setFamilyFilter } = useAgendaStore();
  const { data: familyMembers = [] } = useFamilyMembers();
  const { data, isLoading, refetch } = useUpcomingActivities();

  if (!profile) return null;

  const displayName = profile.display_name.split(' ')[0] ?? profile.display_name;
  const vandaag = data?.vandaag ?? [];
  const binnenkort = data?.binnenkort ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />

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
                name={profile.display_name.split(' ')[0] ?? profile.display_name}
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

        {isLoading ? (
          <SkeletonCards />
        ) : (
          <>
            <ActivitySection
              label="VANDAAG"
              activities={vandaag}
              emptyText="Geen activiteiten vandaag."
              onPress={(id) => router.push(`/activiteit/${id}`)}
            />
            <ActivitySection
              label="BINNENKORT"
              activities={binnenkort}
              emptyText="Niets gepland de komende week."
              onPress={(id) => router.push(`/activiteit/${id}`)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SkeletonCards() {
  return (
    <View style={styles.cardList}>
      {[0, 1].map((i) => (
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
  section: {
    marginTop: spacing[4],
  },
  sectionLabel: {
    fontFamily: 'Barlow_700Bold',
    fontSize: 13,
    color: colors.text2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  cardList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  emptyState: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  emptyText: {
    color: colors.text2,
  },
  skeleton: {
    height: 80,
    backgroundColor: colors.mid,
    borderRadius: 10,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
  },
});
