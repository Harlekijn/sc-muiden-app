import { useQuery } from '@tanstack/react-query';
import type { ActivityWithDetails } from '@sc-muiden/shared';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

async function fetchActivityDetail(id: string): Promise<ActivityWithDetails | null> {
  const { data, error } = await supabase
    .from('activities')
    .select(
      `id, type, sport, team_id, recurring_rule_id, title, starts_at, ends_at,
       location, notes, created_at, updated_at, deleted_at,
       teams(id, name, sport),
       matches(id, home_team, away_team, score_home, score_away, status),
       bar_assignments(id, activity_id, member_id, confirmed_at, created_at, members(id, first_name, last_name))`,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    type: string;
    sport: string | null;
    team_id: string | null;
    recurring_rule_id: string | null;
    title: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    teams: { id: string; name: string; sport: string } | null;
    matches: Array<{
      id: string;
      home_team: string;
      away_team: string;
      score_home: number | null;
      score_away: number | null;
      status: string;
    }>;
    bar_assignments: Array<{
      id: string;
      activity_id: string;
      member_id: string;
      confirmed_at: string | null;
      created_at: string;
      members: { id: string; first_name: string; last_name: string } | null;
    }>;
  };

  return {
    id: raw.id,
    type: raw.type as ActivityWithDetails['type'],
    sport: raw.sport as ActivityWithDetails['sport'],
    team_id: raw.team_id,
    recurring_rule_id: raw.recurring_rule_id,
    title: raw.title,
    starts_at: raw.starts_at,
    ends_at: raw.ends_at,
    location: raw.location,
    notes: raw.notes,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    deleted_at: raw.deleted_at,
    team: raw.teams
      ? { id: raw.teams.id, name: raw.teams.name, sport: raw.teams.sport as 'voetbal' | 'hockey' }
      : null,
    match: raw.matches[0]
      ? {
          id: raw.matches[0].id,
          home_team: raw.matches[0].home_team,
          away_team: raw.matches[0].away_team,
          score_home: raw.matches[0].score_home,
          score_away: raw.matches[0].score_away,
          status: raw.matches[0].status as 'gepland' | 'live' | 'gespeeld' | 'afgelast',
        }
      : null,
    bar_assignments: raw.bar_assignments
      .filter((ba) => ba.members !== null)
      .map((ba) => ({
        id: ba.id,
        activity_id: ba.activity_id,
        member_id: ba.member_id,
        confirmed_at: ba.confirmed_at,
        created_at: ba.created_at,
        member: {
          id: ba.members!.id,
          first_name: ba.members!.first_name,
          last_name: ba.members!.last_name,
        },
      })),
  };
}

export function useActivityDetail(id: string) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => fetchActivityDetail(id),
    enabled: !!profile?.id && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
