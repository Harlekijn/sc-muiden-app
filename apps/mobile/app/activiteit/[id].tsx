import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, MapPin, Users } from 'lucide-react-native';
import { colors, spacing } from '@sc-muiden/shared';
import type { BarAssignmentWithMember } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { ActivityHero } from '../../components/activity/ActivityHero';
import { WedstrijdHero } from '../../components/activity/WedstrijdHero';
import { InfoRow, InfoSection } from '../../components/activity/InfoRow';
import { BardienstSectie } from '../../components/activity/BardienstSectie';
import { NotitiesCard } from '../../components/activity/NotitiesCard';
import { useActivityDetail } from '../../hooks/useActivityDetail';
import { useConfirmBarAssignment } from '../../hooks/useConfirmBarAssignment';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ActiviteitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: activity, isLoading, isError } = useActivityDetail(id);
  const { mutate: confirm, isPending: isConfirming, error: confirmError } = useConfirmBarAssignment(id);

  // RLS already filters bar_assignments to the current user's family members
  const barAssignments: BarAssignmentWithMember[] = activity?.bar_assignments ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletonHero} />
        <View style={styles.body}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonRow} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !activity) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text variant="body" style={styles.errorText}>
            Deze activiteit is niet meer beschikbaar.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text variant="body" style={styles.backLinkText}>Ga terug</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isWedstrijd = activity.type === 'wedstrijd';
  const isBardienst = activity.type === 'bardienst';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} bounces={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>

        {isWedstrijd ? (
          <WedstrijdHero activity={activity} />
        ) : (
          <ActivityHero activity={activity} />
        )}

        <InfoSection>
          <InfoRow icon={Clock} label={formatTime(activity.starts_at)} />
          {activity.location && (
            <InfoRow icon={MapPin} label={activity.location} mapLink={activity.location} />
          )}
          {activity.team && (
            <InfoRow icon={Users} label={activity.team.name} />
          )}
        </InfoSection>

        {isBardienst && barAssignments.length > 0 && (
          <BardienstSectie
            assignments={barAssignments}
            onConfirm={(assignmentId) => confirm(assignmentId)}
            isConfirming={isConfirming}
            error={confirmError ? 'Kon niet bevestigen. Controleer je verbinding.' : null}
          />
        )}

        {activity.notes && <NotitiesCard notes={activity.notes} />}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scroll: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    zIndex: 10,
  },
  body: {
    flex: 1,
    backgroundColor: colors.light,
    padding: spacing[4],
    gap: spacing[3],
  },
  skeletonHero: {
    height: 180,
    backgroundColor: colors.navy70,
  },
  skeletonRow: {
    height: 48,
    backgroundColor: colors.mid,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.light,
  },
  errorText: {
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  backLink: {
    marginTop: spacing[2],
  },
  backLinkText: {
    color: colors.blue,
  },
  bottomPadding: {
    height: spacing[8],
    backgroundColor: colors.light,
  },
});
