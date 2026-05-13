import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../../lib/supabase-admin';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { csvImportRowDataSchema, type CsvImportRow } from '@sc-muiden/shared';

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

  let body: { rows: Record<string, string>[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const result: CsvImportRow[] = [];

  for (let i = 0; i < body.rows.length; i++) {
    const rawRow = body.rows[i];
    const parsed = csvImportRowDataSchema.safeParse({
      first_name: rawRow.first_name ?? '',
      last_name: rawRow.last_name ?? '',
      birth_date: rawRow.birth_date || null,
      email: rawRow.email || null,
      phone: rawRow.phone || null,
      sport: rawRow.sport
        ? rawRow.sport.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
        : [],
      clubbase_id: rawRow.clubbase_id || null,
    });

    if (!parsed.success) {
      result.push({
        index: i,
        data: rawRow as Partial<import('@sc-muiden/shared').Member>,
        status: 'invalid',
        errors: parsed.error.errors.map((e) => e.message),
      });
      continue;
    }

    const data = parsed.data;

    // Duplicate detection: match on email OR (first_name + last_name + birth_date)
    let conflictId: string | undefined;
    let conflictReason: string | undefined;

    if (data.email) {
      const { data: emailMatch } = await admin
        .from('members')
        .select('id')
        .eq('email', data.email)
        .is('deleted_at', null)
        .limit(1)
        .single();
      if (emailMatch) {
        conflictId = emailMatch.id;
        conflictReason = `Zelfde e-mailadres (${data.email})`;
      }
    }

    if (!conflictId && data.first_name && data.last_name && data.birth_date) {
      const { data: nameMatch } = await admin
        .from('members')
        .select('id')
        .eq('first_name', data.first_name)
        .eq('last_name', data.last_name)
        .eq('birth_date', data.birth_date)
        .is('deleted_at', null)
        .limit(1)
        .single();
      if (nameMatch) {
        conflictId = nameMatch.id;
        conflictReason = `Zelfde naam en geboortedatum`;
      }
    }

    result.push({
      index: i,
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        sport: data.sport,
        clubbase_id: data.clubbase_id ?? null,
      },
      status: conflictId ? 'conflict' : 'new',
      conflictMemberId: conflictId,
      conflictReason,
    });
  }

  return NextResponse.json(result);
}
