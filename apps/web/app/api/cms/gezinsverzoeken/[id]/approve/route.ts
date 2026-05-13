import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';

const approveSchema = z.object({
  member_id: z.string().uuid('Ongeldig lid-ID.'),
});

async function getAdminUser() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await authClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['beheerder', 'commissielid'].includes(profile.role)) return null;
  return { user, profile };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Ongeldig verzoek.';
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();

  const { data: request, error: loadError } = await admin
    .from('family_link_requests')
    .select('id, profile_id, status')
    .eq('id', params.id)
    .single();

  if (loadError || !request) {
    return NextResponse.json({ error: 'Verzoek niet gevonden.' }, { status: 404 });
  }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Verzoek is al afgehandeld.' }, { status: 409 });
  }

  // Update the request status and link the member
  const { error: updateError } = await admin
    .from('family_link_requests')
    .update({
      member_id: parsed.data.member_id,
      status: 'approved',
    })
    .eq('id', params.id);

  if (updateError) {
    console.error('[gezinsverzoeken/approve] update_failed', updateError.message);
    return NextResponse.json({ error: 'Status bijwerken mislukt.' }, { status: 500 });
  }

  // Create the family link
  const { error: familyError } = await admin
    .from('user_family_members')
    .insert({
      profile_id: request.profile_id,
      member_id: parsed.data.member_id,
    });

  if (familyError) {
    console.error('[gezinsverzoeken/approve] family_insert_failed', familyError.message);
    return NextResponse.json({ error: 'Gezinslid koppelen mislukt.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
