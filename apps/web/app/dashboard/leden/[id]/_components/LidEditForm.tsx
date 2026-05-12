'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateMemberSchema, type UpdateMemberInput, type Member, type Sport } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

interface Props {
  member: Member;
}

export function LidEditForm({ member }: Props) {
  const [editing, setEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<UpdateMemberInput>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      first_name: member.first_name,
      last_name: member.last_name,
      birth_date: member.birth_date ?? undefined,
      email: member.email ?? undefined,
      phone: member.phone ?? undefined,
      sport: member.sport as Sport[],
    },
  });

  const selectedSport = watch('sport') ?? [];

  function toggleSport(sport: Sport) {
    if (selectedSport.includes(sport)) {
      setValue('sport', selectedSport.filter((s) => s !== sport));
    } else {
      setValue('sport', [...selectedSport, sport]);
    }
  }

  async function onSubmit(data: UpdateMemberInput) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('members')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        sport: data.sport,
      })
      .eq('id', member.id);

    if (error) {
      setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
      return;
    }

    setSuccessMsg('Wijzigingen opgeslagen');
    setEditing(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleCancel() {
    reset();
    setEditing(false);
  }

  return (
    <div>
      {successMsg && <p style={s.successBanner}>{successMsg}</p>}

      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Persoonsgegevens</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} style={s.editBtn}>
            Bewerken
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

          <div style={s.formGrid}>
            <Field label="Voornaam" error={errors.first_name?.message}>
              <input {...register('first_name')} style={{ ...s.input, ...(errors.first_name ? s.inputError : {}) }} />
            </Field>
            <Field label="Achternaam" error={errors.last_name?.message}>
              <input {...register('last_name')} style={{ ...s.input, ...(errors.last_name ? s.inputError : {}) }} />
            </Field>
            <Field label="Geboortedatum" error={errors.birth_date?.message}>
              <input type="date" {...register('birth_date')} style={s.input} />
            </Field>
            <Field label="E-mailadres" error={errors.email?.message}>
              <input type="email" {...register('email')} style={{ ...s.input, ...(errors.email ? s.inputError : {}) }} />
            </Field>
            <Field label="Telefoon" error={errors.phone?.message}>
              <input {...register('phone')} style={s.input} />
            </Field>
          </div>

          <div style={s.sportField}>
            <label style={s.label}>Sport</label>
            <div style={s.sportBtns}>
              {(['voetbal', 'hockey'] as Sport[]).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => toggleSport(sp)}
                  style={{
                    ...s.sportBtn,
                    ...(selectedSport.includes(sp) ? s.sportBtnActive : {}),
                  }}
                >
                  {sp.charAt(0).toUpperCase() + sp.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={s.formActions}>
            <button type="submit" disabled={isSubmitting} style={s.saveBtn}>
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button type="button" onClick={handleCancel} style={s.cancelBtn}>
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <dl style={s.dl}>
          <DataRow label="Voornaam" value={member.first_name} />
          <DataRow label="Achternaam" value={member.last_name} />
          <DataRow label="Geboortedatum" value={member.birth_date ?? '—'} />
          <DataRow label="E-mailadres" value={member.email ?? '—'} />
          <DataRow label="Telefoon" value={member.phone ?? '—'} />
          <DataRow label="Sport" value={member.sport.join(', ') || '—'} />
          <DataRow label="Rol" value={member.role} />
          {member.clubbase_id && (
            <DataRow label="ClubBase-ID" value={member.clubbase_id} muted />
          )}
        </dl>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
    </div>
  );
}

function DataRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-8)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-mid)' }}>
      <dt style={{ width: 160, flexShrink: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-2)' }}>
        {label}
      </dt>
      <dd style={{ fontSize: 'var(--text-sm)', color: muted ? 'var(--color-text-2)' : 'var(--color-text)', fontStyle: muted ? 'italic' : 'normal' }}>
        {value}
      </dd>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-4)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    margin: 0,
  },
  editBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-navy)',
    background: 'none',
    color: 'var(--color-navy)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-4)',
    maxWidth: 640,
  },
  input: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'var(--color-error)',
  },
  label: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 'var(--space-2)',
  },
  sportField: {
    marginBottom: 'var(--space-4)',
    maxWidth: 640,
  },
  sportBtns: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  sportBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    background: 'var(--color-white)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  sportBtnActive: {
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-navy)',
  },
  formActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-2)',
  },
  saveBtn: {
    padding: 'var(--space-2) var(--space-6)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  },
  cancelBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    background: 'none',
    color: 'var(--color-text)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44,
  },
  errorBanner: {
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-3)',
    padding: 'var(--space-3)',
    background: 'rgba(214,60,60,0.06)',
    borderRadius: 'var(--radius-md)',
  },
  successBanner: {
    color: 'var(--color-success)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-4)',
    padding: 'var(--space-3)',
    background: 'rgba(26,140,92,0.08)',
    borderRadius: 'var(--radius-md)',
  },
  dl: {
    maxWidth: 640,
  },
};
