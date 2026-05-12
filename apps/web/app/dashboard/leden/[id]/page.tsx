import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import type { Member } from '@sc-muiden/shared';
import { LidEditForm } from './_components/LidEditForm';

interface PageProps {
  params: { id: string };
}

export default async function LidDetailPage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();

  const { data: member, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, birth_date, email, phone, sport, role, clubbase_id, created_at, updated_at, deleted_at')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !member) notFound();

  const { data: teamRows } = await supabase
    .from('team_members')
    .select('role, jersey_number, teams(id, name, sport)')
    .eq('member_id', params.id)
    .is('deleted_at', null);

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('member_id', params.id)
    .maybeSingle();

  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <div>
      <p style={s.breadcrumb}>
        <a href="/dashboard/leden" style={s.breadcrumbLink}>Leden</a>
        {' > '}
        {fullName}
      </p>

      <h1 style={s.heading}>{fullName}</h1>

      <LidEditForm member={member as Member} />

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Gekoppeld account</h2>
        {profileRow ? (
          <p style={s.profileText}>
            {profileRow.display_name} — {profileRow.email}
          </p>
        ) : (
          <p style={s.muted}>Geen app-account gekoppeld.</p>
        )}
      </section>

      {teamRows && teamRows.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Teams</h2>
          <div style={s.teamList}>
            {teamRows.map((tm, i) => {
              const team = (tm.teams as unknown) as { id: string; name: string; sport: string } | null;
              return (
                <div key={i} style={s.teamRow}>
                  <a href={team ? `/dashboard/teams/${team.id}` : '#'} style={s.teamName}>
                    {team?.name ?? '—'}
                  </a>
                  <span style={s.teamRole}>{tm.role}</span>
                  {tm.jersey_number != null && (
                    <span style={s.jerseyNumber}>#{tm.jersey_number}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  breadcrumb: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
    marginBottom: 'var(--space-2)',
  },
  breadcrumbLink: {
    color: 'var(--color-blue)',
    textDecoration: 'none',
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-6)',
  },
  section: {
    marginTop: 'var(--space-8)',
    paddingTop: 'var(--space-8)',
    borderTop: '1px solid var(--color-mid)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: 'var(--space-4)',
  },
  profileText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
  },
  muted: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  teamRow: {
    display: 'flex',
    gap: 'var(--space-4)',
    alignItems: 'center',
    padding: 'var(--space-2) 0',
    borderBottom: '1px solid var(--color-mid)',
  },
  teamName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-blue)',
    textDecoration: 'none',
    flex: 1,
  },
  teamRole: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
    textTransform: 'capitalize',
  },
  jerseyNumber: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-2)',
  },
};
