import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { generateRosterSchema } from '@sc-muiden/shared';
import { seasonBounds, genereerPreviewVoorSlot } from '../../../../../lib/bardienst-algoritme';

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

  const { season, bar_day_slot_ids } = parsed.data;
  const admin = createSupabaseAdminClient();

  const { data: slots, error: slotsError } = await admin
    .from('bar_day_slots')
    .select('*')
    .in('id', bar_day_slot_ids)
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (slotsError || !slots?.length) {
    return NextResponse.json({ error: 'Day-slots niet gevonden.' }, { status: 404 });
  }

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

  for (const slot of slots) {
    const resultaat = genereerPreviewVoorSlot(slot, allMembers, fairnessMap);
    if ('code' in resultaat) {
      return NextResponse.json({ error: resultaat.error, code: resultaat.code }, { status: 422 });
    }
    if (resultaat.shifts.length > 0) {
      previews.push(resultaat);
      // Propageer nieuw ingeplande diensten naar de fairness map zodat de volgende
      // slot andere leden kiest (anders start elke dag met dezelfde scores).
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
