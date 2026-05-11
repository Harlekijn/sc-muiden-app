import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, registerSchema, type RegisterInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export default function RegisterScreen() {
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    const email = data.email.toLowerCase().trim();

    // Gate: verify the email exists in the members table before creating an account.
    // Uses an RPC function (security definer) so the anon role can check membership
    // without exposing member data through RLS.
    const { data: memberExists, error: lookupError } = await supabase
      .rpc('member_email_exists', { p_email: email });

    if (lookupError) {
      setError('root', { message: 'Er is een fout opgetreden. Probeer het opnieuw.' });
      return;
    }

    if (!memberExists) {
      setError('root', {
        message:
          'Je e-mailadres is niet gevonden in de ledenadministratie. Neem contact op met de beheerder.',
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: { display_name: data.naam },
      },
    });

    if (error) {
      const message =
        error.message.includes('already registered')
          ? 'Er bestaat al een account met dit e-mailadres.'
          : 'Er is een fout opgetreden. Probeer het opnieuw.';
      setError('root', { message });
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
        </View>
        <View style={styles.successCard}>
          <Text variant="h3" style={styles.successTitle}>Controleer je e-mail</Text>
          <Text variant="body" style={styles.successBody}>
            We hebben een bevestigingslink gestuurd naar je e-mailadres. Klik op de link om je account te activeren.
          </Text>
          <Link href="/(auth)/login" style={styles.backLink}>
            <Text variant="label" style={styles.backLinkText}>Terug naar inloggen</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
        <Text variant="body" style={styles.headerSub}>Account aanmaken</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Registreren</Text>

          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <FormField label="Naam" error={errors.naam?.message}>
              <Controller
                control={control}
                name="naam"
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

            <FormField label="Wachtwoord" error={errors.password?.message}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Minimaal 8 tekens"
                    secureTextEntry
                    textContentType="newPassword"
                  />
                )}
              />
            </FormField>

            <FormField label="Wachtwoord bevestigen" error={errors.passwordBevestiging?.message}>
              <Controller
                control={control}
                name="passwordBevestiging"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Herhaal wachtwoord"
                    secureTextEntry
                    textContentType="newPassword"
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
            Account aanmaken
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
    shadowColor: '#011d50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: colors.navy,
    marginBottom: spacing[4],
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
  successContainer: {
    flex: 1,
    backgroundColor: colors.light,
  },
  successCard: {
    margin: spacing[4],
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing[6],
    shadowColor: '#011d50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  successTitle: {
    color: colors.navy,
    marginBottom: spacing[3],
  },
  successBody: {
    color: colors.text2,
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: colors.blue,
  },
});
