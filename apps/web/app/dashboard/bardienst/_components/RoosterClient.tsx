'use client';

import { useState, useMemo } from 'react';

interface SimpleMember {
  id: string;
  first_name: string;
  last_name: string;
  is_barcommissie: boolean;
}

interface BarAssignment {
  id: string;
  member_id: string;
  confirmed_at: string | null;
  members: SimpleMember | null;
}

interface Activity {
  id: string;
  title: string;
  sport: string | null;
  starts_at: string;
  ends_at: string | null;
  bar_assignments: BarAssignment[];
}

interface Props {
  activities: Activity[];
  members: SimpleMember[];
}

function formatDutchDate(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit',
  });
}

function dateKey(isoDatetime: string): string {
  return isoDatetime.slice(0, 10);
}

function groupByDate(activities: Activity[]): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = dateKey(a.starts_at);
    const existing = map.get(key) ?? [];
    existing.push(a);
    map.set(key, existing);
  }
  return map;
}

export function RoosterClient({ activities: initialActivities, members }: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [van, setVan] = useState('');
  const [tot, setTot] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState('');
  const [editIsBarcommissie, setEditIsBarcommissie] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = activities;
    if (van) list = list.filter((a) => dateKey(a.starts_at) >= van);
    if (tot) list = list.filter((a) => dateKey(a.starts_at) <= tot);
    return list;
  }, [activities, van, tot]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  async function handleSaveAssignment(assignmentId: string) {
    setSavingId(assignmentId);
    setError(null);
    try {
      const res = await fetch(`/api/cms/bardienst/rooster/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: editMemberId }),
      });
      if (res.ok) {
        const newMember = members.find((m) => m.id === editMemberId) ?? null;
        setActivities((prev) =>
          prev.map((a) => ({
            ...a,
            bar_assignments: a.bar_assignments.map((ba) =>
              ba.id === assignmentId
                ? { ...ba, member_id: editMemberId, members: newMember }
                : ba
            ),
          }))
        );
        setEditingId(null);
      } else {
        setError('Opslaan mislukt. Probeer het opnieuw.');
      }
    } catch {
      setError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
    }
    setSavingId(null);
  }

  if (activities.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>Nog geen rooster gepubliceerd</p>
        <p style={s.emptyText}>Genereer een rooster via de knop hierboven.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={s.filter}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel} htmlFor="filter-van">Van</label>
          <input
            id="filter-van"
            type="date"
            value={van}
            onChange={(e) => setVan(e.target.value)}
            style={s.dateInput}
          />
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel} htmlFor="filter-tot">Tot</label>
          <input
            id="filter-tot"
            type="date"
            value={tot}
            onChange={(e) => setTot(e.target.value)}
            style={s.dateInput}
          />
        </div>
        {(van || tot) && (
          <button style={s.clearBtn} onClick={() => { setVan(''); setTot(''); }}>
            Wis filter
          </button>
        )}
      </div>

      {error && <p style={s.error}>{error}</p>}

      {grouped.size === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>Geen diensten in deze periode</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([key, dayActivities]) => (
          <div key={key} style={s.dayCard}>
            <div style={s.dayHeader}>
              <h2 style={s.dayTitle}>{formatDutchDate(dayActivities[0].starts_at)}</h2>
            </div>

            {dayActivities.map((activity) => (
              <div key={activity.id} style={s.shiftBlock}>
                <p style={s.shiftTime}>
                  {formatTime(activity.starts_at)} – {activity.ends_at ? formatTime(activity.ends_at) : '—'}
                </p>
                <div style={s.membersList}>
                  {activity.bar_assignments.length === 0 ? (
                    <p style={s.noMembers}>Geen leden toegewezen</p>
                  ) : (
                    activity.bar_assignments.map((ba) => (
                      <div key={ba.id} style={s.memberRow}>
                        {editingId === ba.id ? (
                          <div style={s.editRow}>
                            <select
                              value={editMemberId}
                              onChange={(e) => setEditMemberId(e.target.value)}
                              style={s.memberSelect}
                            >
                              {members
                                .filter((m) => m.is_barcommissie === editIsBarcommissie)
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.last_name}, {m.first_name}
                                  </option>
                                ))}
                            </select>
                            <button
                              style={s.saveBtn}
                              onClick={() => handleSaveAssignment(ba.id)}
                              disabled={savingId === ba.id}
                            >
                              {savingId === ba.id ? '...' : 'Opslaan'}
                            </button>
                            <button
                              style={s.cancelBtn}
                              onClick={() => setEditingId(null)}
                              disabled={savingId === ba.id}
                            >
                              Annuleren
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={s.memberInfo}>
                              <span style={s.memberName}>
                                {ba.members
                                  ? `${ba.members.first_name} ${ba.members.last_name}`
                                  : 'Onbekend lid'}
                              </span>
                              <span style={ba.confirmed_at ? s.badgeConfirmed : s.badgePending}>
                                {ba.confirmed_at ? 'Bevestigd' : 'Niet bevestigd'}
                              </span>
                            </div>
                            <button
                              style={s.editBtn}
                              onClick={() => {
                                setEditingId(ba.id);
                                setEditMemberId(ba.member_id);
                                setEditIsBarcommissie(ba.members?.is_barcommissie ?? false);
                              }}
                            >
                              Wijzigen
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-2)' },
  emptyTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 8px' },
  emptyText: { fontSize: '14px', margin: 0 },
  filter: { display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  filterLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase' },
  dateInput: {
    padding: '8px 12px', border: '1px solid var(--color-mid)', borderRadius: '8px',
    fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-white)',
  },
  clearBtn: {
    padding: '8px 14px', background: 'var(--color-light)', color: 'var(--color-text-2)',
    border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  },
  error: { color: 'var(--color-error)', marginBottom: '12px', fontSize: '14px' },
  dayCard: {
    background: 'var(--color-white)', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '20px 24px', marginBottom: '16px',
  },
  dayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  dayTitle: { fontSize: '16px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 },
  shiftBlock: { borderTop: '1px solid var(--color-mid)', paddingTop: '12px', marginTop: '12px' },
  shiftTime: { fontSize: '13px', fontWeight: 600, color: 'var(--color-text-2)', margin: '0 0 8px' },
  membersList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  noMembers: { fontSize: '14px', color: 'var(--color-text-2)', margin: 0 },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  memberInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  memberName: { fontSize: '14px', color: 'var(--color-text)' },
  badgeConfirmed: {
    fontSize: '12px', fontWeight: 500, color: 'var(--color-success)',
    background: 'rgba(26, 140, 92, 0.10)', padding: '2px 8px', borderRadius: '4px',
  },
  badgePending: {
    fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)',
    background: 'var(--color-light)', padding: '2px 8px', borderRadius: '4px',
  },
  editBtn: {
    background: 'none', border: 'none', color: 'var(--color-blue)',
    fontSize: '13px', cursor: 'pointer', padding: 0,
  },
  editRow: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' },
  memberSelect: {
    flex: 1, minWidth: '200px', padding: '6px 10px',
    border: '1px solid var(--color-mid)', borderRadius: '6px', fontSize: '14px', color: 'var(--color-text)',
  },
  saveBtn: {
    padding: '6px 14px', background: 'var(--color-blue)', color: 'var(--color-white)',
    border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
  },
  cancelBtn: {
    background: 'none', border: 'none', color: 'var(--color-text-2)',
    fontSize: '13px', cursor: 'pointer', padding: 0,
  },
};
