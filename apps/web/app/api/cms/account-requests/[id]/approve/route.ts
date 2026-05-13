import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';

const approveSchema = z.object({
  member_ids: z.array(z.string().uuid()).min(1, 'Selecteer minimaal één lid.'),
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

  const { member_ids } = parsed.data;
  const admin = createSupabaseAdminClient();

  // Load the account request and verify it's still pending
  const { data: request, error: loadError } = await admin
    .from('account_requests')
    .select('id, email, display_name, status')
    .eq('id', params.id)
    .single();

  if (loadError || !request) {
    return NextResponse.json({ error: 'Aanvraag niet gevonden.' }, { status: 404 });
  }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Aanvraag is al afgehandeld.' }, { status: 409 });
  }

  // Send invite — creates auth.users row which triggers handle_new_user() to create profiles row
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    request.email,
    { data: { display_name: request.display_name } }
  );

  if (inviteError || !inviteData?.user) {
    console.error('[account-requests/approve] invite_failed', inviteError?.message);
    return NextResponse.json({ error: 'Uitnodiging versturen mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  const newUserId = inviteData.user.id;
  const primaryMemberId = member_ids[0];
  const extraMemberIds = member_ids.slice(1);

  // Link primary member on the profile (the trigger creates the profiles row synchronously)
  const { error: profileError } = await admin
    .from('profiles')
    .update({ member_id: primaryMemberId })
    .eq('id', newUserId);

  if (profileError) {
    console.error('[account-requests/approve] profile_update_failed', profileError.message);
    return NextResponse.json({ error: 'Profielkoppeling mislukt.' }, { status: 500 });
  }

  // Insert extra family members when more than one member was selected
  if (extraMemberIds.length > 0) {
    const familyRows = extraMemberIds.map((member_id) => ({
      profile_id: newUserId,
      member_id,
    }));

    const { error: familyError } = await admin
      .from('user_family_members')
      .insert(familyRows);

    if (familyError) {
      console.error('[account-requests/approve] family_insert_failed', familyError.message);
      return NextResponse.json({ error: 'Gezinsleden koppelen mislukt.' }, { status: 500 });
    }
  }

  // Mark request as approved
  const { error: updateError } = await admin
    .from('account_requests')
    .update({
      status: 'approved',
      reviewed_by: auth.profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (updateError) {
    console.error('[account-requests/approve] status_update_failed', updateError.message);
    return NextResponse.json({ error: 'Status bijwerken mislukt.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
