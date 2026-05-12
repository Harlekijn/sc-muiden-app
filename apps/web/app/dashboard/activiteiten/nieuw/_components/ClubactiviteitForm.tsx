'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClubactiviteitSchema, type CreateClubactiviteitInput, type Sport } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

const SPORT_OPTIONS: { value: Sport | ''; label: string }[] = [
  { value: '', label: 'Geen filter (alle sporten)' },
  { value: 'voetbal', label: 'Voetbal' },
  { value: 'hockey', label: 'Hockey' },
];

export function ClubactiviteitForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CreateClubactiviteitInput>({
    resolver: zodResolver(createClubactiviteitSchema),
  });

  async function onSubmit(data: CreateClubactiviteitInput) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from('activities').insert({
      type: 'clubactiviteit',
      sport: data.sport ?? null,
      team_id: null,
      title: data.title,
      starts_at: data.starts_at,
      ends_at: data.ends_at ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
    });

    if (error) {
      setError('root', { message: 'Activiteit aanmaken mislukt. Probeer het opnieuw.' });
      return;
    }

    router.push('/dashboard/activiteiten');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
      {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

      <Field label="Titel *" error={errors.title?.message}>
        <input {...register('title')} placeholder="bijv. Seizoensfeest" style={{ ...s.input, ...(errors.title ? s.inputError : {}) }} />
      </Field>

      <Field label="Datum en begintijd *" error={errors.starts_at?.message}>
        <input type="datetime-local" {...register('starts_at')} style={{ ...s.input, ...(errors.starts_at ? s.inputError : {}) }} />
      </Field>

      <Field label="Eindtijd" error={errors.ends_at?.message}>
        <input type="datetime-local" {...register('ends_at')} style={s.input} />
      </Field>

      <Field label="Locatie" error={errors.location?.message}>
        <input {...register('location')} style={s.input} />
      </Field>

      <Field label="Sport" error={errors.sport?.message}>
        <select {...register('sport')} style={s.input}>
          {SPORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <textarea {...register('notes')} rows={3} style={{ ...s.input, resize: 'vertical' }} />
      </Field>

      <div style={s.actions}>
        <button type="submit" disabled={isSubmitting} style={s.saveBtn}>
          {isSubmitting ? 'Opslaan...' : 'Opslaan'}
        </button>
        <a href="/dashboard/activiteiten" style={s.cancelBtn}>Annuleren</a>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxWidth: 480 }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 },
  errorBanner: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'rgba(214,60,60,0.06)', borderRadius: 'var(--radius-md)' },
  input: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputError: { borderColor: 'var(--color-error)' },
  actions: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' },
};
