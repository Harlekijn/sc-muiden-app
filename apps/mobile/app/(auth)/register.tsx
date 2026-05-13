import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, createAccountRequestSchema, type CreateAccountRequestInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useSubmitAccountRequest } from '../../hooks/useAccountRequest';

export default function RegisterScreen() {
  const submitRequest = useSubmitAccountRequest();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountRequestInput>({
    resolver: zodResolver(createAccountRequestSchema),
    defaultValues: {
      display_name: '',
      email: '',
      birth_date: null,
    },
  });

  async function onSubmit(data: CreateAccountRequestInput) {
    try {
      await submitRequest.mutateAsync(data);
      router.replace('/(auth)/register-bevestigd');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Er is een fout opgetreden. Probeer het opnieuw.';
      setError('root', { message });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
        <Text variant="body" style={styles.headerSub}>Account aanvragen</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Account aanvragen</Text>
          <Text variant="body" style={styles.cardIntro}>
            Vul je gegevens in. Een beheerder koppelt je aanvraag aan je lidmaatschap en stuurt je een activatiemail.
          </Text>

          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <FormField label="Naam" error={errors.display_name?.message}>
              <Controller
                control={control}
                name="display_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Jan de Vries"
                    textContentType="name"
                    autoCapitalize="words"
                  />
                )}
              />
            </FormField>

            <FormField label="E-mailadres" error={errors.email?.message}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="naam@voorbeeld.nl"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                  />
                )}
              />
            </FormField>

            <FormField label="Geboortedatum (optioneel)" error={errors.birth_date?.message}>
              <Controller
                control={control}
                name="birth_date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value ?? ''}
                    onChangeText={(text) => onChange(text || null)}
                    onBlur={onBlur}
                    placeholder="DD-MM-JJJJ"
                    keyboardType="numbers-and-punctuation"
                  />
                )}
              />
            </FormField>
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submitButton}
          >
            Aanvraag indienen
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="caption" style={styles.footerText}>Al een account? </Text>
          <Link href="/(auth)/login">
            <Text variant="caption" style={styles.footerLink}>Inloggen</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  headerTitle: {
    color: colors.white,
    fontFamily: 'BarlowCondensed_800ExtraBold',
    letterSpacing: 1,
  },
  headerSub: {
    color: colors.navy40,
    marginTop: spacing[1],
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.light,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing[6],
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: colors.navy,
    marginBottom: spacing[2],
  },
  cardIntro: {
    color: colors.text2,
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    borderRadius: 6,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error,
  },
  fields: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  submitButton: {
    marginBottom: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  footerText: {
    color: colors.text2,
  },
  footerLink: {
    color: colors.blue,
    fontFamily: 'Barlow_600SemiBold',
  },
});
