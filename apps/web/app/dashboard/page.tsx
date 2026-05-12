import { createSupabaseServerClient } from '../../lib/supabase-server';
import type { DashboardStats } from '@sc-muiden/shared';
import { formatDutchDateTime } from '@sc-muiden/shared';

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  training: 'Training',
  wedstrijd: 'Wedstrijd',
  bardienst: 'Bardienst',
  clubactiviteit: 'Clubactiviteit',
};

const ACTIVITY_TYPE_COLORS: Record<string, React.CSSProperties> = {
  training: { background: 'var(--color-light)', color: 'var(--color-text)' },
  wedstrijd: { background: 'var(--color-navy)', color: 'var(--color-white)' },
  bardienst: { background: 'rgba(245,197,24,0.15)', color: 'var(--color-warning)' },
  clubactiviteit: { background: 'rgba(4,107,186,0.12)', color: 'var(--color-blue)' },
};

async function fetchStats(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<DashboardStats> {
  const now = new Date().toISOString();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [members, teams, activities, requests] = await Promise.all([
    supabase.from('members').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('teams').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('activities').select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('starts_at', now)
      .lte('starts_at', in7Days),
    supabase.from('family_link_requests').select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  return {
    totalMembers: members.count ?? 0,
    totalTeams: teams.count ?? 0,
    upcomingActivities: activities.count ?? 0,
    pendingFamilyRequests: requests.count ?? 0,
  };
}

async function fetchUpcomingActivities(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('activities')
    .select('id, type, sport, team_id, title, starts_at, ends_at, location, notes, created_at, updated_at, deleted_at, recurring_rule_id, teams(id, name, sport)')
    .is('deleted_at', null)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(5);
  return data ?? [];
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  let stats: DashboardStats = { totalMembers: 0, totalTeams: 0, upcomingActivities: 0, pendingFamilyRequests: 0 };
  let upcomingActivities: Awaited<ReturnType<typeof fetchUpcomingActivities>> = [];
  let error = false;

  try {
    [stats, upcomingActivities] = await Promise.all([
      fetchStats(supabase),
      fetchUpcomingActivities(supabase),
    ]);
  } catch {
    error = true;
  }

  if (error) {
    return (
      <div>
        <h1 style={s.heading}>Dashboard</h1>
        <p style={{ color: 'var(--color-error)', marginTop: 'var(--space-4)' }}>
          Gegevens konden niet worden geladen. Probeer de pagina te vernieuwen.
        </p>
      </div>
    );
  }

  const statCards = [
    { label: 'LEDEN', value: stats.totalMembers, icon: '👥', href: '/dashboard/leden' },
    { label: 'TEAMS', value: stats.totalTeams, icon: '🛡', href: '/dashboard/teams' },
    { label: 'AANKOMENDE ACTIVITEITEN', value: stats.upcomingActivities, icon: '📅', href: '/dashboard/activiteiten' },
    { label: 'OPENSTAANDE VERZOEKEN', value: stats.pendingFamilyRequests, icon: '🕐', href: '/dashboard/gezinsverzoeken' },
  ];

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>

      <div style={s.statsGrid}>
        {statCards.map((card) => (
          <a key={card.label} href={card.href} style={s.statCard}>
            <span style={s.statLabel}>{card.label}</span>
            <span style={s.statValue}>{card.value}</span>
          </a>
        ))}
      </div>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Aankomende activiteiten</h2>
        {upcomingActivities.length === 0 ? (
          <p style={s.empty}>Geen aankomende activiteiten.</p>
        ) : (
          <div style={s.table}>
            <div style={{ ...s.row, ...s.tableHeader }}>
              <span>Datum</span>
              <span>Type</span>
              <span>Team</span>
              <span>Titel</span>
            </div>
            {upcomingActivities.map((act) => {
              const teamRow = (act.teams as unknown) as { name: string } | null;
              const badgeStyle = ACTIVITY_TYPE_COLORS[act.type] ?? {};
              return (
                <a key={act.id} href={`/dashboard/activiteiten`} style={{ ...s.row, textDecoration: 'none', color: 'inherit' }}>
                  <span style={s.dateCell}>{formatDutchDateTime(act.starts_at)}</span>
                  <span>
                    <span style={{ ...s.badge, ...badgeStyle }}>
                      {ACTIVITY_TYPE_LABELS[act.type] ?? act.type}
                    </span>
                  </span>
                  <span style={s.teamCell}>{teamRow?.name ?? '—'}</span>
                  <span style={s.titleCell}>{act.title}</span>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-8)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-10)',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-6)',
    background: 'var(--color-white)',
    border: '1px solid var(--color-mid)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
    textDecoration: 'none',
    transition: 'box-shadow var(--transition-fast)',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-body)',
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-4xl)',
    fontWeight: 800,
    color: 'var(--color-navy)',
    lineHeight: 1,
  },
  section: {
    marginTop: 'var(--space-4)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-4)',
  },
  empty: {
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
  },
  table: {
    border: '1px solid var(--color-mid)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  tableHeader: {
    background: 'var(--color-light)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '160px 140px 160px 1fr',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  dateCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
  },
  teamCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
  },
  titleCell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    fontWeight: 500,
  },
};
