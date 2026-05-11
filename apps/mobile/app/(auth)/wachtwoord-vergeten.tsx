import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, forgotPasswordSchema, type ForgotPasswordInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export default function WachtwoordVergetenScreen() {
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      data.email.toLowerCase().trim(),
      { redirectTo: process.env.EXPO_PUBLIC_RESET_REDIRECT_URL }
    );

    if (error) {
      setError('root', { message: 'Er is een fout opgetreden. Probeer het opnieuw.' });
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
        </View>
        <View style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Controleer je e-mail</Text>
          <Text variant="body" style={styles.body}>
            Als je e-mailadres bekend is, ontvang je een herstelkoppeling.
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
        <Text variant="body" style={styles.headerSub}>Wachtwoord herstellen</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Wachtwoord vergeten</Text>
          <Text variant="body" style={styles.description}>
            Voer je e-mailadres in. We sturen je een koppeling om je wachtwoord te herstellen.
          </Text>

          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <FormField label="E-mailadres" error={errors.email?.message} style={styles.field}>
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

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submitButton}
          >
            Herstelkoppeling sturen
          </Button>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login">
            <Text variant="caption" style={styles.footerLink}>Terug naar inloggen</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.light,
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
    margin: spacing[4],
  },
  cardTitle: {
    color: colors.navy,
    marginBottom: spacing[3],
  },
  description: {
    color: colors.text2,
    marginBottom: spacing[5],
    lineHeight: 22,
  },
  body: {
    color: colors.text2,
    lineHeight: 22,
    marginBottom: spacing[6],
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
  field: {
    marginBottom: spacing[6],
  },
  submitButton: {
    marginBottom: spacing[2],
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  footerLink: {
    color: colors.blue,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: colors.blue,
  },
});
