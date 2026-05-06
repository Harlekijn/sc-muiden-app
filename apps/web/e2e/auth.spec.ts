import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the SC Muiden heading and Beheeromgeving subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SC Muiden' })).toBeVisible();
    await expect(page.getByText('Beheeromgeving')).toBeVisible();
  });

  test('shows Dutch field validation errors on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText('Ongeldig e-mailadres')).toBeVisible();
  });

  test('shows Dutch validation error for invalid email format', async ({ page }) => {
    await page.fill('#email', 'geen-email');
    await page.fill('#password', 'wachtwoord');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Ongeldig e-mailadres')).toBeVisible();
  });

  test('shows Dutch validation error when password is too short', async ({ page }) => {
    await page.fill('#email', 'test@scmuiden.nl');
    await page.fill('#password', 'abc');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Wachtwoord minimaal 6 tekens')).toBeVisible();
  });

  test('shows Dutch error banner for wrong credentials', async ({ page }) => {
    await page.fill('#email', 'onbekend@scmuiden.nl');
    await page.fill('#password', 'VerkeerWachtwoord123');
    await page.click('button[type="submit"]');
    await expect(
      page.getByText('E-mailadres of wachtwoord onjuist')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('does not show raw Supabase error messages', async ({ page }) => {
    await page.fill('#email', 'onbekend@scmuiden.nl');
    await page.fill('#password', 'VerkeerWachtwoord123');
    await page.click('button[type="submit"]');
    // Wait for any error state
    await page.waitForTimeout(3_000);
    await expect(page.getByText('Invalid login credentials')).not.toBeVisible();
  });
});
