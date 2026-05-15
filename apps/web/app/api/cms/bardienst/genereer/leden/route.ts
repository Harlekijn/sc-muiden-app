import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';
import { type BarShiftMember } from '@sc-muiden/shared';

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

function seasonBounds(season: string): { start: string; end: string } {
  const [startYear] = season.split('-').map(Number);
  return {
    start: `${startYear}-08-01T00:00:00Z`,
    end: `${startYear + 1}-07-31T23:59:59Z`,
  };
}

const ELIGIBLE_LID_TYPES = ['spelend-lid', 'relatie'];

// GET /api/cms/bardienst/genereer/leden?type=barcommissie|regulier&sport=voetbal|hockey&season=2025-2026&exclude=id1,id2
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'barcommissie' | 'regulier'
  const sport = searchParams.get('sport'); // 'voetbal' | 'hockey' | null
  const season = searchParams.get('season');
  const excludeRaw = searchParams.get('exclude') ?? '';
  const excludeIds = excludeRaw ? excludeRaw.split(',').filter(Boolean) : [];

  if (!type || !season) {
    return NextResponse.json({ error: 'Parameters type en season zijn verplicht.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Fairness scores
  const bounds = seasonBounds(season);
  const { data: assignments } = await admin
    .from('bar_assignments')
    .select('member_id, activities!inner(starts_at, type, deleted_at)')
    .eq('activities.type', 'bardienst')
    .is('activities.deleted_at', null)
    .gte('activities.starts_at', bounds.start)
    .lte('activities.starts_at', bounds.end);

  const fairnessMap = new Map<string, number>();
  for (const a of assignments ?? []) {
    fairnessMap.set(a.member_id, (fairnessMap.get(a.member_id) ?? 0) + 1);
  }

  let query = admin
    .from('members')
    .select('id, first_name, last_name, sport, lid_type, is_barcommissie, is_vrijwilliger')
    .is('deleted_at', null)
    .eq('is_vrijwilliger', false);

  if (type === 'barcommissie') {
    query = query.eq('is_barcommissie', true);
  } else {
    query = query.eq('is_barcommissie', false).in('lid_type', ELIGIBLE_LID_TYPES);
  }

  const { data: members, error } = await query;
  if (error || !members) {
    return NextResponse.json({ error: 'Leden ophalen mislukt.' }, { status: 500 });
  }

  const filtered = members
    .filter((m) => {
      if (sport && !m.sport.includes(sport)) return false;
      if (excludeIds.includes(m.id)) return false;
      return true;
    })
    .sort((a, b) => {
      const scoreDiff = (fairnessMap.get(a.id) ?? 0) - (fairnessMap.get(b.id) ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'nl');
    });

  const result: BarShiftMember[] = filtered.map((m) => ({
    member_id: m.id,
    first_name: m.first_name,
    last_name: m.last_name,
    lid_type: m.lid_type as BarShiftMember['lid_type'],
    is_barcommissie: m.is_barcommissie,
    diensten_count: fairnessMap.get(m.id) ?? 0,
  }));

  return NextResponse.json(result);
}
