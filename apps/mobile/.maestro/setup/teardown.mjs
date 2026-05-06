// Remove Maestro E2E test data from local Supabase.
// Run via: pnpm test:maestro:teardown  (from apps/mobile/)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('[maestro-teardown] Missing SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LID_EMAIL = process.env.MAESTRO_TEST_LID_EMAIL ?? 'maestro-testlid@e2e.scmuiden.test';
const REGISTER_EMAIL = process.env.MAESTRO_TEST_REGISTER_EMAIL ?? 'maestro-testregister@e2e.scmuiden.test';

async function deleteAuthUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((u) => u.email === email);
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
    console.log(`[maestro-teardown] Deleted auth user: ${email}`);
  }
}

async function main() {
  console.log('[maestro-teardown] Cleaning up test users...');

  // REGISTER_EMAIL may have had an auth user created by the register-gate-success flow.
  await deleteAuthUser(LID_EMAIL);
  await deleteAuthUser(REGISTER_EMAIL);

  await admin.from('members').delete().eq('email', LID_EMAIL);
  await admin.from('members').delete().eq('email', REGISTER_EMAIL);

  console.log('[maestro-teardown] Teardown complete.');
}

main().catch((err) => {
  console.error('[maestro-teardown] Fatal:', err.message);
  process.exit(1);
});
