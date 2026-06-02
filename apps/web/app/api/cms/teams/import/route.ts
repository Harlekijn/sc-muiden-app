import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { csvImportTeamRowDataSchema } from '@sc-muiden/shared';
import type { CsvImportTeamRow, CsvImportTeamResult } from '@sc-muiden/shared';

// Vertaal Postgres foutcodes naar leesbare Nederlandse meldingen (geen PII).
function dbFoutmelding(code: string | undefined): string {
  if (code === '23505') return 'Teamnaam of federatie-ID bestaat al in de database.';
  if (code === '23503') return 'Ongeldige verwijzing (foreign key).';
  if (code === '23514') return 'Waarde voldoet niet aan de validatieregels van de database.';
  if (code === '22001') return 'Een veldwaarde is te lang.';
  return 'Onverwachte databasefout bij opslaan.';
}

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
  let body: { rows: CsvImportTeamRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  let inserted = 0;
  let updated = 0;
  const failed: CsvImportTeamRow[] = [];

  for (const row of body.rows) {
    try {
      // Re-validate each row as a safety net against tampered payloads.
      const validated = csvImportTeamRowDataSchema.safeParse(row.data);
      if (!validated.success) {
        const fieldErrors = validated.error.errors.map(
          (e) => `${e.path.join('.') || 'veld'}: ${e.message}`,
        );
        console.error(
          `[cms-teams-import] row_index=${row.index} outcome=validation_failed` +
            ` fields=${validated.error.errors.map((e) => e.path.join('.')).join(',')}`,
        );
        failed.push({ ...row, errors: fieldErrors });
        continue;
      }

      const safeData = validated.data;

      if (row.status === 'new') {
        const { error } = await admin.from('teams').insert({
          name: safeData.name,
          sport: safeData.sport,
          age_category: safeData.age_category ?? null,
          season: safeData.season ?? null,
          federation_team_id: safeData.federation_team_id ?? null,
          deleted_at: null,
        });

        if (error) {
          console.error(
            `[cms-teams-import] row_index=${row.index} outcome=insert_failed` +
              ` pg_code=${error.code} pg_msg=${error.message}`,
          );
          failed.push({ ...row, errors: [dbFoutmelding(error.code)] });
        } else {
          inserted++;
        }
      } else if (row.status === 'conflict' && row.conflictTeamId) {
        const { error } = await admin
          .from('teams')
          .update({
            name: safeData.name,
            sport: safeData.sport,
            age_category: safeData.age_category ?? null,
            season: safeData.season ?? null,
            federation_team_id: safeData.federation_team_id ?? null,
            deleted_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.conflictTeamId);

        if (error) {
          console.error(
            `[cms-teams-import] row_index=${row.index} outcome=update_failed` +
              ` pg_code=${error.code} pg_msg=${error.message}`,
          );
          failed.push({ ...row, errors: [dbFoutmelding(error.code)] });
        } else {
          updated++;
        }
      }
      // Rows with status='invalid' or status='conflict' without conflictTeamId are skipped silently.
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cms-teams-import] row_index=${row.index} outcome=exception msg=${msg}`);
      failed.push({ ...row, errors: ['Onverwachte fout bij verwerken van deze rij.'] });
    }
  }

  const result: CsvImportTeamResult = { inserted, updated, failed };
  return NextResponse.json(result);
}
