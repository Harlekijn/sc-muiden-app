import { View, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { colors, radius, spacing, formatDutchDate } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { useMarkNotificationRead } from '../../hooks/useMarkNotificationRead';
import { useEffect } from 'react';

const HTML_BASESTYLES = {
  body: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  p: {
    marginTop: 0,
    marginBottom: 12,
  },
  h2: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  h3: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  a: {
    color: colors.blue,
    textDecorationLine: 'underline' as const,
  },
};

export default function AankondigingDetailScreen() {
  const { id, notification_id } = useLocalSearchParams<{ id: string; notification_id?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: announcement, isLoading, isError } = useAnnouncement(id);
  const { mutate: markRead } = useMarkNotificationRead();

  useEffect(() => {
    if (notification_id) {
      markRead(notification_id);
    }
  }, [notification_id, markRead]);

  const sportLabel =
    announcement?.sport && announcement.sport.length > 0
      ? announcement.sport.map((s) => (s === 'voetbal' ? 'Voetbal' : 'Hockey')).join(' & ')
      : null;

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
        <Text variant="h4" style={styles.headerTitle}>Nieuws</Text>
      </View>

      {isLoading ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.skeleton, { width: width * 0.6 }]} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonLine} />
          ))}
        </ScrollView>
      ) : isError || !announcement ? (
        <View style={styles.errorState}>
          <Text variant="body" style={styles.errorText}>
            Aankondiging kon niet worden geladen. Probeer het opnieuw.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {sportLabel && (
            <View style={styles.sportBadge}>
              <Text variant="label" style={styles.sportBadgeText}>{sportLabel}</Text>
            </View>
          )}
          <Text variant="h2" style={styles.title}>{announcement.title}</Text>
          <View style={styles.metaRow}>
            <Text variant="caption" style={styles.meta}>
              {announcement.published_at ? formatDutchDate(announcement.published_at) : ''}
            </Text>
            {announcement.author?.display_name && (
              <>
                <Text variant="caption" style={styles.metaDot}> · </Text>
                <Text variant="caption" style={styles.meta}>
                  {announcement.author.display_name}
                </Text>
              </>
            )}
          </View>
          <View style={styles.divider} />
          <RenderHtml
            contentWidth={width - spacing[4] * 2}
            source={{ html: announcement.body }}
            tagsStyles={HTML_BASESTYLES}
          />
        </ScrollView>
      )}
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
    paddingBottom: spacing[8],
  },
  sportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    marginBottom: spacing[3],
  },
  sportBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  meta: {
    color: colors.text2,
  },
  metaDot: {
    color: colors.text2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.mid,
    marginBottom: spacing[4],
  },
  skeleton: {
    height: 32,
    backgroundColor: colors.mid,
    borderRadius: radius.sm,
    marginBottom: spacing[4],
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.mid,
    borderRadius: radius.sm,
    marginBottom: spacing[2],
  },
  errorState: {
    flex: 1,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  errorText: {
    color: colors.text2,
    textAlign: 'center',
  },
});
