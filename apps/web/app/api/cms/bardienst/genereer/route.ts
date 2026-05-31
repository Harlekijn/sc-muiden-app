import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { generateRosterSchema } from '@sc-muiden/shared';
import { seasonBounds, genereerPreviewVoorDag, type AlgorithmDay } from '../../../../../lib/bardienst-algoritme';

async function getAdminUser() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'beheerder') return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const parsed = generateRosterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validatiefout.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { season, dagen } = parsed.data;
  const admin = createSupabaseAdminClient();

  const bounds = seasonBounds(season);
  const { data: assignments } = await admin
    .from('bar_assignments')
    .select('member_id, activities!inner(starts_at, type, deleted_at)')
    .eq('activities.type', 'bardienst')
    .is('activities.deleted_at', null)
    .gte('activities.starts_at', bounds.start)
    .lte('activities.starts_at', bounds.end);

  const fairnessMap = new Map<string, number>();
  for (const a of assignments ?? []) {
    fairnessMap.set(a.member_id, (fairnessMap.get(a.member_id) ?? 0) + 1);
  }

  const { data: allMembers, error: membersError } = await admin
    .from('members')
    .select('id, first_name, last_name, sport, lid_type, is_barcommissie, is_vrijwilliger')
    .is('deleted_at', null);

  if (membersError || !allMembers) {
    return NextResponse.json({ error: 'Leden ophalen mislukt.' }, { status: 500 });
  }

  const previews = [];

  for (const dag of dagen) {
    const algoDag: AlgorithmDay = {
      preview_id: randomUUID(),
      date: dag.date,
      starts_at: dag.starts_at,
      ends_at: dag.ends_at,
      sport: dag.sport,
    };
    const resultaat = genereerPreviewVoorDag(algoDag, allMembers, fairnessMap);
    if ('code' in resultaat) {
      return NextResponse.json({ error: resultaat.error, code: resultaat.code }, { status: 422 });
    }
    if (resultaat.shifts.length > 0) {
      previews.push(resultaat);
      // Propageer nieuw ingeplande diensten naar de fairness map zodat de volgende
      // dag andere leden kiest (anders start elke dag met dezelfde scores).
      for (const shift of resultaat.shifts) {
        const ids = [
          shift.barcommissie_member.member_id,
          shift.regular_members[0].member_id,
          shift.regular_members[1].member_id,
        ];
        for (const id of ids) {
          fairnessMap.set(id, (fairnessMap.get(id) ?? 0) + 1);
        }
      }
    }
  }

  return NextResponse.json(previews);
}
