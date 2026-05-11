import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, MapPin, Users } from 'lucide-react-native';
import { colors, radius, spacing, formatScore } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { BottomTabBar } from '../../components/ui/BottomTabBar';
import { useMatch } from '../../hooks/useMatch';

const DUTCH_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

function formatDutchDate(iso: string): string {
  const d = new Date(iso);
  return `${DUTCH_DAYS[d.getDay()]} ${d.getDate()} ${DUTCH_MONTHS[d.getMonth()]}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

type StatusConfig = { label: string; bg: string; text: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  gepland:  { label: 'GEPLAND',  bg: colors.navy12, text: colors.navy },
  gespeeld: { label: 'GESPEELD', bg: 'rgba(26,140,92,0.15)', text: colors.success },
  afgelast: { label: 'AFGELAST', bg: 'rgba(90,110,138,0.15)', text: colors.text2 },
  live:     { label: 'LIVE',     bg: colors.error, text: colors.white },
};

export default function WedstrijdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: match, isLoading, isError } = useMatch(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ChevronLeft size={20} color={colors.white} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle}>Wedstrijd</Text>
        </View>
        <View style={styles.body}>
          <View style={[styles.skeleton, { height: 120 }]} />
          <View style={[styles.skeleton, { height: 48 }]} />
          <View style={[styles.skeleton, { height: 48 }]} />
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  if (isError || !match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ChevronLeft size={20} color={colors.white} />
          </Pressable>
          <Text variant="h4" style={styles.headerTitle}>Wedstrijd</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text variant="body" style={styles.errorText}>Wedstrijd niet gevonden.</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text variant="body" style={styles.backLinkText}>Ga terug naar de kalender.</Text>
          </Pressable>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.gepland;
  const isGespeeld = match.status === 'gespeeld';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Terug"
        >
          <ChevronLeft size={20} color={colors.white} />
        </Pressable>
        <Text variant="h4" style={styles.headerTitle} numberOfLines={1}>
          {match.teamName ?? 'Wedstrijd'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.heroSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text variant="label" style={[styles.statusText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>

          <Text variant="h3" style={styles.teams}>
            {match.homeTeam} – {match.awayTeam}
          </Text>

          {isGespeeld && match.scoreHome != null && match.scoreAway != null && (
            <Text style={styles.score}>
              {formatScore(match.scoreHome, match.scoreAway)}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Clock size={20} color={colors.blue} />
            <Text variant="body" style={styles.infoText}>
              {formatDutchDate(match.startsAt)} om {formatTime(match.startsAt)}
            </Text>
          </View>

          {match.location && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.blue} />
                <Text variant="body" style={styles.infoText}>{match.location}</Text>
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.apple.com/?q=${encodeURIComponent(match.location!)}`
                    )
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Open locatie in Kaarten"
                >
                  <Text variant="label" style={styles.mapLink}>Open in Kaarten</Text>
                </Pressable>
              </View>
            </>
          )}

          {match.teamName && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Users size={20} color={colors.blue} />
                <Text variant="body" style={styles.infoText}>{match.teamName}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <BottomTabBar />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
  },
  heroSection: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
    gap: spacing[2],
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    marginBottom: spacing[1],
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  teams: {
    color: colors.white,
  },
  score: {
    color: colors.yellow,
    fontSize: 48,
    fontFamily: 'BarlowCondensed_800ExtraBold',
    lineHeight: 52,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  infoCard: {
    margin: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    color: colors.text,
  },
  mapLink: {
    color: colors.blue,
  },
  divider: {
    height: 1,
    backgroundColor: colors.mid,
    marginHorizontal: spacing[4],
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  errorText: {
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  backLink: {
    marginTop: spacing[2],
  },
  backLinkText: {
    color: colors.blue,
  },
  body: {
    flex: 1,
    backgroundColor: colors.light,
    padding: spacing[4],
    gap: spacing[3],
  },
  skeleton: {
    backgroundColor: colors.mid,
    borderRadius: radius.md,
  },
});
