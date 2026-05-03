import { View, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, updateProfileSchema, type UpdateProfileInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';

export default function ProfielBewerkenScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { mutateAsync, isPending } = useUpdateProfile();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    try {
      await mutateAsync(data);
      router.back();
    } catch {
      setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Button variant="ghost" size="sm" onPress={() => router.back()} style={styles.backButton}>
            Annuleren
          </Button>
          <Text variant="h3" style={styles.headerTitle}>Gegevens bewerken</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <FormField label="Naam" error={errors.display_name?.message}>
            <Controller
              control={control}
              name="display_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Jouw naam"
                  textContentType="name"
                  autoCapitalize="words"
                />
              )}
            />
          </FormField>

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            style={styles.saveButton}
          >
            Opslaan
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    borderColor: 'transparent',
    minWidth: 80,
  },
  headerTitle: {
    flex: 1,
    color: colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 80,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    borderRadius: 6,
    padding: spacing[3],
  },
  errorText: {
    color: colors.error,
  },
  saveButton: {
    marginTop: spacing[2],
  },
});
