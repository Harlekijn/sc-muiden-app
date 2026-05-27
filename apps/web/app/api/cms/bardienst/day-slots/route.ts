import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { createBarDaySlotSchema } from '@sc-muiden/shared';

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

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');

  const admin = createSupabaseAdminClient();
  let query = admin
    .from('bar_day_slots')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: true });

  if (season) query = query.eq('season', season);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Ophalen mislukt.' }, { status: 500 });

  return NextResponse.json(data);
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

  const parsed = createBarDaySlotSchema.safeParse(body);
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
    .insert({
      ...rest,
      starts_at: `${starts_at}:00`,
      ends_at: `${ends_at}:00`,
      sport: sport ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
