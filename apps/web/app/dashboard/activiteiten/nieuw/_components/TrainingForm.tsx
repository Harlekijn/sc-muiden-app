'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTrainingSchema, type CreateTrainingInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

interface Team { id: string; name: string; sport: string }
interface Props { teams: Team[] }

export function TrainingForm({ teams }: Props) {
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm<CreateTrainingInput>({
    resolver: zodResolver(createTrainingSchema),
    defaultValues: { is_recurring: false },
  });

  const isRecurring = watch('is_recurring');

  async function onSubmit(data: CreateTrainingInput) {
    const supabase = createSupabaseBrowserClient();

    if (data.is_recurring && data.valid_from && data.valid_until) {
      // Create recurring rule and generate activities via API
      const { data: rule, error: ruleErr } = await supabase
        .from('recurring_rules')
        .insert({
          team_id: data.team_id,
          day_of_week: new Date(data.starts_at).getDay() || 7, // 1=mon, 7=sun
          start_time: data.starts_at.substring(11, 16) + ':00',
          end_time: data.ends_at ? data.ends_at.substring(11, 16) + ':00' : null,
          location: data.location ?? null,
          notes: data.notes ?? null,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
        })
        .select('id')
        .single();

      if (ruleErr || !rule) {
        setError('root', { message: 'Training aanmaken mislukt. Probeer het opnieuw.' });
        return;
      }

      const res = await fetch('/api/cms/activities/generate-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurring_rule_id: rule.id,
          team_id: data.team_id,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          location: data.location,
          notes: data.notes,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
        }),
      });

      if (!res.ok) {
        setError('root', { message: 'Training aanmaken mislukt. Probeer het opnieuw.' });
        return;
      }

      const { count } = await res.json();
      router.push(`/dashboard/activiteiten?toast=${count}`);
    } else {
      // Single activity
      const team = teams.find((t) => t.id === data.team_id);
      const { error } = await supabase.from('activities').insert({
        type: 'training',
        team_id: data.team_id,
        sport: team?.sport ?? null,
        title: `Training ${team?.name ?? ''}`.trim(),
        starts_at: data.starts_at,
        ends_at: data.ends_at ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
      });

      if (error) {
        setError('root', { message: 'Training aanmaken mislukt. Probeer het opnieuw.' });
        return;
      }

      router.push('/dashboard/activiteiten');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
      {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

      <Field label="Team *" error={errors.team_id?.message}>
        <select {...register('team_id')} style={{ ...s.input, ...(errors.team_id ? s.inputError : {}) }}>
          <option value="">Selecteer een team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Datum en begintijd *" error={errors.starts_at?.message}>
        <input type="datetime-local" {...register('starts_at')} style={{ ...s.input, ...(errors.starts_at ? s.inputError : {}) }} />
      </Field>

      <Field label="Eindtijd" error={errors.ends_at?.message}>
        <input type="datetime-local" {...register('ends_at')} style={s.input} />
      </Field>

      <Field label="Locatie" error={errors.location?.message}>
        <input {...register('location')} placeholder="bijv. Veld 1" style={s.input} />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <textarea {...register('notes')} rows={3} style={{ ...s.input, resize: 'vertical' }} />
      </Field>

      <div style={s.toggleWrap}>
        <label style={s.toggleLabel}>
          <input type="checkbox" {...register('is_recurring')} style={{ marginRight: 'var(--space-2)' }} />
          Wekelijks herhalen
        </label>
        <span style={s.helpText}>Er worden wekelijks activiteiten aangemaakt op dezelfde dag.</span>
      </div>

      {isRecurring && (
        <div style={s.recurringFields}>
          <Field label="Geldig van *" error={errors.valid_from?.message}>
            <input type="date" {...register('valid_from')} style={{ ...s.input, ...(errors.valid_from ? s.inputError : {}) }} />
          </Field>
          <Field label="Geldig tot *" error={errors.valid_until?.message}>
            <input type="date" {...register('valid_until')} style={{ ...s.input, ...(errors.valid_until ? s.inputError : {}) }} />
          </Field>
        </div>
      )}

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
  toggleWrap: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  toggleLabel: { display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' },
  helpText: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)' },
  recurringFields: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-light)', borderRadius: 'var(--radius-md)', maxWidth: 480 },
  actions: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' },
};
