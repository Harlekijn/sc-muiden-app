'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const {
    register,
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
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main style={s.main}>
      <div style={s.card}>
        <h1 style={s.title}>SC Muiden</h1>
        <p style={s.subtitle}>Beheeromgeving</p>

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

          <div style={s.field}>
            <label style={s.label} htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              style={{ ...s.input, ...(errors.password ? s.inputError : {}) }}
              {...register('password')}
            />
            {errors.password && <span style={s.error}>{errors.password.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} style={s.button}>
            {isSubmitting ? 'Bezig...' : 'Inloggen'}
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
  subtitle: {
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-6)',
    fontSize: 'var(--text-base)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
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
    transition: 'border-color var(--transition-fast)',
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
    marginTop: 'var(--space-2)',
    opacity: 1,
    transition: 'opacity var(--transition-fast)',
  },
};
