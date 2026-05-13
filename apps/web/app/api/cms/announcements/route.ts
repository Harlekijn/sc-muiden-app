import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { createAnnouncementSchema } from '@sc-muiden/shared';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

async function getAdminUser(_req: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'beheerder') return null;
  return { user, profile };
}

export async function POST(req: NextRequest) {
  const auth = await getAdminUser(req);
  if (!auth) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Ongeldig verzoek.';
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const { title, body: rawBody, sport, published_at } = parsed.data;
  const sanitizedBody = sanitizeHtml(rawBody);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('announcements')
    .insert({
      title,
      body: sanitizedBody,
      sport: sport ?? null,
      author_id: auth.user.id,
      published_at: published_at ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[cms-announcements] outcome=insert_failed');
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
