import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import type { TeamMemberWithMember } from '@sc-muiden/shared';
import { TeamDetailClient } from './_components/TeamDetailClient';

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function TeamDetailPage({ params, searchParams }: PageProps) {
  const supabase = createSupabaseServerClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, sport, age_category, season, federation_team_id, created_at, updated_at, deleted_at')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !team) notFound();

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, member_id, role, jersey_number, members(id, first_name, last_name, sport)')
    .eq('team_id', params.id)
    .is('deleted_at', null);

  const activeTab = searchParams.tab === 'leden' ? 'leden' : 'gegevens';

  return (
    <TeamDetailClient
      team={team}
      teamMembers={(teamMembers ?? []) as unknown as TeamMemberWithMember[]}
      activeTab={activeTab}
    />
  );
}
