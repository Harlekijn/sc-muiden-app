import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

type ActivityType = 'wedstrijd' | 'bardienst';

interface ReminderWindow {
  type: ActivityType;
  prefField: 'wedstrijd' | 'bardienst';
  notificationType: string;
  hoursAhead: number;
  windowHours: number;
  titleFn: (title: string) => string;
  bodyFn: (title: string, startsAt: string) => string;
}

const WINDOWS: ReminderWindow[] = [
  {
    type: 'wedstrijd',
    prefField: 'wedstrijd',
    notificationType: 'wedstrijd_herinnering',
    hoursAhead: 24,
    windowHours: 4,
    titleFn: (title) => `Wedstrijd morgen: ${title}`,
    bodyFn: (title, startsAt) => {
      const time = new Date(startsAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      return `${title} begint morgen om ${time}.`;
    },
  },
  {
    type: 'bardienst',
    prefField: 'bardienst',
    notificationType: 'bardienst_herinnering',
    hoursAhead: 48,
    windowHours: 4,
    titleFn: (title) => `Bardienst herinnering: ${title}`,
    bodyFn: (title, startsAt) => {
      const time = new Date(startsAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      return `Je bent ingepland voor bardienst op ${title} om ${time}.`;
    },
  },
];

async function getAffectedProfileIds(
  activityId: string,
  activityType: ActivityType,
  teamId: string | null,
): Promise<string[]> {
  if (activityType === 'bardienst') {
    const { data } = await supabase
      .from('bar_assignments')
      .select('member_id')
      .eq('activity_id', activityId);

    const memberIds = (data ?? []).map((r: { member_id: string }) => r.member_id);
    if (memberIds.length === 0) return [];

    const { data: links } = await supabase
      .from('user_family_members')
      .select('profile_id')
      .in('member_id', memberIds);

    return [...new Set((links ?? []).map((l: { profile_id: string }) => l.profile_id))];
  }

  if (!teamId) return [];

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('member_id')
    .eq('team_id', teamId);

  const memberIds = (teamMembers ?? []).map((r: { member_id: string }) => r.member_id);
  if (memberIds.length === 0) return [];

  const { data: links } = await supabase
    .from('user_family_members')
    .select('profile_id')
    .in('member_id', memberIds);

  return [...new Set((links ?? []).map((l: { profile_id: string }) => l.profile_id))];
}

async function processWindow(window: ReminderWindow): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (window.hoursAhead - window.windowHours / 2) * 3600_000);
  const windowEnd   = new Date(now.getTime() + (window.hoursAhead + window.windowHours / 2) * 3600_000);

  const { data: activities } = await supabase
    .from('activities')
    .select('id, title, type, team_id, starts_at')
    .eq('type', window.type)
    .gte('starts_at', windowStart.toISOString())
    .lte('starts_at', windowEnd.toISOString())
    .is('deleted_at', null);

  let scheduled = 0;

  for (const activity of activities ?? []) {
    const profileIds = await getAffectedProfileIds(activity.id, activity.type, activity.team_id);
    if (profileIds.length === 0) continue;

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('profile_id')
      .in('profile_id', profileIds)
      .eq(window.prefField, false);

    const optedOut = new Set((prefs ?? []).map((p: { profile_id: string }) => p.profile_id));
    const eligible = profileIds.filter((id) => !optedOut.has(id));

    for (const profileId of eligible) {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_profile_id: profileId,
          activity_id: activity.id,
          type: window.notificationType,
          title: window.titleFn(activity.title),
          body: window.bodyFn(activity.title, activity.starts_at),
          data: { activity_id: activity.id, screen: `/activiteit/${activity.id}` },
        });

      // Conflict = already exists (dedup index) → skip silently
      if (!error || error.code === '23505') {
        if (!error) scheduled++;
      } else {
        console.error(JSON.stringify({ event: 'insert_failed', activity_id: activity.id, error_code: error.code }));
      }
    }
  }

  return scheduled;
}

Deno.serve(async () => {
  const startedAt = new Date().toISOString();
  console.log(JSON.stringify({ event: 'scheduler_start', ts: startedAt }));
  try {
    let total = 0;
    for (const window of WINDOWS) {
      const count = await processWindow(window);
      console.log(JSON.stringify({ event: 'window_processed', type: window.type, scheduled: count, ts: new Date().toISOString() }));
      total += count;
    }

    console.log(JSON.stringify({ event: 'scheduler_done', scheduled: total, ts: new Date().toISOString() }));
    return new Response(JSON.stringify({ ok: true, scheduled: total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'scheduler_error', message: (err as Error).message }));
    return new Response(
      JSON.stringify({ ok: false, message: 'Er is een fout opgetreden bij het plannen van herinneringen.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
