import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { publishRosterSchema } from '@sc-muiden/shared';

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

function formatDutchDateTime(isoDatetime: string): { datum: string; tijd: string } {
  const d = new Date(isoDatetime);
  const datum = d.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const tijd = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return { datum, tijd };
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

  const parsed = publishRosterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validatiefout.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { preview } = parsed.data;
  const admin = createSupabaseAdminClient();

  // Verzamel alle member_id's voor profile-lookup achteraf
  const allMemberIds = new Set<string>();
  for (const item of preview) {
    for (const shift of item.shifts) {
      allMemberIds.add(shift.barcommissie_member.member_id);
      allMemberIds.add(shift.regular_members[0].member_id);
      allMemberIds.add(shift.regular_members[1].member_id);
    }
  }

  // Zoek profile_id per member_id via user_family_members
  const { data: familyLinks } = await admin
    .from('user_family_members')
    .select('profile_id, member_id')
    .in('member_id', Array.from(allMemberIds));

  const memberToProfile = new Map<string, string>();
  for (const link of familyLinks ?? []) {
    memberToProfile.set(link.member_id, link.profile_id);
  }

  // Verwerk elk day-slot in sequence; rollback niet automatisch maar we vangen fouten op
  const activitiesInserted: string[] = [];
  const assignmentsInserted: string[] = [];
  const notificationsToInsert: Array<{
    recipient_profile_id: string;
    title: string;
    body: string;
    type: string;
    activity_id: string;
  }> = [];

  for (const item of preview) {
    // Laad slot-data voor de sport en datum
    const { data: slot } = await admin
      .from('bar_day_slots')
      .select('sport, date')
      .eq('id', item.bar_day_slot_id)
      .single();

    for (const shift of item.shifts) {
      const { datum, tijd: beginTijd } = formatDutchDateTime(shift.starts_at);
      const { tijd: eindTijd } = formatDutchDateTime(shift.ends_at);

      const { data: activity, error: actError } = await admin
        .from('activities')
        .insert({
          type: 'bardienst',
          title: `Bardienst ${datum}`,
          sport: slot?.sport ?? null,
          starts_at: shift.starts_at,
          ends_at: shift.ends_at,
          bar_day_slot_id: item.bar_day_slot_id,
        })
        .select('id')
        .single();

      if (actError || !activity) {
        // Cleanup eerder aangemaakte activiteiten en toewijzingen
        if (activitiesInserted.length > 0) {
          await admin.from('bar_assignments').delete().in('activity_id', activitiesInserted);
          await admin.from('activities').delete().in('id', activitiesInserted);
        }
        return NextResponse.json({ error: 'Publicatie mislukt. Probeer het opnieuw.' }, { status: 500 });
      }

      activitiesInserted.push(activity.id);

      const memberIds = [
        shift.barcommissie_member.member_id,
        shift.regular_members[0].member_id,
        shift.regular_members[1].member_id,
      ];

      const { error: assignError } = await admin
        .from('bar_assignments')
        .insert(memberIds.map((member_id) => ({ activity_id: activity.id, member_id })));

      if (assignError) {
        await admin.from('bar_assignments').delete().in('activity_id', activitiesInserted);
        await admin.from('activities').delete().in('id', activitiesInserted);
        return NextResponse.json({ error: 'Publicatie mislukt. Probeer het opnieuw.' }, { status: 500 });
      }

      assignmentsInserted.push(activity.id);

      // Stel notificaties op voor leden met een gekoppeld profiel
      for (const memberId of memberIds) {
        const profileId = memberToProfile.get(memberId);
        if (!profileId) continue;
        notificationsToInsert.push({
          recipient_profile_id: profileId,
          title: 'Bardienst ingepland',
          body: `Je bent ingepland voor bardienst op ${datum} van ${beginTijd} tot ${eindTijd}.`,
          type: 'bardienst',
          activity_id: activity.id,
        });
      }
    }
  }

  // Notificaties bulk-inserten — push-trigger Edge Function verzendt push-berichten
  if (notificationsToInsert.length > 0) {
    await admin.from('notifications').insert(notificationsToInsert);
  }

  return NextResponse.json({
    activities_count: activitiesInserted.length,
    notifications_count: notificationsToInsert.length,
  });
}
