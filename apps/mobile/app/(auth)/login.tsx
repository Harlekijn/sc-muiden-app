import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, loginSchema, type LoginInput } from '@sc-muiden/shared';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.toLowerCase().trim(),
      password: data.password,
    });

    if (error) {
      const message =
        error.message === 'Invalid login credentials'
          ? 'E-mailadres of wachtwoord onjuist'
          : 'Er is een fout opgetreden. Probeer het opnieuw.';
      setError('root', { message });
    }
    // On success: root layout's onAuthStateChange handles redirect
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>SC Muiden</Text>
        <Text variant="body" style={styles.headerSub}>Welkom terug</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Inloggen</Text>

          {errors.root ? (
            <View style={styles.errorBanner}>
              <Text variant="caption" style={styles.errorText}>{errors.root.message}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
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
                    placeholder="••••••••"
                    secureTextEntry
                    textContentType="password"
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
            Inloggen
          </Button>

          <Link href="/(auth)/wachtwoord-vergeten" style={styles.link}>
            <Text variant="caption" style={styles.linkText}>Wachtwoord vergeten?</Text>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text variant="caption" style={styles.footerText}>Nog geen account? </Text>
          <Link href="/(auth)/register">
            <Text variant="caption" style={styles.footerLink}>Registreren</Text>
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
    marginBottom: spacing[4],
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: colors.blue,
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
