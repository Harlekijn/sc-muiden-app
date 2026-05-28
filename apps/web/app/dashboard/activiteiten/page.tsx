import { createSupabaseServerClient } from '../../../lib/supabase-server';
import { ActiviteitenClient } from './_components/ActiviteitenClient';

interface PageProps {
  searchParams: {
    type?: string;
    periode?: string;
    sport?: string;
  };
}

export default async function ActiviteitenPage({ searchParams }: PageProps) {
  const supabase = createSupabaseServerClient();

  const now = new Date().toISOString();
  const isVerleden = searchParams.periode === 'verleden';

  // Lees uit activities_with_occurrences-view: bevat zowel materialized rows als
  // on-the-fly gegenereerde trainings. teams(...) embedden werkt niet op deze
  // UNION-view (PostgREST kan FK's niet inferreren); we joinen daarom client-side.
  let query = supabase
    .from('activities_with_occurrences')
    .select('id, type, sport, team_id, title, starts_at, ends_at, location, notes, created_at, updated_at, deleted_at, recurring_rule_id, is_generated')
    .is('deleted_at', null)
    .order('starts_at', { ascending: !isVerleden })
    .limit(100);

  if (isVerleden) {
    query = query.lt('starts_at', now);
  } else {
    query = query.gte('starts_at', now);
  }

  if (searchParams.type && searchParams.type !== 'alle') {
    query = query.eq('type', searchParams.type);
  }

  if (searchParams.sport && searchParams.sport !== 'alle') {
    query = query.eq('sport', searchParams.sport);
  }

  const { data: rawActivities, error } = await query;

  const teamIds = Array.from(
    new Set((rawActivities ?? []).map((a) => a.team_id).filter((id): id is string => !!id)),
  );

  const { data: teamsData } = teamIds.length > 0
    ? await supabase.from('teams').select('id, name, sport').in('id', teamIds)
    : { data: [] as Array<{ id: string; name: string; sport: string }> };

  const teamById = new Map((teamsData ?? []).map((t) => [t.id, t]));
  const activities = (rawActivities ?? []).map((a) => ({
    ...a,
    teams: a.team_id ? teamById.get(a.team_id) ?? null : null,
  }));

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>Activiteiten</h1>
        <div style={s.newMenu}>
          <a href="/dashboard/activiteiten/nieuw?type=training" style={s.newBtn}>+ Training</a>
          <a href="/dashboard/activiteiten/nieuw?type=clubactiviteit" style={s.newBtnSecondary}>+ Clubactiviteit</a>
          <a href="/dashboard/activiteiten/nieuw?type=bardienst" style={s.newBtnSecondary}>+ Bardienst</a>
        </div>
      </div>

      {error ? (
        <p style={{ color: 'var(--color-error)' }}>Activiteiten konden niet worden geladen.</p>
      ) : (
        <ActiviteitenClient
          activities={activities as unknown as Parameters<typeof ActiviteitenClient>[0]['activities']}
          currentType={searchParams.type ?? 'alle'}
          currentPeriode={searchParams.periode ?? 'aankomend'}
          currentSport={searchParams.sport ?? 'alle'}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' },
  heading: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-navy)', margin: 0 },
  newMenu: { display: 'flex', gap: 'var(--space-2)' },
  newBtn: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-navy)', color: 'var(--color-white)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' },
  newBtnSecondary: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-navy)', background: 'none', color: 'var(--color-navy)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' },
};
