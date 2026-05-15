interface BarAssignmentWithMember {
  id: string;
  member_id: string;
  confirmed_at: string | null;
  members: { id: string; first_name: string; last_name: string } | null;
}

interface ActivityWithAssignments {
  id: string;
  title: string;
  sport: string | null;
  starts_at: string;
  ends_at: string | null;
  bar_day_slot_id: string | null;
  bar_assignments: BarAssignmentWithMember[];
}

interface Props {
  activities: ActivityWithAssignments[];
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

function groupByDate(activities: ActivityWithAssignments[]): Map<string, ActivityWithAssignments[]> {
  const map = new Map<string, ActivityWithAssignments[]>();
  for (const a of activities) {
    const dateKey = a.starts_at.split('T')[0];
    const existing = map.get(dateKey) ?? [];
    existing.push(a);
    map.set(dateKey, existing);
  }
  return map;
}

export function RoosterTab({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>Nog geen rooster gepubliceerd</p>
        <p style={s.emptyText}>Genereer een rooster via de knop op het tabblad &quot;Day slots&quot;.</p>
      </div>
    );
  }

  const grouped = groupByDate(activities);

  return (
    <div>
      {Array.from(grouped.entries()).map(([dateKey, dayActivities]) => (
        <div key={dateKey} style={s.dayCard}>
          <h2 style={s.dayTitle}>{formatDutchDate(dayActivities[0].starts_at)}</h2>
          {dayActivities.map((activity) => (
            <div key={activity.id} style={s.shiftBlock}>
              <p style={s.shiftTime}>
                {formatTime(activity.starts_at)} – {activity.ends_at ? formatTime(activity.ends_at) : '—'}
              </p>
              <div style={s.members}>
                {activity.bar_assignments.length === 0 ? (
                  <p style={s.noMembers}>Geen leden toegewezen</p>
                ) : (
                  activity.bar_assignments.map((ba) => (
                    <div key={ba.id} style={s.memberRow}>
                      <span style={s.memberName}>
                        {ba.members
                          ? `${ba.members.first_name} ${ba.members.last_name}`
                          : 'Onbekend lid'}
                      </span>
                      <span style={ba.confirmed_at ? s.badgeConfirmed : s.badgePending}>
                        {ba.confirmed_at ? 'Bevestigd' : 'Niet bevestigd'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty: { padding: '48px', textAlign: 'center', color: '#5a6e8a' },
  emptyTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 8px' },
  emptyText: { fontSize: '14px', margin: 0 },
  dayCard: {
    background: '#fff', borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(1,29,80,0.08)', padding: '20px 24px', marginBottom: '16px',
  },
  dayTitle: { fontSize: '16px', fontWeight: 700, color: '#011d50', margin: '0 0 16px' },
  shiftBlock: { borderTop: '1px solid #dde5f0', paddingTop: '12px', marginTop: '12px' },
  shiftTime: { fontSize: '13px', fontWeight: 600, color: '#5a6e8a', margin: '0 0 8px' },
  members: { display: 'flex', flexDirection: 'column', gap: '6px' },
  noMembers: { fontSize: '14px', color: '#5a6e8a', margin: 0 },
  memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  memberName: { fontSize: '14px', color: '#0d1f3c' },
  badgeConfirmed: {
    fontSize: '12px', fontWeight: 500, color: '#1a8c5c',
    background: '#e8f5f0', padding: '2px 8px', borderRadius: '4px',
  },
  badgePending: {
    fontSize: '12px', fontWeight: 500, color: '#5a6e8a',
    background: '#f0f4f9', padding: '2px 8px', borderRadius: '4px',
  },
};
