// Standalone seed runner — run from apps/web/:
//   npx tsx scripts/seed.ts
//   (SUPABASE_URL and SUPABASE_SECRET_KEY must be set in env / .env.test.local)

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.test.local'), override: false });

import { createClient } from '@supabase/supabase-js';
import { seed, teardown, E2E_BEHEERDER_EMAIL, E2E_LID_EMAIL } from '../../../supabase/seed';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SECRET_KEY ?? '';

if (!url || !key) {
  console.error('[seed] SUPABASE_URL and SUPABASE_SECRET_KEY must be set in env.');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const command = process.argv[2] ?? 'seed';

if (command === 'teardown') {
  teardown(admin as unknown as Parameters<typeof teardown>[0])
    .then(() => console.log('[seed] Teardown complete.'))
    .catch((err: Error) => { console.error('[seed] Error:', err.message); process.exit(1); });
} else {
  seed(admin as unknown as Parameters<typeof seed>[0])
    .then((result) => {
      console.log('[seed] Done.');
      console.log(`[seed]   beheerder  → member ${result.beheerderMemberId}  (${E2E_BEHEERDER_EMAIL})`);
      console.log(`[seed]   lid        → member ${result.lidMemberId}  (${E2E_LID_EMAIL})`);
      console.log(`[seed]   kindlid    → member ${result.childMemberId}  (no email)`);
      console.log(`[seed]   family link → ${result.familyLinkId}`);
    })
    .catch((err: Error) => { console.error('[seed] Error:', err.message); process.exit(1); });
}
