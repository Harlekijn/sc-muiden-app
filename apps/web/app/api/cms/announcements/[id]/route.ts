import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { updateAnnouncementSchema } from '@sc-muiden/shared';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

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
  return { user, profile };
}

export async function PATCH(
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

  const parsed = updateAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Ongeldig verzoek.';
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (updates.body) {
    updates.body = sanitizeHtml(updates.body as string);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('announcements')
    .update(updates)
    .eq('id', params.id)
    .is('deleted_at', null);

  if (error) {
    console.error(`[cms-announcements] id=${params.id} outcome=update_failed`);
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('announcements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('deleted_at', null);

  if (error) {
    console.error(`[cms-announcements] id=${params.id} outcome=delete_failed`);
    return NextResponse.json({ error: 'Archiveren mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
