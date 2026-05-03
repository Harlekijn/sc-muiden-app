import * as path from 'path';
import * as dotenv from 'dotenv';
import { chromium } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '../.env.test.local'), override: false });

import { adminClient, E2E_BEHEERDER_EMAIL, E2E_LID_EMAIL, E2E_PASSWORD } from './helpers/admin-client';
import { seed } from '../../../supabase/seed';

const BASE_URL = 'http://localhost:3000';
export const BEHEERDER_STATE = path.resolve(__dirname, '.auth/beheerder.json');
export const LID_STATE = path.resolve(__dirname, '.auth/lid.json');

async function saveStorageState(email: string, outPath: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.fill('#email', email);
  await page.fill('#password', E2E_PASSWORD);
  await page.click('button[type="submit"]');

  // Both roles land on /dashboard (beheerder sees content, lid sees "Geen toegang")
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15_000 });

  await context.storageState({ path: outPath });
  await browser.close();
}

export default async function globalSetup() {
  console.log('\n[e2e] Seeding test users...');

  await seed(adminClient as unknown as Parameters<typeof seed>[0]);

  console.log('[e2e] Saving storageState for beheerder...');
  await saveStorageState(E2E_BEHEERDER_EMAIL, BEHEERDER_STATE);

  console.log('[e2e] Saving storageState for lid...');
  await saveStorageState(E2E_LID_EMAIL, LID_STATE);

  console.log('[e2e] Setup complete.\n');
}
