'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../lib/supabase-client';

export default function WachtwoordVergetenPage() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/wachtwoord-reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      data.email.toLowerCase().trim(),
      { redirectTo }
    );

    if (error) {
      const isNetworkError = error.message?.toLowerCase().includes('fetch');
      setError('root', {
        message: isNetworkError
          ? 'Geen verbinding — controleer je internetverbinding en probeer opnieuw.'
          : 'Er is een fout opgetreden. Probeer het opnieuw.',
      });
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main style={s.main}>
        <div style={s.card}>
          <h1 style={s.title}>SC Muiden</h1>
          <h2 style={s.sectionTitle}>Controleer je e-mail</h2>
          <p style={s.body}>
            Als je e-mailadres bekend is, ontvang je een herstelkoppeling.
          </p>
          <a href="/login" style={s.backLink}>Terug naar inloggen</a>
        </div>
      </main>
    );
  }

  return (
    <main style={s.main}>
      <div style={s.card}>
        <h1 style={s.title}>SC Muiden</h1>
        <p style={s.subtitle}>Beheeromgeving</p>
        <h2 style={s.sectionTitle}>Wachtwoord vergeten</h2>
        <p style={s.description}>
          Voer je e-mailadres in. We sturen je een koppeling om je wachtwoord te herstellen.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={s.form} noValidate>
          {errors.root && (
            <div style={s.errorBanner}>
              <span style={s.errorBannerText}>{errors.root.message}</span>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label} htmlFor="email">E-mailadres</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
              {...register('email')}
            />
            {errors.email && <span style={s.error}>{errors.email.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} style={s.button}>
            {isSubmitting ? 'Bezig...' : 'Herstelkoppeling sturen'}
          </button>
        </form>

        <a href="/login" style={s.backLink}>Terug naar inloggen</a>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-navy)',
    padding: 'var(--space-4)',
  },
  card: {
    background: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow-modal)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-1)',
    letterSpacing: '0.02em',
  },
  subtitle: {
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-4)',
    fontSize: 'var(--text-base)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  description: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-6)',
  },
  body: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-base)',
    marginBottom: 'var(--space-6)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-4)',
  },
  errorBanner: {
    background: '#fde8e8',
    borderRadius: 6,
    padding: 'var(--space-3)',
  },
  errorBannerText: {
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  input: {
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid rgba(1, 29, 80, 0.12)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  inputError: {
    borderColor: 'var(--color-error)',
  },
  error: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-error)',
  },
  button: {
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    minHeight: 44,
  },
  backLink: {
    display: 'block',
    marginTop: 'var(--space-4)',
    textAlign: 'center' as const,
    color: 'var(--color-blue)',
    fontSize: 'var(--text-sm)',
    textDecoration: 'none',
  },
};
