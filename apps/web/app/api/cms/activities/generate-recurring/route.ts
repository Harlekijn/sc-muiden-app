import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { addWeeks, parseISO, isBefore, isEqual, format } from 'date-fns';

export async function POST(req: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['beheerder', 'commissielid'].includes(profile.role)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  let body: {
    recurring_rule_id: string;
    team_id: string;
    starts_at: string;
    ends_at?: string | null;
    location?: string | null;
    notes?: string | null;
    valid_from: string;
    valid_until: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: team } = await admin
    .from('teams')
    .select('sport, name')
    .eq('id', body.team_id)
    .single();

  const startDate = parseISO(body.starts_at);
  const endDate = parseISO(body.valid_until);

  const activities: object[] = [];
  let current = parseISO(body.valid_from);
  // Find first occurrence on the same day of week as starts_at
  const targetDay = startDate.getDay(); // 0=sun
  while (current.getDay() !== targetDay && isBefore(current, endDate)) {
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  const startTime = format(startDate, 'HH:mm');
  const endTime = body.ends_at ? format(parseISO(body.ends_at), 'HH:mm') : null;

  while (isBefore(current, endDate) || isEqual(current, endDate)) {
    const actStart = `${format(current, 'yyyy-MM-dd')}T${startTime}:00`;
    const actEnd = endTime ? `${format(current, 'yyyy-MM-dd')}T${endTime}:00` : null;

    activities.push({
      type: 'training',
      team_id: body.team_id,
      sport: team?.sport ?? null,
      title: `Training ${team?.name ?? ''}`.trim(),
      starts_at: actStart,
      ends_at: actEnd,
      location: body.location ?? null,
      notes: body.notes ?? null,
      recurring_rule_id: body.recurring_rule_id,
    });

    current = addWeeks(current, 1);
  }

  if (activities.length > 0) {
    await admin.from('activities').insert(activities);
  }

  return NextResponse.json({ count: activities.length });
}
