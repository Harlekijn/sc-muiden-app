import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin';

const ALLOWED_SPORTS = ['voetbal', 'hockey'] as const;
type Sport = (typeof ALLOWED_SPORTS)[number];

const ALLOWED_ROLES = ['beheerder', 'commissielid'];

export async function POST(
  _req: NextRequest,
  { params }: { params: { sport: string } }
) {
  const sport = params.sport as Sport;

  if (!ALLOWED_SPORTS.includes(sport)) {
    return NextResponse.json(
      { ok: false, message: 'Onbekende sport. Gebruik "voetbal" of "hockey".' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: 'Niet ingelogd.' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json(
      { ok: false, message: 'Geen toegang. Alleen beheerders kunnen de sync starten.' },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.functions.invoke('federation-sync', {
    body: { sport, triggered_by: 'manual' },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: 'Synchronisatie mislukt. Controleer de verbinding en probeer het opnieuw.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sport, lastSyncAt: new Date().toISOString() });
}
