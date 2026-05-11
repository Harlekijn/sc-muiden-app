import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchKnvbTeamSchedule } from '../_shared/knvb-client.ts';
import { fetchKnhbTeamSchedule } from '../_shared/knhb-client.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const knvbApiKey = Deno.env.get('KNVB_API_KEY');
const knhbApiKey = Deno.env.get('KNHB_API_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

type MatchStatus = 'gepland' | 'gespeeld' | 'afgelast' | 'live';

interface SyncRequest {
  sport?: 'voetbal' | 'hockey' | 'all';
  triggered_by?: 'cron' | 'manual';
}

interface TeamRow {
  id: string;
  name: string;
  sport: string;
  federation_team_id: string;
}

function normaliseStatus(raw: string): MatchStatus {
  const s = raw.toLowerCase();
  if (s === 'gespeeld' || s === 'played' || s === 'finished') return 'gespeeld';
  if (s === 'afgelast' || s === 'cancelled' || s === 'canceled') return 'afgelast';
  if (s === 'live' || s === 'in_progress') return 'live';
  return 'gepland';
}

async function syncTeam(team: TeamRow): Promise<number> {
  const isKnvb = team.sport === 'voetbal';
  const matches = isKnvb
    ? await fetchKnvbTeamSchedule(team.federation_team_id, knvbApiKey)
    : await fetchKnhbTeamSchedule(team.federation_team_id, knhbApiKey);

  let count = 0;

  for (const m of matches) {
    const status = normaliseStatus(m.status);
    const scheduledAt = m.scheduledAt;

    const { data: upsertedMatch, error: matchErr } = await supabase
      .from('matches')
      .upsert(
        {
          federation_match_id: m.id,
          federation_source: isKnvb ? 'knvb' : 'knhb',
          team_id: team.id,
          home_team: m.homeTeam,
          away_team: m.awayTeam,
          score_home: m.homeScore ?? null,
          score_away: m.awayScore ?? null,
          status,
          played_at: status === 'gespeeld' ? scheduledAt : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'federation_match_id', ignoreDuplicates: false }
      )
      .select('id, activity_id')
      .single();

    if (matchErr) {
      console.error(`match upsert fout team=${team.id} fed_id=${m.id}:`, matchErr.message);
      continue;
    }

    const activityTitle = `${m.homeTeam} – ${m.awayTeam}`;

    if (upsertedMatch.activity_id) {
      await supabase
        .from('activities')
        .update({
          title: activityTitle,
          starts_at: scheduledAt,
          location: m.venue ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', upsertedMatch.activity_id);
    } else {
      const { data: newActivity, error: actErr } = await supabase
        .from('activities')
        .insert({
          type: 'wedstrijd',
          sport: team.sport,
          team_id: team.id,
          title: activityTitle,
          starts_at: scheduledAt,
          location: m.venue ?? null,
        })
        .select('id')
        .single();

      if (actErr) {
        console.error(`activity insert fout team=${team.id}:`, actErr.message);
        continue;
      }

      await supabase
        .from('matches')
        .update({ activity_id: newActivity.id })
        .eq('federation_match_id', m.id);
    }

    count++;
  }

  return count;
}

async function syncSport(
  sport: 'voetbal' | 'hockey',
  triggeredBy: 'cron' | 'manual'
): Promise<void> {
  const startedAt = new Date().toISOString();

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name, sport, federation_team_id')
    .eq('sport', sport)
    .not('federation_team_id', 'is', null)
    .is('deleted_at', null);

  if (teamsErr) {
    await writeSyncLog(sport, triggeredBy, startedAt, 0, teamsErr.message);
    return;
  }

  let totalRecords = 0;
  let lastError: string | null = null;

  for (const team of (teams ?? []) as TeamRow[]) {
    try {
      const count = await syncTeam(team);
      totalRecords += count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`sync mislukt sport=${sport} team=${team.id}:`, msg);
      lastError = msg;
    }
  }

  await writeSyncLog(sport, triggeredBy, startedAt, totalRecords, lastError);
}

async function writeSyncLog(
  sport: string,
  triggeredBy: string,
  startedAt: string,
  recordsUpdated: number,
  error: string | null
): Promise<void> {
  await supabase.from('sync_log').insert({
    sport,
    triggered_by: triggeredBy,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    records_updated: recordsUpdated,
    error,
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Alleen POST-verzoeken zijn toegestaan' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SyncRequest = {};
  try {
    body = (await req.json()) as SyncRequest;
  } catch {
    // empty body is fine — defaults to sport: 'all', triggered_by: 'cron'
  }

  const sport = body.sport ?? 'all';
  const triggeredBy = body.triggered_by ?? 'cron';

  const sportsToSync: Array<'voetbal' | 'hockey'> =
    sport === 'all' ? ['voetbal', 'hockey'] : [sport];

  for (const s of sportsToSync) {
    await syncSport(s, triggeredBy);
  }

  return new Response(
    JSON.stringify({ ok: true, sport, triggered_by: triggeredBy }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
