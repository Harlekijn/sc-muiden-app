import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@sc-muiden/shared';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { MonthCalendar } from '../../components/agenda/MonthCalendar';
import { ActivityCard } from '../../components/agenda/ActivityCard';
import { FamilyFilterChip } from '../../components/agenda/FamilyFilterChip';
import { useAgendaActivities } from '../../hooks/useAgendaActivities';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useAgendaStore } from '../../stores/agendaStore';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function activitiesForDay(activities: ActivityWithDetails[], date: Date): ActivityWithDetails[] {
  return activities.filter((a) => isSameDay(new Date(a.starts_at), date));
}

export default function AgendaScreen() {
  const router = useRouter();
  const { selectedDate, familyFilter, setSelectedDate, setFamilyFilter } = useAgendaStore();

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data: activities = [], isLoading, isError, refetch } = useAgendaActivities(year, month);
  const { data: familyMembers = [] } = useFamilyMembers();

  const dayActivities = activitiesForDay(activities, selectedDate);

  function handlePrevMonth() {
    const d = new Date(year, month - 2, 1);
    setSelectedDate(d);
  }

  function handleNextMonth() {
    const d = new Date(year, month, 1);
    setSelectedDate(d);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>Agenda</Text>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <FamilyFilterChip
            label="Heel gezin"
            active={familyFilter === 'all'}
            onPress={() => setFamilyFilter('all')}
          />
          {familyMembers.map((m) => (
            <FamilyFilterChip
              key={m.id}
              label={`${m.first_name} ${m.last_name}`}
              active={familyFilter === m.id}
              onPress={() => setFamilyFilter(m.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.blue}
          />
        }
      >
        <MonthCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          activities={activities}
          onSelectDate={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <View style={styles.daySection}>
          {isLoading ? (
            <SkeletonCards />
          ) : isError ? (
            <Text variant="body" style={styles.emptyText}>
              Geen verbinding — controleer je internetverbinding en probeer opnieuw.
            </Text>
          ) : dayActivities.length === 0 ? (
            <Text variant="body" style={styles.emptyText}>
              Geen activiteiten op deze dag.
            </Text>
          ) : (
            <View style={styles.cardList}>
              {dayActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onPress={() => router.push(`/activiteit/${activity.id}`)}
                />
              ))}
            </View>
          )}
        </View>
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    color: colors.white,
  },
  filterBar: {
    backgroundColor: colors.navy,
    paddingBottom: spacing[3],
  },
  filterContent: {
    paddingHorizontal: spacing[4],
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.light,
  },
  daySection: {
    padding: spacing[4],
  },
  cardList: {
    gap: spacing[3],
  },
  emptyText: {
    color: colors.text2,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  skeleton: {
    height: 80,
    backgroundColor: colors.mid,
    borderRadius: 10,
  },
});
