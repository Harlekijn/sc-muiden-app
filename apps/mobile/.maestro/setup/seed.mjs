// Seed Maestro E2E test data into local Supabase.
// Run via: pnpm test:maestro:seed  (from apps/mobile/)
//
// Creates:
//   1. members row for MAESTRO_TEST_LID_EMAIL   + auth user (for login/logout/family flows)
//   2. members row for MAESTRO_TEST_REGISTER_EMAIL  NO auth user (for register-gate-success flow)
//
// Idempotent: deletes existing test records first, then recreates them.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('[maestro-seed] Missing SUPABASE_URL or SUPABASE_SECRET_KEY.');
  console.error('[maestro-seed] Copy apps/mobile/.maestro/.env.example to .maestro/.env and fill in values.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LID_EMAIL = process.env.MAESTRO_TEST_LID_EMAIL ?? 'maestro-testlid@e2e.scmuiden.test';
const REGISTER_EMAIL = process.env.MAESTRO_TEST_REGISTER_EMAIL ?? 'maestro-testregister@e2e.scmuiden.test';
const PASSWORD = process.env.MAESTRO_TEST_PASSWORD ?? 'MaestroTestWachtwoord123!';

async function deleteAuthUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((u) => u.email === email);
  if (user) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`deleteUser(${email}): ${JSON.stringify(error)}`);
    console.log(`[maestro-seed] Deleted auth user: ${email}`);
  }
}

async function deleteMember(email) {
  const { error } = await admin.from('members').delete().eq('email', email);
  if (error) throw new Error(`deleteMember(${email}): ${JSON.stringify(error)}`);
}

async function createMember(fields) {
  const { error } = await admin.from('members').insert(fields);
  if (error) throw new Error(`createMember(${fields.email}): ${JSON.stringify(error)}`);
}

async function main() {
  console.log('[maestro-seed] Cleaning up existing test data...');

  // Auth users must be deleted first so profile cascade + member FK is clean.
  await deleteAuthUser(LID_EMAIL);
  await deleteAuthUser(REGISTER_EMAIL);
  await deleteMember(LID_EMAIL);
  await deleteMember(REGISTER_EMAIL);

  console.log('[maestro-seed] Creating test members...');

  await createMember({
    first_name: 'Test',
    last_name: 'Lid',
    email: LID_EMAIL,
    role: 'lid',
    sport: ['voetbal'],
  });

  // No auth user — the register-gate-success flow will call signUp with this email.
  await createMember({
    first_name: 'Register',
    last_name: 'Test',
    email: REGISTER_EMAIL,
    role: 'lid',
    sport: ['voetbal'],
  });

  console.log('[maestro-seed] Creating lid auth user...');

  // handle_new_user trigger auto-creates profiles row and links member_id via email.
  const { error: authError } = await admin.auth.admin.createUser({
    email: LID_EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: 'Test Lid' },
  });
  if (authError) throw new Error(`createUser(${LID_EMAIL}): ${JSON.stringify(authError)}`);

  console.log('[maestro-seed] Setup complete.');
  console.log(`[maestro-seed]   Lid account:      ${LID_EMAIL} / ${PASSWORD}`);
  console.log(`[maestro-seed]   Register member:  ${REGISTER_EMAIL} (member record only, no auth user)`);
}

main().catch((err) => {
  console.error('[maestro-seed] Fatal:', err.message);
  process.exit(1);
});
