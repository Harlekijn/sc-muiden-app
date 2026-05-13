import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';

const rejectSchema = z.object({
  admin_notes: z.string().optional(),
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
    body = {};
  }

  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: request, error: loadError } = await admin
    .from('account_requests')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (loadError || !request) {
    return NextResponse.json({ error: 'Aanvraag niet gevonden.' }, { status: 404 });
  }

  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Aanvraag is al afgehandeld.' }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from('account_requests')
    .update({
      status: 'rejected',
      admin_notes: parsed.data.admin_notes ?? null,
      reviewed_by: auth.profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (updateError) {
    console.error('[account-requests/reject] outcome=update_failed');
    return NextResponse.json({ error: 'Status bijwerken mislukt.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
