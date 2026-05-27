'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateMemberSchema, type UpdateMemberInput, type Member, type Sport, type LidType } from '@sc-muiden/shared';
import { createSupabaseBrowserClient } from '../../../../../lib/supabase-client';

const LID_TYPE_LABELS: Record<LidType, string> = {
  'niet-spelend-lid': 'Niet-spelend lid',

  'spelend-lid': 'Spelend lid',
  'relatie': 'Relatie',
};

interface Props {
  member: Member;
}

export function LidEditForm({ member }: Props) {
  const [editing, setEditing] = useState(false);
  const [editingLidmaatschap, setEditingLidmaatschap] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successLidmaatschap, setSuccessLidmaatschap] = useState<string | null>(null);

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
      lid_type: member.lid_type,
      is_vrijwilliger: member.is_vrijwilliger,
      is_barcommissie: member.is_barcommissie,
      ouder_email_1: member.ouder_email_1 ?? undefined,
      ouder_email_2: member.ouder_email_2 ?? undefined,
    },
  });

  const selectedSport = watch('sport') ?? [];
  const selectedVrijwilliger = watch('is_vrijwilliger');
  const selectedBarcommissie = watch('is_barcommissie');

  function toggleSport(sport: Sport) {
    if (selectedSport.includes(sport)) {
      setValue('sport', selectedSport.filter((s) => s !== sport));
    } else {
      setValue('sport', [...selectedSport, sport]);
    }
  }

  async function onSubmitPersoonsgegevens(data: UpdateMemberInput) {
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
        ouder_email_1: data.ouder_email_1 ?? null,
        ouder_email_2: data.ouder_email_2 ?? null,
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

  async function onSubmitLidmaatschap(data: UpdateMemberInput) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from('members')
      .update({
        lid_type: data.lid_type ?? null,
        is_vrijwilliger: data.is_vrijwilliger ?? false,
        is_barcommissie: data.is_barcommissie ?? false,
      })
      .eq('id', member.id);

    if (error) {
      setError('root', { message: 'Opslaan mislukt. Probeer het opnieuw.' });
      return;
    }

    setSuccessLidmaatschap('Wijzigingen opgeslagen');
    setEditingLidmaatschap(false);
    setTimeout(() => setSuccessLidmaatschap(null), 3000);
  }

  function handleCancel() {
    reset();
    setEditing(false);
  }

  function handleCancelLidmaatschap() {
    reset();
    setEditingLidmaatschap(false);
  }

  return (
    <div>
      {/* Persoonsgegevens sectie */}
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
        <form onSubmit={handleSubmit(onSubmitPersoonsgegevens)} noValidate>
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
            <Field label="Ouder e-mail 1" error={errors.ouder_email_1?.message}>
              <input type="email" {...register('ouder_email_1')} style={{ ...s.input, ...(errors.ouder_email_1 ? s.inputError : {}) }} />
            </Field>
            <Field label="Ouder e-mail 2" error={errors.ouder_email_2?.message}>
              <input type="email" {...register('ouder_email_2')} style={{ ...s.input, ...(errors.ouder_email_2 ? s.inputError : {}) }} />
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
          <DataRow label="Ouder e-mail 1" value={member.ouder_email_1 ?? '—'} />
          <DataRow label="Ouder e-mail 2" value={member.ouder_email_2 ?? '—'} />
          {member.clubbase_id && (
            <DataRow label="ClubBase-ID" value={member.clubbase_id} muted />
          )}
        </dl>
      )}

      {/* Lidmaatschap sectie */}
      <div style={s.sectionDivider} />

      {successLidmaatschap && <p style={s.successBanner}>{successLidmaatschap}</p>}

      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Lidmaatschap</h2>
        {!editingLidmaatschap && (
          <button onClick={() => setEditingLidmaatschap(true)} style={s.editBtn}>
            Bewerken
          </button>
        )}
      </div>

      {editingLidmaatschap ? (
        <form onSubmit={handleSubmit(onSubmitLidmaatschap)} noValidate>
          {errors.root && <p style={s.errorBanner}>{errors.root.message}</p>}

          <div style={{ ...s.formGrid, maxWidth: 400 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Ledentype" error={errors.lid_type?.message}>
                <select
                  {...register('lid_type')}
                  style={s.input}
                >
                  <option value="">— Niet ingesteld —</option>
                  {(Object.entries(LID_TYPE_LABELS) as [LidType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div style={s.checkboxGroup}>
            <label style={s.checkboxLabel}>
              <input type="checkbox" {...register('is_vrijwilliger')} style={s.checkbox} />
              Vrijwilliger
            </label>
            <label style={s.checkboxLabel}>
              <input type="checkbox" {...register('is_barcommissie')} style={s.checkbox} />
              Lid barcommissie
            </label>
          </div>

          <div style={s.formActions}>
            <button type="submit" disabled={isSubmitting} style={s.saveBtn}>
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button type="button" onClick={handleCancelLidmaatschap} style={s.cancelBtn}>
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <dl style={s.dl}>
          <DataRow
            label="Ledentype"
            value={member.lid_type ? LID_TYPE_LABELS[member.lid_type] : '—'}
          />
          <DataRow
            label="Vrijwilliger"
            value={selectedVrijwilliger !== undefined
              ? (selectedVrijwilliger ? 'Ja' : 'Nee')
              : (member.is_vrijwilliger ? 'Ja' : 'Nee')}
          />
          <DataRow
            label="Lid barcommissie"
            value={selectedBarcommissie !== undefined
              ? (selectedBarcommissie ? 'Ja' : 'Nee')
              : (member.is_barcommissie ? 'Ja' : 'Nee')}
          />
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
  sectionDivider: {
    height: 1,
    background: 'var(--color-mid)',
    margin: 'var(--space-6) 0',
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
    background: 'var(--color-white)',
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
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-4)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
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
