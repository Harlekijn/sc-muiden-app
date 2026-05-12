import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { TrainingForm } from './_components/TrainingForm';
import { ClubactiviteitForm } from './_components/ClubactiviteitForm';
import { BardienstForm } from './_components/BardienstForm';

interface PageProps {
  searchParams: { type?: string };
}

const TYPE_TITLES: Record<string, string> = {
  training: 'Nieuwe training',
  clubactiviteit: 'Nieuwe clubactiviteit',
  bardienst: 'Nieuwe bardienst',
};

export default async function NieuweActiviteitPage({ searchParams }: PageProps) {
  const type = searchParams.type;

  if (!type || !['training', 'clubactiviteit', 'bardienst'].includes(type)) {
    return (
      <div>
        <h1 style={s.heading}>Nieuwe activiteit</h1>
        <p style={{ color: 'var(--color-error)' }}>
          Ongeldig activiteittype. Kies een type via de activiteitenlijst.
        </p>
        <a href="/dashboard/activiteiten" style={s.backLink}>Terug naar activiteiten</a>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, sport')
    .is('deleted_at', null)
    .order('name');

  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/activiteiten" style={s.breadcrumbLink}>Activiteiten</a>
        {' > '}{TYPE_TITLES[type]}
      </p>
      <h1 style={s.heading}>{TYPE_TITLES[type]}</h1>

      {type === 'training' && <TrainingForm teams={teams ?? []} />}
      {type === 'clubactiviteit' && <ClubactiviteitForm />}
      {type === 'bardienst' && <BardienstForm />}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  breadcrumb: { fontSize: 'var(--text-xs)', color: 'var(--color-text-2)', marginBottom: 'var(--space-2)' },
  breadcrumbLink: { color: 'var(--color-blue)', textDecoration: 'none' },
  heading: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 'var(--space-6)' },
  backLink: { color: 'var(--color-blue)', fontSize: 'var(--text-sm)', fontWeight: 600, textDecoration: 'none' },
};
