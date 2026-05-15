'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface FormValues {
  date: string;
  starts_at: string;
  ends_at: string;
  sport: string;
  season: string;
  notes: string;
}

interface Props {
  initialValues?: Partial<FormValues>;
  slotId?: string;
}

export function BarDaySlotForm({ initialValues, slotId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    date: initialValues?.date ?? '',
    starts_at: initialValues?.starts_at ?? '',
    ends_at: initialValues?.ends_at ?? '',
    sport: initialValues?.sport ?? '',
    season: initialValues?.season ?? '',
    notes: initialValues?.notes ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const payload = {
      date: values.date,
      starts_at: values.starts_at,
      ends_at: values.ends_at,
      sport: values.sport || null,
      season: values.season,
      notes: values.notes || null,
    };

    setSaving(true);
    const url = slotId
      ? `/api/cms/bardienst/day-slots/${slotId}`
      : '/api/cms/bardienst/day-slots';
    const method = slotId ? 'PUT' : 'POST';

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      setServerError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
      setSaving(false);
      return;
    }

    if (res.ok) {
      router.push('/dashboard/bardienst?tab=day-slots');
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 422 && data.issues) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const [field, msgs] of Object.entries(data.issues)) {
        fieldErrors[field as keyof FormValues] = Array.isArray(msgs) ? msgs[0] : String(msgs);
      }
      setErrors(fieldErrors);
    } else {
      setServerError(data.error ?? 'Opslaan mislukt. Probeer het opnieuw.');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {serverError && <p style={s.serverError}>{serverError}</p>}

      <Field label="Datum" error={errors.date}>
        <input type="date" value={values.date} onChange={set('date')} style={s.input} required />
      </Field>

      <div style={s.row}>
        <Field label="Begintijd" error={errors.starts_at}>
          <input type="time" value={values.starts_at} onChange={set('starts_at')} style={s.input} required />
        </Field>
        <Field label="Eindtijd" error={errors.ends_at}>
          <input type="time" value={values.ends_at} onChange={set('ends_at')} style={s.input} required />
        </Field>
      </div>

      <Field label="Sport" error={errors.sport}>
        <select value={values.sport} onChange={set('sport')} style={s.input}>
          <option value="">Club-breed (alle sporten)</option>
          <option value="voetbal">Voetbal</option>
          <option value="hockey">Hockey</option>
        </select>
      </Field>

      <Field label="Seizoen" error={errors.season}>
        <input
          type="text"
          value={values.season}
          onChange={set('season')}
          placeholder="2025-2026"
          style={s.input}
          required
        />
      </Field>

      <Field label="Notities" error={errors.notes}>
        <textarea value={values.notes} onChange={set('notes')} rows={3} style={{ ...s.input, resize: 'vertical' }} />
      </Field>

      <div style={s.footer}>
        <a href="/dashboard/bardienst?tab=day-slots" style={s.cancelBtn}>Annuleren</a>
        <button type="submit" disabled={saving} style={s.submitBtn}>
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.fieldError}>{error}</p>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: {
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '28px', maxWidth: '640px',
  },
  serverError: {
    color: '#d63c3c', background: '#fef2f2', border: '1px solid #fca5a5',
    borderRadius: '6px', padding: '10px 14px', fontSize: '14px', marginBottom: '16px',
  },
  row: { display: 'flex', gap: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: 500, color: '#0d1f3c', marginBottom: '6px' },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #dde5f0',
    borderRadius: '6px', fontSize: '14px', color: '#0d1f3c', boxSizing: 'border-box',
  },
  fieldError: { color: '#d63c3c', fontSize: '13px', margin: '4px 0 0' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: {
    padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
    color: '#5a6e8a', textDecoration: 'none', border: '1px solid #dde5f0',
    background: '#fff', display: 'inline-block',
  },
  submitBtn: {
    padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    color: '#fff', background: '#046bba', border: 'none', cursor: 'pointer',
  },
};
