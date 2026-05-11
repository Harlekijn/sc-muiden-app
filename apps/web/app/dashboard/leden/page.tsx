'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../lib/supabase-client';

export default function LedenPage() {
  const [isBeheerder, setIsBeheerder] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    async function checkRole() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsBeheerder(profile?.role === 'beheerder');
    }
    checkRole();
  }, []);

  async function onSubmit(data: ForgotPasswordInput) {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/wachtwoord-reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      data.email.toLowerCase().trim(),
      { redirectTo }
    );

    if (error) {
      setError('root', { message: 'Er is een fout opgetreden. Controleer het e-mailadres en probeer opnieuw.' });
      return;
    }

    setResetSuccess(data.email.toLowerCase().trim());
    reset();
  }

  return (
    <div>
      <h1 style={s.pageTitle}>Leden</h1>
      <p style={s.placeholder}>Ledenbeheer volgt in fase 5.</p>

      {isBeheerder && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Wachtwoord-resetmail sturen</h2>
          <p style={s.description}>
            Stuur een gebruiker een koppeling om zijn wachtwoord in te stellen.
            Alleen zichtbaar voor beheerders.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={s.form} noValidate>
            {errors.root && (
              <p style={s.errorText}>{errors.root.message}</p>
            )}
            {resetSuccess && (
              <p style={s.successText}>
                Resetmail verstuurd naar {resetSuccess}.
              </p>
            )}

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label} htmlFor="reset-email">E-mailadres van de gebruiker</label>
                <input
                  id="reset-email"
                  type="email"
                  style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
                  {...register('email')}
                />
                {errors.email && <span style={s.fieldError}>{errors.email.message}</span>}
              </div>

              <button type="submit" disabled={isSubmitting} style={s.button}>
                {isSubmitting ? 'Bezig...' : 'Stuur resetmail'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  placeholder: {
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-10)',
  },
  section: {
    borderTop: '1px solid rgba(1, 29, 80, 0.10)',
    paddingTop: 'var(--space-8)',
    maxWidth: 600,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-2)',
  },
  description: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-5)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  row: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
    flex: 1,
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
  fieldError: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-error)',
  },
  button: {
    padding: 'var(--space-3) var(--space-5)',
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    minHeight: 44,
    whiteSpace: 'nowrap' as const,
  },
  successText: {
    color: 'var(--color-text-2)',
    fontSize: 'var(--text-sm)',
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
  },
};
