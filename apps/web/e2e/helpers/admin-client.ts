import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

if (!SECRET_KEY) {
  throw new Error(
    'SUPABASE_SECRET_KEY is not set. ' +
    'Run `supabase status` and copy the secret key into .env.test.local'
  );
}

export const adminClient = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Constants are defined in supabase/seed.ts — re-exported here for convenience.
export { E2E_BEHEERDER_EMAIL, E2E_LID_EMAIL, E2E_PASSWORD, E2E_CHILD_CLUBBASE_ID } from '../../../../supabase/seed';
