import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Newspaper, RefreshCw } from 'lucide-react-native';
import { colors, radius, spacing, formatDutchDate } from '@sc-muiden/shared';
import type { AnnouncementWithAuthor } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useUnreadCount } from '../../hooks/useUnreadCount';

type FilterOption = 'alle' | 'voetbal' | 'hockey';

const FILTER_LABELS: Record<FilterOption, string> = {
  alle: 'Alle',
  voetbal: 'Voetbal',
  hockey: 'Hockey',
};

interface AnnouncementCardProps {
  announcement: AnnouncementWithAuthor;
  hasUnread: boolean;
  onPress: () => void;
}

function AnnouncementCard({ announcement, hasUnread, onPress }: AnnouncementCardProps) {
  const sportLabel =
    announcement.sport && announcement.sport.length > 0
      ? announcement.sport.map((s) => (s === 'voetbal' ? 'Voetbal' : 'Hockey')).join(' & ')
      : null;

  const dateStr = announcement.published_at
    ? formatDutchDate(announcement.published_at)
    : '';

  const bodyPreview = announcement.body.replace(/<[^>]*>/g, '').slice(0, 120);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={announcement.title}
    >
      {hasUnread && <View style={styles.unreadDot} />}
      {sportLabel && (
        <View style={styles.sportBadge}>
          <Text variant="label" style={styles.sportBadgeText}>{sportLabel}</Text>
        </View>
      )}
      <Text variant="h4" style={styles.cardTitle} numberOfLines={2}>
        {announcement.title}
      </Text>
      <Text variant="body" style={styles.cardBody} numberOfLines={2}>
        {bodyPreview}
      </Text>
      <Text variant="caption" style={styles.cardDate}>{dateStr}</Text>
    </Pressable>
  );
}

function SkeletonCards() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Newspaper size={48} color={colors.mid} />
      <Text variant="h4" style={styles.emptyTitle}>Geen berichten beschikbaar</Text>
      <Text variant="body" style={styles.emptyBody}>
        Er zijn nog geen aankondigingen voor jouw sportvoorkeur.
      </Text>
    </View>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text variant="h4" style={styles.emptyTitle}>Nieuws kon niet worden geladen.</Text>
      <Text variant="body" style={styles.emptyBody}>
        Controleer je verbinding en probeer opnieuw.
      </Text>
      <Pressable style={styles.retryButton} onPress={onRetry} accessibilityRole="button">
        <RefreshCw size={18} color={colors.white} />
        <Text variant="body" style={styles.retryText}>Opnieuw proberen</Text>
      </Pressable>
    </View>
  );
}

export default function NieuwsScreen() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterOption>('alle');
  const { data: announcements, isLoading, isError, refetch } = useAnnouncements(filter);
  const unreadCount = useUnreadCount();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>Nieuws</Text>
        <Pressable
          style={styles.bellButton}
          onPress={() => router.push('/notificaties')}
          accessibilityRole="button"
          accessibilityLabel="Notificaties"
        >
          <Bell size={24} color={colors.white} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text variant="caption" style={styles.bellBadgeText}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === key }}
          >
            <Text
              variant="label"
              style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}
            >
              {FILTER_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <SkeletonCards />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={announcements ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            !announcements || announcements.length === 0
              ? styles.flatListEmpty
              : styles.list
          }
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.blue} />
          }
          renderItem={({ item }) => (
            <AnnouncementCard
              announcement={item}
              hasUnread={false}
              onPress={() => router.push(`/aankondiging/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// React import needed for useState
import React from 'react';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  headerTitle: {
    color: colors.white,
  },
  bellButton: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 9,
    lineHeight: 12,
  },
  filterBar: {
    backgroundColor: colors.navy,
    paddingBottom: spacing[3],
  },
  filterBarContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterChip: {
    backgroundColor: colors.mid,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  filterChipActive: {
    backgroundColor: colors.blue,
  },
  filterChipText: {
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing[4],
    gap: spacing[3],
    backgroundColor: colors.light,
    flexGrow: 1,
  },
  flatListEmpty: {
    flexGrow: 1,
    backgroundColor: colors.light,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[4],
    shadowColor: 'rgba(1,29,80,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing[2],
  },
  unreadDot: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  sportBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
  cardTitle: {
    color: colors.text,
  },
  cardBody: {
    color: colors.text2,
  },
  cardDate: {
    color: colors.text2,
    alignSelf: 'flex-end',
  },
  skeletonCard: {
    height: 120,
    backgroundColor: colors.mid,
    borderRadius: radius.lg,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  emptyTitle: {
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.text2,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    marginTop: spacing[2],
  },
  retryText: {
    color: colors.white,
  },
});
