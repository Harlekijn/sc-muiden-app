import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { E2E_PASSWORD } from './admin-client';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? '';

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'SUPABASE_PUBLISHABLE_KEY is not set. ' +
    'Run `supabase status` and copy the publishable key into .env.test.local'
  );
}

// Returns a Supabase client authenticated as the given user (uses the anon/publishable key).
// This matches what the real app does — RLS applies based on the user's JWT.
export async function signedInClient(email: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: E2E_PASSWORD });
  if (error) throw new Error(`signedInClient(${email}): ${error.message}`);
  return client;
}
