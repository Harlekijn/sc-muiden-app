'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTeamSchema, type UpdateTeamInput, type Team, type TeamMemberWithMember } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';
import { TeamLedenTab } from './TeamLedenTab';

interface Props {
  team: Team;
  teamMembers: TeamMemberWithMember[];
  activeTab: 'gegevens' | 'leden';
}

export function TeamDetailClient({ team, teamMembers, activeTab: initialTab }: Props) {
  const [tab, setTab] = useState<'gegevens' | 'leden'>(initialTab);
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState(team);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm<UpdateTeamInput>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: team.name,
      sport: team.sport as 'voetbal' | 'hockey',
      age_category: team.age_category ?? undefined,
      season: team.season ?? undefined,
      federation_team_id: team.federation_team_id ?? undefined,
    },
  });

  async function onSubmit(data: UpdateTeamInput) {
    const supabase = createSupabaseBrowserClient();
    const { data: updated, error } = await supabase
      .from('teams')
      .update({
        name: data.name,
        sport: data.sport,
        age_category: data.age_category ?? null,
        season: data.season ?? null,
        federation_team_id: data.federation_team_id ?? null,
      })
      .eq('id', currentTeam.id)
      .select('id, name, sport, age_category, season, federation_team_id, created_at, updated_at, deleted_at')
      .single();

    if (error) {
      setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
      return;
    }

    setCurrentTeam(updated as Team);
    setSuccessMsg('Team bijgewerkt');
    setEditing(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/teams" style={s.breadcrumbLink}>Teams</a>
        {' > '}{currentTeam.name}
      </p>

      <h1 style={s.heading}>{currentTeam.name}</h1>

      {successMsg && <p style={s.successBanner}>{successMsg}</p>}

      <div style={s.tabs}>
        {(['gegevens', 'leden'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'gegevens' && (
        <div style={s.tabContent}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Teamgegevens</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} style={s.editBtn}>Bewerken</button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
              {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

              <Field label="Teamnaam *" error={errors.name?.message}>
                <input {...register('name')} style={{ ...s.input, ...(errors.name ? s.inputError : {}) }} />
              </Field>

              <div style={s.fieldGroup}>
                <label style={s.label}>Sport *</label>
                <div style={s.radioGroup}>
                  <label style={s.radioLabel}><input type="radio" value="voetbal" {...register('sport')} /> Voetbal</label>
                  <label style={s.radioLabel}><input type="radio" value="hockey" {...register('sport')} /> Hockey</label>
                </div>
              </div>

              <Field label="Leeftijdscategorie" error={errors.age_category?.message}>
                <input {...register('age_category')} style={s.input} />
              </Field>

              <Field label="Seizoen" error={errors.season?.message}>
                <input {...register('season')} style={s.input} />
              </Field>

              <Field label="Federation Team ID" error={errors.federation_team_id?.message}>
                <input {...register('federation_team_id')} style={s.input} />
                <span style={s.helpText}>KNVB of KNHB team-ID voor automatische synchronisatie.</span>
              </Field>

              <div style={s.actions}>
                <button type="submit" disabled={isSubmitting} style={s.saveBtn}>
                  {isSubmitting ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button type="button" onClick={() => { reset(); setEditing(false); }} style={s.cancelBtn}>
                  Annuleren
                </button>
              </div>
            </form>
          ) : (
            <dl style={s.dl}>
              <DataRow label="Naam" value={currentTeam.name} />
              <DataRow label="Sport" value={currentTeam.sport} />
              <DataRow label="Leeftijdscategorie" value={currentTeam.age_category ?? '—'} />
              <DataRow label="Seizoen" value={currentTeam.season ?? '—'} />
              <DataRow label="Federation Team ID" value={currentTeam.federation_team_id ?? '—'} muted />
            </dl>
          )}
        </div>
      )}

      {tab === 'leden' && (
        <div style={s.tabContent}>
          <TeamLedenTab teamId={currentTeam.id} initialMembers={teamMembers} />
        </div>
      )}
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

function DataRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-8)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-mid)' }}>
      <dt style={{ width: 180, flexShrink: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-2)' }}>{label}</dt>
      <dd style={{ fontSize: 'var(--text-sm)', color: muted ? 'var(--color-text-2)' : 'var(--color-text)', fontStyle: muted ? 'italic' : 'normal' }}>{value}</dd>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  breadcrumb: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', marginBottom: 'var(--space-2)' },
  breadcrumbLink: { color: 'var(--color-blue)', textDecoration: 'none' },
  heading: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-4)' },
  successBanner: { color: 'var(--color-success)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(26,140,92,0.08)', borderRadius: 'var(--radius-md)' },
  tabs: { display: 'flex', gap: 0, borderBottom: '2px solid var(--color-mid)', marginBottom: 'var(--space-6)' },
  tab: { padding: 'var(--space-3) var(--space-5)', border: 'none', background: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-2)', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive: { color: 'var(--color-navy)', fontWeight: 700, borderBottomColor: 'var(--color-navy)' },
  tabContent: { maxWidth: 640 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-navy)', margin: 0 },
  editBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-navy)', background: 'none', color: 'var(--color-navy)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  errorBanner: { color: 'var(--color-error)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)', background: 'rgba(214,60,60,0.06)', borderRadius: 'var(--radius-md)' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxWidth: 480 },
  label: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' },
  radioGroup: { display: 'flex', gap: 'var(--space-5)' },
  radioLabel: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center', fontSize: 'var(--text-sm)', cursor: 'pointer' },
  input: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  inputError: { borderColor: 'var(--color-error)' },
  helpText: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)' },
  actions: { display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', background: 'none', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer', minHeight: 44 },
  dl: { maxWidth: 640 },
};
