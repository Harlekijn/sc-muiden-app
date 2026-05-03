import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.test.local'), override: false });

import { adminClient } from './helpers/admin-client';
import { teardown } from '../../../supabase/seed';

export default async function globalTeardown() {
  console.log('\n[e2e] Cleaning up test users...');

  await teardown(adminClient as unknown as Parameters<typeof teardown>[0]);

  console.log('[e2e] Teardown complete.\n');
}
