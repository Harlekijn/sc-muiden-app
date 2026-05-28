import type { ActivityWithDetails, Sport, MatchStatus } from '@sc-muiden/shared';
import { supabase } from './supabase';

// Base-rij zoals geleverd door de view activities_with_occurrences.
// Bevat alle activities-velden plus is_generated; geen embedded relaties
// (PostgREST kan op een UNION-view geen FK's inferreren).
export type ActivityViewRow = {
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
  is_generated: boolean;
};

type TeamLookup = { id: string; name: string; sport: string };
type MatchLookup = {
  id: string;
  activity_id: string;
  home_team: string;
  away_team: string;
  score_home: number | null;
  score_away: number | null;
  status: string;
};
type BarAssignmentLookup = {
  id: string;
  activity_id: string;
  member_id: string;
  confirmed_at: string | null;
  created_at: string;
  members: { id: string; first_name: string; last_name: string } | null;
};

export async function enrichActivities(
  rows: ActivityViewRow[],
): Promise<ActivityWithDetails[]> {
  if (rows.length === 0) return [];

  const teamIds = Array.from(
    new Set(rows.map((r) => r.team_id).filter((id): id is string => !!id)),
  );

  // Activity-ID's die in echte (niet-gegenereerde) rijen voorkomen — alleen
  // daarvoor bestaan matches/bar_assignments-FK's. Trainings hebben geen match
  // en geen bar-assignments, dus we sparen lookups door alleen niet-gegenereerde
  // rijen mee te nemen.
  const realActivityIds = rows
    .filter((r) => !r.is_generated)
    .map((r) => r.id);

  const [teamsRes, matchesRes, barRes] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('teams')
          .select('id, name, sport')
          .in('id', teamIds)
      : Promise.resolve({ data: [] as TeamLookup[], error: null }),
    realActivityIds.length > 0
      ? supabase
          .from('matches')
          .select('id, activity_id, home_team, away_team, score_home, score_away, status')
          .in('activity_id', realActivityIds)
      : Promise.resolve({ data: [] as MatchLookup[], error: null }),
    realActivityIds.length > 0
      ? supabase
          .from('bar_assignments')
          .select(
            'id, activity_id, member_id, confirmed_at, created_at, members(id, first_name, last_name)',
          )
          .in('activity_id', realActivityIds)
      : Promise.resolve({ data: [] as BarAssignmentLookup[], error: null }),
  ]);

  if (teamsRes.error) throw teamsRes.error;
  if (matchesRes.error) throw matchesRes.error;
  if (barRes.error) throw barRes.error;

  const teams = (teamsRes.data ?? []) as TeamLookup[];
  const matches = (matchesRes.data ?? []) as MatchLookup[];
  const bars = (barRes.data ?? []) as unknown as BarAssignmentLookup[];

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const matchByActivity = new Map<string, MatchLookup>();
  for (const m of matches) matchByActivity.set(m.activity_id, m);
  const barsByActivity = new Map<string, BarAssignmentLookup[]>();
  for (const b of bars) {
    const list = barsByActivity.get(b.activity_id) ?? [];
    list.push(b);
    barsByActivity.set(b.activity_id, list);
  }

  return rows.map((row) => {
    const team = row.team_id ? teamById.get(row.team_id) ?? null : null;
    const match = matchByActivity.get(row.id) ?? null;
    const ba = barsByActivity.get(row.id) ?? [];

    return {
      id: row.id,
      type: row.type as ActivityWithDetails['type'],
      sport: row.sport as Sport | null,
      team_id: row.team_id,
      recurring_rule_id: row.recurring_rule_id,
      title: row.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      location: row.location,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      team: team
        ? { id: team.id, name: team.name, sport: team.sport as Sport }
        : null,
      match: match
        ? {
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            score_home: match.score_home,
            score_away: match.score_away,
            status: match.status as MatchStatus,
          }
        : null,
      bar_assignments: ba
        .filter((b) => b.members !== null)
        .map((b) => ({
          id: b.id,
          activity_id: b.activity_id,
          member_id: b.member_id,
          confirmed_at: b.confirmed_at,
          created_at: b.created_at,
          member: {
            id: b.members!.id,
            first_name: b.members!.first_name,
            last_name: b.members!.last_name,
          },
        })),
    };
  });
}
