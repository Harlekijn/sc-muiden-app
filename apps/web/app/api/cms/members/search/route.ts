import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';

async function isAdmin() {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return false;

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return !!profile && ['beheerder', 'commissielid'].includes(profile.role);
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ members: [] });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('members')
    .select('id, first_name, last_name, email')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
    .is('deleted_at', null)
    .order('last_name')
    .limit(20);

  if (error) {
    return NextResponse.json({ error: 'Zoeken mislukt.' }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
