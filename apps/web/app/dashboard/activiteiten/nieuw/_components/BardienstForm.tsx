'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBardienstSchema, type CreateBardienstInput, type Member, type Sport } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

const SPORT_OPTIONS: { value: Sport | ''; label: string }[] = [
  { value: '', label: 'Geen filter (alle sporten)' },
  { value: 'voetbal', label: 'Voetbal' },
  { value: 'hockey', label: 'Hockey' },
];

export function BardienstForm() {
  const router = useRouter();
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CreateBardienstInput>({
    resolver: zodResolver(createBardienstSchema),
    defaultValues: { assigned_member_ids: [] },
  });

  async function handleMemberSearch(q: string) {
    setMemberSearch(q);
    if (!q.trim()) { setMemberResults([]); return; }
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name, sport, lid_type, is_vrijwilliger, is_barcommissie, email, phone, birth_date, clubbase_id, created_at, updated_at, deleted_at')
      .is('deleted_at', null)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(5);
    setMemberResults((data ?? []) as Member[]);
  }

  function addMember(m: Member) {
    if (assignedMembers.find((a) => a.id === m.id)) return;
    setAssignedMembers((prev) => [...prev, m]);
    setMemberSearch('');
    setMemberResults([]);
  }

  function removeMember(id: string) {
    setAssignedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function onSubmit(data: CreateBardienstInput) {
    const supabase = createSupabaseBrowserClient();

    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .insert({
        type: 'bardienst',
        sport: data.sport ?? null,
        team_id: null,
        title: 'Bardienst',
        starts_at: data.starts_at,
        ends_at: data.ends_at ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
      })
      .select('id')
      .single();

    if (actErr || !activity) {
      setError('root', { message: 'Bardienst aanmaken mislukt. Probeer het opnieuw.' });
      return;
    }

    if (assignedMembers.length > 0) {
      const { error: baErr } = await supabase.from('bar_assignments').insert(
        assignedMembers.map((m) => ({
          activity_id: activity.id,
          member_id: m.id,
        }))
      );
      if (baErr) {
        setError('root', { message: 'Toewijzingen opslaan mislukt. Bardienst is aangemaakt maar zonder leden.' });
        return;
      }
    }

    router.push('/dashboard/activiteiten');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={s.form}>
      {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

      <Field label="Datum en begintijd *" error={errors.starts_at?.message}>
        <input type="datetime-local" {...register('starts_at')} style={{ ...s.input, ...(errors.starts_at ? s.inputError : {}) }} />
      </Field>

      <Field label="Eindtijd" error={errors.ends_at?.message}>
        <input type="datetime-local" {...register('ends_at')} style={s.input} />
      </Field>

      <Field label="Locatie" error={errors.location?.message}>
        <input {...register('location')} placeholder="bijv. Kantine" style={s.input} />
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

      <div style={{ maxWidth: 480 }}>
        <label style={s.label}>Leden toewijzen</label>
        {assignedMembers.length === 0 && (
          <p style={s.warnText}>Je hebt nog geen leden toegewezen aan deze bardienst.</p>
        )}
        {assignedMembers.length > 0 && (
          <div style={s.assignedList}>
            {assignedMembers.map((m) => (
              <span key={m.id} style={s.tag}>
                {m.first_name} {m.last_name}
                <button type="button" onClick={() => removeMember(m.id)} style={s.tagRemove}>✕</button>
              </span>
            ))}
          </div>
        )}
        <div style={s.searchWrap}>
          <input
            type="search"
            placeholder="Zoek en voeg lid toe"
            value={memberSearch}
            onChange={(e) => handleMemberSearch(e.target.value)}
            style={s.input}
          />
          {memberResults.length > 0 && (
            <div style={s.dropdown}>
              {memberResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => addMember(m)}
                  style={s.dropdownItem}
                >
                  {m.first_name} {m.last_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
  label: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)', display: 'block' },
  warnText: { color: 'var(--color-warning)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' },
  assignedList: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: '2px var(--space-2)', borderRadius: 'var(--radius-pill)', background: 'rgba(4,107,186,0.1)', color: 'var(--color-blue)', fontSize: 'var(--text-xs)', fontWeight: 600 },
  tagRemove: { border: 'none', background: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 0, fontSize: 10 },
  searchWrap: { position: 'relative' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-white)', border: '1px solid var(--color-mid)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-elevated)' },
  dropdownItem: { display: 'block', width: '100%', padding: 'var(--space-2) var(--space-3)', border: 'none', background: 'none', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left' },
  actions: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center', paddingTop: 'var(--space-2)' },
  saveBtn: { padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer', minHeight: 44 },
  cancelBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-mid)', color: 'var(--color-text)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none' },
};
