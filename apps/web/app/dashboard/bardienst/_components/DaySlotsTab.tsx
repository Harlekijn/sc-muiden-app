'use client';

import { useState } from 'react';

interface BarDaySlot {
  id: string;
  date: string;
  starts_at: string;
  ends_at: string;
  sport: string | null;
  season: string;
  notes: string | null;
}

interface Props {
  daySlots: BarDaySlot[];
}

function formatDutchDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

function sportLabel(sport: string | null): string {
  if (sport === 'voetbal') return 'Voetbal';
  if (sport === 'hockey') return 'Hockey';
  return 'Club-breed';
}

export function DaySlotsTab({ daySlots }: Props) {
  const [slots, setSlots] = useState(daySlots);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Day-slot verwijderen?')) return;
    setDeleting(id);
    setError(null);
    let res: Response;
    try {
      res = await fetch(`/api/cms/bardienst/day-slots/${id}`, { method: 'DELETE' });
    } catch {
      setError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
      setDeleting(null);
      return;
    }
    if (res.ok) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } else {
      setError('Verwijderen mislukt. Probeer het opnieuw.');
    }
    setDeleting(null);
  }

  return (
    <div>
      <div style={s.toolbar}>
        <a href="/dashboard/bardienst/day-slots/nieuw" style={s.btn}>+ Nieuw day-slot</a>
        <a href="/dashboard/bardienst/genereren" style={s.btnSecondary}>Genereer rooster</a>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {slots.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>Nog geen day-slots aangemaakt</p>
          <p style={s.emptyText}>Voeg een day-slot toe om een bardienst-rooster te kunnen genereren.</p>
        </div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Datum</th>
              <th style={s.th}>Tijd</th>
              <th style={s.th}>Sport</th>
              <th style={s.th}>Seizoen</th>
              <th style={s.th}>Notities</th>
              <th style={s.th}>Acties</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} style={s.row}>
                <td style={s.td}>{formatDutchDate(slot.date)}</td>
                <td style={s.td}>{formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}</td>
                <td style={s.td}>
                  <span style={slot.sport ? s.sportBadge : s.sportBadgeNeutral}>
                    {sportLabel(slot.sport)}
                  </span>
                </td>
                <td style={s.td}>{slot.season}</td>
                <td style={s.td}>{slot.notes ?? '—'}</td>
                <td style={s.td}>
                  <a href={`/dashboard/bardienst/day-slots/${slot.id}/bewerken`} style={s.actionLink}>
                    Bewerken
                  </a>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={deleting === slot.id}
                    style={s.deleteBtn}
                  >
                    {deleting === slot.id ? '...' : 'Verwijderen'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px' },
  btn: {
    display: 'inline-block', padding: '8px 16px', background: 'var(--color-blue)', color: 'var(--color-white)',
    borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
  },
  btnSecondary: {
    display: 'inline-block', padding: '8px 16px', background: 'var(--color-light)', color: 'var(--color-navy)',
    borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
  },
  error: { color: 'var(--color-error)', marginBottom: '12px', fontSize: '14px' },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-2)' },
  emptyTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 8px' },
  emptyText: { fontSize: '14px', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-2)',
    borderBottom: '2px solid var(--color-mid)', fontSize: '12px', textTransform: 'uppercase',
  },
  row: { borderBottom: '1px solid var(--color-mid)' },
  td: { padding: '12px', color: 'var(--color-text)', verticalAlign: 'middle' },
  sportBadge: {
    display: 'inline-block', padding: '2px 8px', background: 'var(--color-blue)', color: 'var(--color-white)',
    borderRadius: '4px', fontSize: '12px', fontWeight: 500,
  },
  sportBadgeNeutral: {
    display: 'inline-block', padding: '2px 8px', background: 'var(--color-mid)', color: 'var(--color-text-2)',
    borderRadius: '4px', fontSize: '12px', fontWeight: 500,
  },
  actionLink: { color: 'var(--color-blue)', textDecoration: 'none', marginRight: '12px', fontSize: '14px' },
  deleteBtn: {
    background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer',
    fontSize: '14px', padding: 0,
  },
};
