import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, createFamilyLinkRequestSchema, type CreateFamilyLinkRequestInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useCreateFamilyLinkRequest } from '../../hooks/useFamilyLinkRequests';
import { useState } from 'react';

export default function GezinslidNieuwScreen() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateFamilyLinkRequest();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateFamilyLinkRequestInput>({
    resolver: zodResolver(createFamilyLinkRequestSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      birth_date: '',
    },
  });

  async function onSubmit(data: CreateFamilyLinkRequestInput) {
    try {
      await mutateAsync(data);
      setSubmitted(true);
    } catch {
      setError('root', { message: 'Verzoek indienen mislukt. Probeer het opnieuw.' });
    }
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text variant="h3" style={styles.headerTitle}>Gezinslid toevoegen</Text>
        </View>
        <View style={styles.successContainer}>
          <Text variant="h3" style={styles.successTitle}>Verzoek ingediend</Text>
          <Text variant="body" style={styles.successBody}>
            Je verzoek is ontvangen. Een beheerder zal dit controleren en het gezinslid aan je account koppelen.
          </Text>
          <Text variant="caption" style={styles.privacyNote}>
            Dit is nodig om de privacy van kinderen te beschermen.
          </Text>
          <Button onPress={() => router.back()} style={styles.backButton}>
            Terug naar profiel
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Button variant="ghost" size="sm" onPress={() => router.back()} style={styles.cancelButton}>
            Annuleren
          </Button>
          <Text variant="h3" style={styles.headerTitle}>Gezinslid toevoegen</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoCard}>
            <Text variant="caption" style={styles.infoText}>
              Vul de gegevens in van het gezinslid dat je wilt koppelen. Een beheerder zal het verzoek beoordelen en het juiste lid koppelen.
            </Text>
          </View>

          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <FormField label="Voornaam" error={errors.first_name?.message}>
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Voornaam"
                    autoCapitalize="words"
                    textContentType="givenName"
                  />
                )}
              />
            </FormField>

            <FormField label="Achternaam" error={errors.last_name?.message}>
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Achternaam"
                    autoCapitalize="words"
                    textContentType="familyName"
                  />
                )}
              />
            </FormField>

            <FormField
              label="Geboortedatum (optioneel)"
              error={errors.birth_date?.message}
            >
              <Controller
                control={control}
                name="birth_date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="DD-MM-JJJJ"
                    keyboardType="numeric"
                  />
                )}
              />
            </FormField>
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
          >
            Verzoek indienen
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
  cancelButton: {
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
  infoCard: {
    backgroundColor: colors.navy06,
    borderRadius: 8,
    padding: spacing[4],
  },
  infoText: {
    color: colors.text2,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    borderRadius: 6,
    padding: spacing[3],
  },
  errorText: {
    color: colors.error,
  },
  fields: {
    gap: spacing[4],
  },
  successContainer: {
    flex: 1,
    padding: spacing[6],
    gap: spacing[4],
  },
  successTitle: {
    color: colors.navy,
  },
  successBody: {
    color: colors.text,
    lineHeight: 22,
  },
  privacyNote: {
    color: colors.text2,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: spacing[4],
  },
});
