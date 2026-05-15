import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';
import { updateBarDaySlotSchema } from '@sc-muiden/shared';

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const parsed = updateBarDaySlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validatiefout.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { starts_at, ends_at, sport, ...rest } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('bar_day_slots')
    .update({
      ...rest,
      starts_at: `${starts_at}:00`,
      ends_at: `${ends_at}:00`,
      sport: sport ?? null,
    })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Bijwerken mislukt.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Day-slot niet gevonden.' }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('bar_day_slots')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('deleted_at', null);

  if (error) return NextResponse.json({ error: 'Verwijderen mislukt.' }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
