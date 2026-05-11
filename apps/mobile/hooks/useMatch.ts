import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { MatchWithActivity, MatchStatus, Sport, FederationSource } from '@sc-muiden/shared';

type RawMatchRow = {
  id: string;
  activity_id: string | null;
  team_id: string | null;
  home_team: string;
  away_team: string;
  score_home: number | null;
  score_away: number | null;
  status: string;
  federation_match_id: string | null;
  federation_source: string | null;
  activities: {
    id: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    sport: string | null;
    teams: { name: string } | null;
  } | null;
};

async function fetchMatch(activityId: string): Promise<MatchWithActivity | null> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `id, activity_id, team_id, home_team, away_team,
       score_home, score_away, status, federation_match_id, federation_source,
       activities(id, starts_at, ends_at, location, sport, teams(name))`
    )
    .eq('activity_id', activityId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as RawMatchRow;
  const activity = raw.activities;
  if (!activity) return null;

  return {
    id: raw.id,
    activityId: activity.id,
    teamId: raw.team_id,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    scoreHome: raw.score_home,
    scoreAway: raw.score_away,
    status: raw.status as MatchStatus,
    federationMatchId: raw.federation_match_id,
    federationSource: raw.federation_source as FederationSource | null,
    startsAt: activity.starts_at,
    endsAt: activity.ends_at,
    location: activity.location,
    sport: activity.sport as Sport | null,
    teamName: activity.teams?.name ?? null,
  };
}

export function useMatch(activityId: string) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['match', activityId],
    queryFn: () => fetchMatch(activityId),
    enabled: !!profile?.id && !!activityId,
    staleTime: 5 * 60 * 1000,
  });
}
