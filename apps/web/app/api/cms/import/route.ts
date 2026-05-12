import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { csvImportRowDataSchema } from '@sc-muiden/shared';
import type { CsvImportRow, CsvImportResult } from '@sc-muiden/shared';

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

  if (!profile || !['beheerder', 'commissielid'].includes(profile.role)) {
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
        console.error(`[cms-import] row_index=${row.index} outcome=validation_failed`);
        failed.push(row);
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
          role: safeData.role ?? 'lid',
          clubbase_id: safeData.clubbase_id ?? null,
        });
        if (error) {
          // Log only non-PII outcome
          console.error(`[cms-import] row_index=${row.index} outcome=insert_failed`);
          failed.push(row);
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
            role: safeData.role ?? 'lid',
            clubbase_id: safeData.clubbase_id ?? null,
          })
          .eq('id', row.conflictMemberId);
        if (error) {
          console.error(`[cms-import] row_index=${row.index} outcome=update_failed`);
          failed.push(row);
        } else {
          updated++;
        }
      }
    } catch {
      console.error(`[cms-import] row_index=${row.index} outcome=exception`);
      failed.push(row);
    }
  }

  const result: CsvImportResult = { inserted, updated, failed };
  return NextResponse.json(result);
}
