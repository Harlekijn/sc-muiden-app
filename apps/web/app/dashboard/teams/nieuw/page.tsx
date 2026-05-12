'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeamSchema, type CreateTeamInput } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../lib/supabase-client';

export default function NieuwTeamPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { sport: 'voetbal' },
  });

  async function onSubmit(data: CreateTeamInput) {
    const supabase = createSupabaseBrowserClient();
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: data.name,
        sport: data.sport,
        age_category: data.age_category ?? null,
        season: data.season ?? null,
        federation_team_id: data.federation_team_id ?? null,
      })
      .select('id')
      .single();

    if (error) {
      setError('root', { message: 'Team aanmaken mislukt. Probeer het opnieuw.' });
      return;
    }

    router.push(`/dashboard/teams/${team.id}`);
  }

  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/teams" style={s.breadcrumbLink}>Teams</a>
        {' > '}
        Nieuw team
      </p>
      <h1 style={s.heading}>Nieuw team</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
        {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

        <Field label="Teamnaam *" error={errors.name?.message}>
          <input
            {...register('name')}
            placeholder="bijv. SC Muiden JO11-1"
            style={{ ...s.input, ...(errors.name ? s.inputError : {}) }}
          />
        </Field>

        <div style={s.fieldGroup}>
          <label style={s.label}>Sport *</label>
          <div style={s.radioGroup}>
            <label style={s.radioLabel}>
              <input type="radio" value="voetbal" {...register('sport')} /> Voetbal
            </label>
            <label style={s.radioLabel}>
              <input type="radio" value="hockey" {...register('sport')} /> Hockey
            </label>
          </div>
          {errors.sport && <span style={s.fieldError}>{errors.sport.message}</span>}
        </div>

        <Field label="Leeftijdscategorie" error={errors.age_category?.message}>
          <input
            {...register('age_category')}
            placeholder="bijv. JO11, O13, Senioren"
            style={s.input}
          />
        </Field>

        <Field label="Seizoen" error={errors.season?.message}>
          <input
            {...register('season')}
            placeholder="bijv. 2025-2026"
            style={s.input}
          />
        </Field>

        <Field label="Federation Team ID" error={errors.federation_team_id?.message}>
          <input
            {...register('federation_team_id')}
            placeholder="bijv. KNVB-12345 of KNHB-98765"
            style={s.input}
          />
          <span style={s.helpText}>KNVB of KNHB team-ID voor automatische synchronisatie.</span>
        </Field>

        <div style={s.actions}>
          <button type="submit" disabled={isSubmitting} style={s.saveBtn}>
            {isSubmitting ? 'Aanmaken...' : 'Aanmaken'}
          </button>
          <a href="/dashboard/teams" style={s.cancelBtn}>Annuleren</a>
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
  heading: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-6)' },
  form: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 },
  errorBanner: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'rgba(214,60,60,0.06)', borderRadius: 'var(--radius-md)' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  label: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' },
  radioGroup: { display: 'flex', gap: 'var(--space-5)' },
  radioLabel: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center', fontSize: 'var(--text-sm)', cursor: 'pointer' },
  input: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', outline: 'none' },
  inputError: { borderColor: 'var(--color-error)' },
  fieldError: { fontSize: 'var(--text-xs)', color: 'var(--color-error)' },
  helpText: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)' },
  actions: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' },
};
