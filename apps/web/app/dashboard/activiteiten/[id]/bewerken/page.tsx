'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateActivitySchema, type UpdateActivityInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

interface ActivityRow {
  id: string;
  type: string;
  title: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  sport: string | null;
  team_id: string | null;
  recurring_rule_id: string | null;
}

export default function BewerkenPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm<UpdateActivityInput>({
    resolver: zodResolver(updateActivitySchema),
  });

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('activities')
        .select('id, type, title, starts_at, ends_at, location, notes, sport, team_id, recurring_rule_id')
        .eq('id', params.id)
        .is('deleted_at', null)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      if (data.type === 'wedstrijd') { setNotFound(true); setLoading(false); return; }

      setActivity(data);
      reset({
        title: data.title,
        starts_at: data.starts_at?.substring(0, 16),
        ends_at: data.ends_at?.substring(0, 16),
        location: data.location,
        notes: data.notes,
        sport: data.sport,
        team_id: data.team_id,
        update_scope: 'single',
      });
      setLoading(false);
    }
    load();
  }, [params.id, reset]);

  async function onSubmit(data: UpdateActivityInput) {
    if (!activity) return;
    const supabase = createSupabaseBrowserClient();

    if (activity.recurring_rule_id && data.update_scope === 'future') {
      // Update all future occurrences of this recurring rule
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('activities')
        .update({
          title: data.title,
          location: data.location ?? null,
          notes: data.notes ?? null,
        })
        .eq('recurring_rule_id', activity.recurring_rule_id)
        .gte('starts_at', now)
        .is('deleted_at', null);

      if (error) {
        setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('activities')
        .update({
          title: data.title,
          starts_at: data.starts_at,
          ends_at: data.ends_at ?? null,
          location: data.location ?? null,
          notes: data.notes ?? null,
          sport: data.sport ?? null,
        })
        .eq('id', params.id);

      if (error) {
        setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
        return;
      }
    }

    router.push('/dashboard/activiteiten');
  }

  if (loading) return <p style={{ color: 'var(--color-text-2)' }}>Laden...</p>;
  if (notFound) return (
    <div>
      <p style={{ color: 'var(--color-error)' }}>Activiteit niet gevonden of niet bewerkbaar.</p>
      <a href="/dashboard/activiteiten" style={{ color: 'var(--color-blue)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        Terug naar activiteiten
      </a>
    </div>
  );

  const TYPE_LABELS: Record<string, string> = {
    training: 'training',
    clubactiviteit: 'clubactiviteit',
    bardienst: 'bardienst',
  };

  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/activiteiten" style={s.breadcrumbLink}>Activiteiten</a>
        {' > '}Bewerken
      </p>
      <h1 style={s.heading}>
        {activity ? (TYPE_LABELS[activity.type] ?? activity.type) : ''} bewerken
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
        {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

        {activity?.recurring_rule_id && (
          <div style={s.scopeBox}>
            <label style={s.scopeLabel}>Welke sessies wil je bewerken?</label>
            <div style={s.radioGroup}>
              <label style={s.radioLabel}>
                <input type="radio" value="single" {...register('update_scope')} /> Alleen deze sessie
              </label>
              <label style={s.radioLabel}>
                <input type="radio" value="future" {...register('update_scope')} /> Alle toekomstige sessies
              </label>
            </div>
          </div>
        )}

        {activity?.type !== 'training' && (
          <Field label="Titel *" error={errors.title?.message}>
            <input {...register('title')} style={{ ...s.input, ...(errors.title ? s.inputError : {}) }} />
          </Field>
        )}

        <Field label="Datum en begintijd *" error={errors.starts_at?.message}>
          <input type="datetime-local" {...register('starts_at')} style={s.input} />
        </Field>

        <Field label="Eindtijd" error={errors.ends_at?.message}>
          <input type="datetime-local" {...register('ends_at')} style={s.input} />
        </Field>

        <Field label="Locatie" error={errors.location?.message}>
          <input {...register('location')} style={s.input} />
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
    </div>
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
  breadcrumb: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', marginBottom: 'var(--space-2)' },
  breadcrumbLink: { color: 'var(--color-blue)', textDecoration: 'none' },
  heading: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-6)', textTransform: 'capitalize' },
  form: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 },
  errorBanner: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'rgba(214,60,60,0.06)', borderRadius: 'var(--radius-md)' },
  scopeBox: { padding: 'var(--space-4)', background: 'var(--color-light)', borderRadius: 'var(--radius-md)' },
  scopeLabel: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 'var(--space-2)' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  radioLabel: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center', fontSize: 'var(--text-sm)', cursor: 'pointer' },
  input: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputError: { borderColor: 'var(--color-error)' },
  actions: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' },
};
