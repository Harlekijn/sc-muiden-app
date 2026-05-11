'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../lib/supabase-client';

export function NieuwWachtwoordForm() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordInput) {
    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      const isNetworkError = updateError.message?.toLowerCase().includes('fetch');
      setError('root', {
        message: isNetworkError
          ? 'Geen verbinding — controleer je internetverbinding en probeer opnieuw.'
          : 'Er is een fout opgetreden. Probeer het opnieuw.',
      });
      return;
    }

    if (user) {
      await supabase
        .from('profiles')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main style={s.main}>
        <div style={s.card}>
          <h1 style={s.title}>SC Muiden</h1>
          <h2 style={s.sectionTitle}>Wachtwoord gewijzigd</h2>
          <p style={s.body}>
            Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={s.main}>
      <div style={s.card}>
        <h1 style={s.title}>SC Muiden</h1>
        <h2 style={s.sectionTitle}>Nieuw wachtwoord instellen</h2>

        <form onSubmit={handleSubmit(onSubmit)} style={s.form} noValidate>
          {errors.root && (
            <div style={s.errorBanner}>
              <span style={s.errorBannerText}>{errors.root.message}</span>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label} htmlFor="password">Nieuw wachtwoord</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              {...register('password')}
            />
            {errors.password
              ? <span style={s.error}>{errors.password.message}</span>
              : <span style={s.hint}>Minimaal 8 tekens, 1 hoofdletter, 1 cijfer</span>
            }
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="passwordBevestiging">Wachtwoord bevestigen</label>
            <input
              id="passwordBevestiging"
              type="password"
              autoComplete="new-password"
              style={{ ...s.input, ...(errors.passwordBevestiging ? s.inputError : {}) }}
              {...register('passwordBevestiging')}
            />
            {errors.passwordBevestiging && (
              <span style={s.error}>{errors.passwordBevestiging.message}</span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} style={s.button}>
            {isSubmitting ? 'Bezig...' : 'Wachtwoord opslaan'}
          </button>
        </form>
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
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-6)',
  },
  body: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-base)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  errorBanner: {
    background: 'var(--color-error-bg)',
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
  hint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
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
};
