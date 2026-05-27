import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { csvImportRowDataSchema } from '@sc-muiden/shared';
import type { CsvImportRow, CsvImportResult } from '@sc-muiden/shared';

// Vertaal Postgres foutcodes naar leesbare Nederlandse meldingen (geen PII).
function dbFoutmelding(code: string | undefined): string {
  if (code === '23505') return 'E-mailadres of ClubBase-ID bestaat al in de database.';
  if (code === '23503') return 'Ongeldige verwijzing (foreign key).';
  if (code === '23514') return 'Waarde voldoet niet aan de validatieregels van de database.';
  if (code === '22001') return 'Een veldwaarde is te lang.';
  return 'Onverwachte databasefout bij opslaan.';
}

export async function POST(req: NextRequest) {
  const authClient = createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
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

  let body: { rows: CsvImportRow[]; selectedConflicts: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  let inserted = 0;
  let updated = 0;
  const failed: CsvImportRow[] = [];

  for (const row of body.rows) {
    try {
      const validated = csvImportRowDataSchema.safeParse(row.data);
      if (!validated.success) {
        const fieldErrors = validated.error.errors.map((e) =>
          `${e.path.join('.') || 'veld'}: ${e.message}`
        );
        console.error(
          `[cms-import] row_index=${row.index} outcome=validation_failed` +
          ` fields=${validated.error.errors.map((e) => e.path.join('.')).join(',')}`
        );
        failed.push({ ...row, errors: fieldErrors });
        continue;
      }
      const safeData = validated.data;

      if (row.status === 'new') {
        const { error } = await admin.from('members').insert({
          first_name: safeData.first_name,
          last_name: safeData.last_name,
          birth_date: safeData.birth_date ?? null,
          email: safeData.email ?? null,
          phone: safeData.phone ?? null,
          sport: safeData.sport ?? [],
          clubbase_id: safeData.clubbase_id ?? null,
          ouder_email_1: safeData.ouder_email_1 ?? null,
          ouder_email_2: safeData.ouder_email_2 ?? null,
          lid_type: safeData.lid_type,
        });
        if (error) {
          console.error(
            `[cms-import] row_index=${row.index} outcome=insert_failed` +
            ` pg_code=${error.code} pg_msg=${error.message}`
          );
          failed.push({ ...row, errors: [dbFoutmelding(error.code)] });
        } else {
          inserted++;
        }
      } else if (row.status === 'conflict' && row.conflictMemberId) {
        const { error } = await admin
          .from('members')
          .update({
            first_name: safeData.first_name,
            last_name: safeData.last_name,
            birth_date: safeData.birth_date ?? null,
            email: safeData.email ?? null,
            phone: safeData.phone ?? null,
            sport: safeData.sport ?? [],
            clubbase_id: safeData.clubbase_id ?? null,
            ouder_email_1: safeData.ouder_email_1 ?? null,
            ouder_email_2: safeData.ouder_email_2 ?? null,
            lid_type: safeData.lid_type,
          })
          .eq('id', row.conflictMemberId);
        if (error) {
          console.error(
            `[cms-import] row_index=${row.index} outcome=update_failed` +
            ` pg_code=${error.code} pg_msg=${error.message}`
          );
          failed.push({ ...row, errors: [dbFoutmelding(error.code)] });
        } else {
          updated++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cms-import] row_index=${row.index} outcome=exception msg=${msg}`);
      failed.push({ ...row, errors: ['Onverwachte fout bij verwerken van deze rij.'] });
    }
  }

  const result: CsvImportResult = { inserted, updated, failed };
  return NextResponse.json(result);
}
