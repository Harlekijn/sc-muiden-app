import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '../../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../../lib/supabase-server';

const patchSchema = z.object({ member_id: z.string().uuid() });

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validatiefout.' }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('bar_assignments')
    .update({ member_id: parsed.data.member_id })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
