import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { colors, spacing, radius, sportLabel, type Sport } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import { useFamilyLinkRequests } from '../../hooks/useFamilyLinkRequests';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { supabase } from '../../lib/supabase';

function AvatarCircle({ displayName, avatarUrl, onPress, uploading }: {
  displayName: string;
  avatarUrl: string | null;
  onPress: () => void;
  uploading: boolean;
}) {
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} style={styles.avatarContainer} activeOpacity={0.8}>
      <View style={styles.avatar}>
        {uploading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text variant="h2" style={styles.avatarInitial}>{initials}</Text>
        )}
      </View>
      <Text variant="caption" style={styles.avatarHint}>Tik om te wijzigen</Text>
    </TouchableOpacity>
  );
}

export default function ProfielScreen() {
  const router = useRouter();
  const { profile, member } = useAuthStore();
  const { data: familyMembers, isLoading: loadingFamily } = useFamilyMembers();
  const { data: pendingRequests } = useFamilyLinkRequests();
  const { uploading, pickAndUpload } = useAvatarUpload();

  if (!profile) return null;

  const pending = (pendingRequests ?? []).filter((r) => r.status === 'pending');

  async function handleSignOut() {
    Alert.alert('Uitloggen', 'Weet je zeker dat je wilt uitloggen?', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Uitloggen',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>Profiel</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AvatarCircle
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          onPress={pickAndUpload}
          uploading={uploading}
        />

        {/* Persoonlijke gegevens */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label" style={styles.sectionLabel}>Persoonlijke gegevens</Text>
            <TouchableOpacity onPress={() => router.push('/profiel/bewerken')}>
              <Text variant="caption" style={styles.editLink}>Bewerken</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text variant="caption" style={styles.fieldLabel}>Naam</Text>
            <Text variant="body" style={styles.fieldValue}>{profile.display_name}</Text>
          </View>
          <View style={styles.field}>
            <Text variant="caption" style={styles.fieldLabel}>E-mailadres</Text>
            <Text variant="body" style={styles.fieldValue}>{profile.email}</Text>
          </View>
        </Card>

        {/* Sport */}
        {member && member.sport.length > 0 ? (
          <Card style={styles.section}>
            <Text variant="label" style={styles.sectionLabel}>Mijn sport</Text>
            <View style={styles.sportBadges}>
              {(member.sport as Sport[]).map((s) => (
                <Badge key={s} variant={s} label={sportLabel(s)} />
              ))}
            </View>
            <Text variant="caption" style={styles.fieldLabel}>Ingesteld door de club.</Text>
          </Card>
        ) : null}

        {/* Mijn gezin */}
        <Card style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>Mijn gezin</Text>

          {loadingFamily ? (
            <ActivityIndicator color={colors.blue} style={styles.loader} />
          ) : (
            <>
              {(familyMembers ?? []).map((fm) => (
                <View key={fm.id} style={styles.familyRow}>
                  <View style={styles.familyRowLeft}>
                    <Text variant="body" style={styles.familyName}>
                      {fm.first_name} {fm.last_name}
                    </Text>
                  </View>
                  <View style={styles.familyBadges}>
                    {(fm.sport as Sport[]).map((s) => (
                      <Badge key={s} variant={s} label={sportLabel(s)} />
                    ))}
                  </View>
                </View>
              ))}

              {pending.map((req) => (
                <View key={req.id} style={styles.pendingRow}>
                  <Clock size={14} color={colors.text2} />
                  <Text variant="caption" style={styles.pendingName}>
                    {req.first_name} {req.last_name}
                  </Text>
                  <Text variant="caption" style={styles.pendingStatus}>Wacht op goedkeuring</Text>
                </View>
              ))}

              {(familyMembers ?? []).length === 0 && pending.length === 0 ? (
                <Text variant="caption" style={styles.emptyState}>
                  Nog geen gezinsleden gekoppeld.
                </Text>
              ) : null}
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/gezin/nieuw')}
            style={styles.addButton}
          >
            Gezinslid toevoegen
          </Button>
        </Card>

        <Button
          variant="ghost"
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Uitloggen
        </Button>
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
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
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
    paddingBottom: spacing[12],
    gap: spacing[4],
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  avatarInitial: {
    color: colors.white,
    fontFamily: 'BarlowCondensed_700Bold',
  },
  avatarHint: {
    color: colors.text2,
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    color: colors.blue,
  },
  field: {
    gap: spacing[1],
  },
  fieldLabel: {
    color: colors.text2,
  },
  fieldValue: {
    color: colors.text,
  },
  sportBadges: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.navy06,
  },
  familyRowLeft: {
    flex: 1,
  },
  familyName: {
    color: colors.text,
  },
  familyBadges: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.navy06,
  },
  pendingName: {
    flex: 1,
    color: colors.text2,
  },
  pendingStatus: {
    color: colors.text2,
    fontStyle: 'italic',
  },
  emptyState: {
    color: colors.text2,
    fontStyle: 'italic',
  },
  addButton: {
    marginTop: spacing[2],
  },
  loader: {
    marginVertical: spacing[3],
  },
  signOutButton: {
    borderColor: colors.error,
  },
});
