import { test, expect } from '@playwright/test';
import * as path from 'path';

const BEHEERDER_STATE = path.resolve(__dirname, '.auth/beheerder.json');
const LID_STATE = path.resolve(__dirname, '.auth/lid.json');

test.describe('Middleware — unauthenticated access', () => {
  // No storageState: fresh unauthenticated context
  test('GET /dashboard redirects to /login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  test('GET /dashboard/gezinsverzoeken redirects to /login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/dashboard/gezinsverzoeken');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  test('GET /dashboard/leden redirects to /login', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/dashboard/leden');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });
});

test.describe('Role access — beheerder', () => {
  test.use({ storageState: BEHEERDER_STATE });

  test('can access /dashboard and sees sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('SC Muiden')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gezinsverzoeken' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leden' })).toBeVisible();
    // No "Geen toegang" message
    await expect(page.getByText('Geen toegang')).not.toBeVisible();
  });

  test('can access /dashboard/gezinsverzoeken', async ({ page }) => {
    await page.goto('/dashboard/gezinsverzoeken');
    await expect(page.getByRole('heading', { name: 'Gezinsverzoeken' })).toBeVisible();
    // Shows the pending section heading
    await expect(page.getByText('In behandeling')).toBeVisible();
  });

  test('login button on /login redirects to /dashboard when already authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    // Should stay on /dashboard (middleware doesn't redirect authenticated users away)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Role access — lid', () => {
  test.use({ storageState: LID_STATE });

  test('sees "Geen toegang" on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // URL stays on /dashboard (no redirect), but content shows the access denied component
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Geen toegang')).toBeVisible();
    await expect(
      page.getByText('Je account heeft geen beheerdersrechten')
    ).toBeVisible();
  });

  test('sees "Geen toegang" when accessing a sub-page directly', async ({ page }) => {
    await page.goto('/dashboard/gezinsverzoeken');
    await expect(page.getByText('Geen toegang')).toBeVisible();
  });

  test('does not see the sidebar navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Gezinsverzoeken' })).not.toBeVisible();
  });
});
