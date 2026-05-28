import { View, FlatList, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronLeft, Clock, Newspaper } from 'lucide-react-native';
import { colors, radius, spacing } from '@sc-muiden/shared';
import type { NotificationWithContext } from '@sc-muiden/shared';
import { Text } from '../components/ui/Text';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationRead } from '../hooks/useMarkNotificationRead';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

function typeIcon(type: string | null, isUnread: boolean) {
  const color = isUnread ? colors.blue : colors.text2;
  const size = 24;
  switch (type) {
    case 'aankondiging':
      return <Newspaper size={size} color={color} />;
    case 'wedstrijd_herinnering':
      return <Calendar size={size} color={color} />;
    case 'bardienst_herinnering':
      return <Clock size={size} color={color} />;
    default:
      return <Bell size={size} color={color} />;
  }
}

function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: nl });
}

interface NotificatieRijProps {
  notification: NotificationWithContext;
  onPress: () => void;
}

function NotificatieRij({ notification, onPress }: NotificatieRijProps) {
  const isUnread = !notification.read_at;

  return (
    <>
      <Pressable
        style={styles.row}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={notification.title}
      >
        <View style={styles.iconCircle}>
          {typeIcon(notification.type ?? null, isUnread)}
        </View>
        <View style={styles.rowContent}>
          <Text
            variant="body"
            style={[styles.rowTitle, isUnread && styles.rowTitleUnread]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text variant="caption" style={styles.rowTime}>
            {relativeTime(notification.created_at)}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </Pressable>
      <View style={styles.divider} />
    </>
  );
}

function SkeletonRows() {
  return (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i}>
          <View style={styles.skeletonRow} />
          <View style={styles.divider} />
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Bell size={48} color={colors.mid} />
      <Text variant="h4" style={styles.emptyTitle}>Geen notificaties</Text>
      <Text variant="body" style={styles.emptyBody}>
        Je hebt nog geen notificaties ontvangen.
      </Text>
    </View>
  );
}

export default function NotificatiesScreen() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  function handlePress(notification: NotificationWithContext) {
    if (!notification.read_at) {
      markRead(notification.id);
    }
    if (notification.type === 'aankondiging' && notification.data?.announcement_id) {
      router.push(`/aankondiging/${notification.data.announcement_id as string}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Terug"
        >
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text variant="h4" style={styles.headerTitle}>Notificaties</Text>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <SkeletonRows />
        ) : (
          <FlatList
            data={notifications ?? []}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState />}
            contentContainerStyle={
              !notifications || notifications.length === 0 ? styles.flatListEmpty : undefined
            }
            renderItem={({ item }) => (
              <NotificatieRij
                notification={item}
                onPress={() => handlePress(item)}
              />
            )}
          />
        )}
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
  body: {
    flex: 1,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    minHeight: 64,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy06,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
  },
  rowTitleUnread: {
    fontFamily: 'Barlow_600SemiBold',
  },
  rowTime: {
    color: colors.text2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.mid,
  },
  skeletonRow: {
    height: 64,
    backgroundColor: colors.mid,
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: radius.sm,
  },
  flatListEmpty: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
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
});
