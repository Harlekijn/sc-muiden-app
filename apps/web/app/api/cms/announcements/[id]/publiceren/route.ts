import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';

async function getAdminUser() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['beheerder', 'commissielid'].includes(profile.role)) return null;
  return { user };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();

  // Controleer of al gepubliceerd — geen dubbele push
  const { data: existing } = await admin
    .from('announcements')
    .select('published_at')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Aankondiging niet gevonden.' }, { status: 404 });
  }

  if (existing.published_at) {
    return NextResponse.json({ error: 'Al gepubliceerd.' }, { status: 409 });
  }

  const publishedAt = new Date().toISOString();
  const { error } = await admin
    .from('announcements')
    .update({ published_at: publishedAt })
    .eq('id', params.id);

  if (error) {
    console.error(`[cms-announcements] id=${params.id} outcome=publish_failed`);
    return NextResponse.json({ error: 'Publiceren mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  // Roep announcement-push edge function aan (fire-and-forget; fout stopt de response niet)
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? '';
    const serviceKey = process.env.SUPABASE_SECRET_KEY ?? '';
    await fetch(`${supabaseUrl}/functions/v1/announcement-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ announcement_id: params.id }),
    });
  } catch {
    console.error(`[cms-announcements] id=${params.id} outcome=push_trigger_failed`);
  }

  return NextResponse.json({ ok: true });
}
