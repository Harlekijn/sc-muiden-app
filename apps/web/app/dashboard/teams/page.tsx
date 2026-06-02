import { createSupabaseServerClient } from '../../../lib/supabase-server';

export default async function TeamsPage() {
  const supabase = createSupabaseServerClient();

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, sport, age_category, season, federation_team_id, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  // Get member counts per team
  const teamIds = (teams ?? []).map((t) => t.id);
  const memberCounts: Record<string, number> = {};
  if (teamIds.length > 0) {
    const { data: counts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)
      .is('deleted_at', null);
    if (counts) {
      counts.forEach((row) => {
        memberCounts[row.team_id] = (memberCounts[row.team_id] ?? 0) + 1;
      });
    }
  }

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>Teams</h1>
        <div style={s.headerActions}>
          <a href="/dashboard/teams/importeren" style={s.importBtn}>Importeren</a>
          <a href="/dashboard/teams/nieuw" style={s.newBtn}>+ Nieuw team</a>
        </div>
      </div>

      {error ? (
        <p style={{ color: 'var(--color-error)' }}>Teams konden niet worden geladen.</p>
      ) : (teams ?? []).length === 0 ? (
        <p style={s.empty}>Er zijn nog geen teams aangemaakt.</p>
      ) : (
        <div style={s.table}>
          <div style={{ ...s.row, ...s.tableHeader }}>
            <span>Naam</span>
            <span>Sport</span>
            <span>Categorie</span>
            <span>Seizoen</span>
            <span>Leden</span>
            <span />
          </div>
          {(teams ?? []).map((team) => (
            <a key={team.id} href={`/dashboard/teams/${team.id}`} style={s.rowLink}>
              <span style={s.nameCell}>{team.name}</span>
              <span>
                <span style={{
                  ...s.sportBadge,
                  background: team.sport === 'voetbal' ? 'var(--color-navy-tint)' : 'var(--color-blue-tint)',
                  color: team.sport === 'voetbal' ? 'var(--color-navy)' : 'var(--color-blue)',
                }}>
                  {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
                </span>
              </span>
              <span style={s.cell}>{team.age_category ?? '—'}</span>
              <span style={s.cell}>{team.season ?? '—'}</span>
              <span style={s.cell}>{memberCounts[team.id] ?? 0}</span>
              <span style={s.chevron}>›</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-6)',
  },
  headerActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    margin: 0,
  },
  importBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-mid)',
    background: 'none',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    textDecoration: 'none',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
  },
  newBtn: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-navy)',
    color: 'var(--color-white)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    textDecoration: 'none',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
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
    gridTemplateColumns: '2fr 100px 120px 120px 60px 32px',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
  },
  rowLink: {
    display: 'grid',
    gridTemplateColumns: '2fr 100px 120px 120px 60px 32px',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-mid)',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
  },
  nameCell: {
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
  },
  cell: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
  },
  sportBadge: {
    display: 'inline-block',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  chevron: {
    color: 'var(--color-text-2)',
    textAlign: 'center',
    fontSize: 18,
  },
};
