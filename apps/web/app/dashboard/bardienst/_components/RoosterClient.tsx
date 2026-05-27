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
  bar_day_slot_id: string | null;
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

function groupBySlot(activities: Activity[]): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const a of activities) {
    if (!a.bar_day_slot_id) continue;
    const existing = map.get(a.bar_day_slot_id) ?? [];
    existing.push(a);
    map.set(a.bar_day_slot_id, existing);
  }
  return map;
}

export function RoosterClient({ activities: initialActivities, members }: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [van, setVan] = useState('');
  const [tot, setTot] = useState('');
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState('');
  const [editIsBarcommissie, setEditIsBarcommissie] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = activities;
    if (van) list = list.filter((a) => a.starts_at.slice(0, 10) >= van);
    if (tot) list = list.filter((a) => a.starts_at.slice(0, 10) <= tot);
    return list;
  }, [activities, van, tot]);

  const grouped = useMemo(() => groupBySlot(filtered), [filtered]);

  async function handleDeleteDag(slotId: string) {
    if (!confirm('Alle diensten voor deze dag verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    setDeletingSlot(slotId);
    setError(null);
    try {
      const res = await fetch(`/api/cms/bardienst/rooster/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.bar_day_slot_id !== slotId));
      } else {
        setError('Verwijderen mislukt. Probeer het opnieuw.');
      }
    } catch {
      setError('Geen verbinding — controleer je internetverbinding en probeer opnieuw.');
    }
    setDeletingSlot(null);
  }

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
        <p style={s.emptyText}>Genereer een rooster via de knop op het tabblad &quot;Day slots&quot;.</p>
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
        Array.from(grouped.entries()).map(([slotId, dayActivities]) => (
          <div key={slotId} style={s.dayCard}>
            <div style={s.dayHeader}>
              <h2 style={s.dayTitle}>{formatDutchDate(dayActivities[0].starts_at)}</h2>
              <button
                onClick={() => handleDeleteDag(slotId)}
                disabled={deletingSlot === slotId}
                style={s.deleteDagBtn}
              >
                {deletingSlot === slotId ? 'Verwijderen...' : 'Dag verwijderen'}
              </button>
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
  empty: { padding: '48px', textAlign: 'center', color: '#5a6e8a' },
  emptyTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 8px' },
  emptyText: { fontSize: '14px', margin: 0 },
  filter: { display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  filterLabel: { fontSize: '12px', fontWeight: 600, color: '#5a6e8a', textTransform: 'uppercase' },
  dateInput: {
    padding: '8px 12px', border: '1px solid #dde5f0', borderRadius: '8px',
    fontSize: '14px', color: '#0d1f3c', background: '#fff',
  },
  clearBtn: {
    padding: '8px 14px', background: '#f0f4f9', color: '#5a6e8a',
    border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  },
  error: { color: '#d63c3c', marginBottom: '12px', fontSize: '14px' },
  dayCard: {
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '20px 24px', marginBottom: '16px',
  },
  dayHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  dayTitle: { fontSize: '16px', fontWeight: 700, color: '#011d50', margin: 0 },
  deleteDagBtn: {
    background: 'none', border: '1px solid #d63c3c', color: '#d63c3c',
    borderRadius: '6px', padding: '4px 12px', fontSize: '13px', cursor: 'pointer',
  },
  shiftBlock: { borderTop: '1px solid #dde5f0', paddingTop: '12px', marginTop: '12px' },
  shiftTime: { fontSize: '13px', fontWeight: 600, color: '#5a6e8a', margin: '0 0 8px' },
  membersList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  noMembers: { fontSize: '14px', color: '#5a6e8a', margin: 0 },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  memberInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  memberName: { fontSize: '14px', color: '#0d1f3c' },
  badgeConfirmed: {
    fontSize: '12px', fontWeight: 500, color: '#1a8c5c',
    background: '#e8f5f0', padding: '2px 8px', borderRadius: '4px',
  },
  badgePending: {
    fontSize: '12px', fontWeight: 500, color: '#5a6e8a',
    background: '#f0f4f9', padding: '2px 8px', borderRadius: '4px',
  },
  editBtn: {
    background: 'none', border: 'none', color: '#046bba',
    fontSize: '13px', cursor: 'pointer', padding: 0,
  },
  editRow: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' },
  memberSelect: {
    flex: 1, minWidth: '200px', padding: '6px 10px',
    border: '1px solid #dde5f0', borderRadius: '6px', fontSize: '14px', color: '#0d1f3c',
  },
  saveBtn: {
    padding: '6px 14px', background: '#046bba', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
  },
  cancelBtn: {
    background: 'none', border: 'none', color: '#5a6e8a',
    fontSize: '13px', cursor: 'pointer', padding: 0,
  },
};
