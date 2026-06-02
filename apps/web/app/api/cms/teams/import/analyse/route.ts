import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../../lib/supabase-server';
import { csvImportTeamRowDataSchema } from '@sc-muiden/shared';
import type { CsvImportTeamRow } from '@sc-muiden/shared';

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const authClient = createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  }

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'beheerder') {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { rows: Record<string, string>[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const result: CsvImportTeamRow[] = [];

  for (let i = 0; i < body.rows.length; i++) {
    const rawRow = body.rows[i];

    // Normalise sport to lowercase before validation (CSV values may be capitalised).
    const parsed = csvImportTeamRowDataSchema.safeParse({
      name: rawRow.name ?? '',
      sport: typeof rawRow.sport === 'string' ? rawRow.sport.toLowerCase() : rawRow.sport,
      age_category: rawRow.age_category || null,
      season: rawRow.season || null,
      federation_team_id: rawRow.federation_team_id || null,
    });

    if (!parsed.success) {
      result.push({
        index: i,
        data: rawRow as Partial<import('@sc-muiden/shared').Team>,
        status: 'invalid',
        errors: parsed.error.errors.map((e) => e.message),
      });
      continue;
    }

    const data = parsed.data;

    // ── Duplicate detection ───────────────────────────────────────────────
    // Step 1: federation_team_id match (includes soft-deleted rows for revival).
    let conflictTeamId: string | undefined;
    let conflictReason: string | undefined;

    if (data.federation_team_id) {
      const { data: fedMatch } = await admin
        .from('teams')
        .select('id, deleted_at')
        .eq('federation_team_id', data.federation_team_id)
        .limit(1)
        .single();

      if (fedMatch) {
        conflictTeamId = fedMatch.id as string;
        const isDeleted = fedMatch.deleted_at !== null;
        conflictReason = isDeleted
          ? `Zelfde federatie-ID (${data.federation_team_id}) — team is eerder verwijderd en wordt hersteld`
          : `Zelfde federatie-ID (${data.federation_team_id})`;
      }
    }

    // Step 2: composite fallback (name + sport + season).
    if (!conflictTeamId) {
      const baseQuery = admin
        .from('teams')
        .select('id, deleted_at')
        .filter('name', 'ilike', data.name)
        .eq('sport', data.sport);

      const compositeQuery = data.season
        ? baseQuery.eq('season', data.season).limit(1).single()
        : baseQuery.is('season', null).limit(1).single();

      const { data: compositeMatch } = await compositeQuery;

      if (compositeMatch) {
        conflictTeamId = compositeMatch.id as string;
        const isDeleted = compositeMatch.deleted_at !== null;
        conflictReason = isDeleted
          ? 'Zelfde naam, sport en seizoen — team is eerder verwijderd en wordt hersteld'
          : 'Zelfde naam, sport en seizoen';
      }
    }

    result.push({
      index: i,
      data: {
        name: data.name,
        sport: data.sport,
        age_category: data.age_category ?? null,
        season: data.season ?? null,
        federation_team_id: data.federation_team_id ?? null,
      },
      status: conflictTeamId ? 'conflict' : 'new',
      conflictTeamId,
      conflictReason,
    });
  }

  return NextResponse.json(result);
}
