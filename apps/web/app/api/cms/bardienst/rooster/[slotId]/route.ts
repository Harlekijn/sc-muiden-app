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
  if (!profile || profile.role !== 'beheerder') return null;
  return user;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slotId: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('activities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('bar_day_slot_id', params.slotId)
    .eq('type', 'bardienst')
    .is('deleted_at', null);

  if (error) return NextResponse.json({ error: 'Verwijderen mislukt.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
