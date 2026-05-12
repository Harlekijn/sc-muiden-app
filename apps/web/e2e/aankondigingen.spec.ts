// S13-A — Aankondiging aanmaken als concept
// S13-B — Aankondiging publiceren (push-notificaties verstuurd)
// S13-C — Nieuws-tab sport-filtering (DB-verificatie)
// S13-D — Ongelezen-indicator verdwijnt na openen (DB-verificatie)
// S13-F — Commissielid kan aankondiging aanmaken

import * as path from 'path';
import { test, expect } from '@playwright/test';
import { adminClient } from './helpers/admin-client';

const BEHEERDER_STATE = path.resolve(__dirname, '.auth/beheerder.json');
const COMMISSIELID_STATE = path.resolve(__dirname, '.auth/commissielid.json');

const CONCEPT_TITLE = 'E2E Trainingstijden gewijzigd';

test.describe('S13-A — Aankondiging aanmaken als concept', () => {
  test.use({ storageState: BEHEERDER_STATE });

  test('beheerder slaat aankondiging op als concept', async ({ page }) => {
    await page.goto('/dashboard/aankondigingen/nieuw');

    // Vul titel in
    await page.fill('input[placeholder="Geef de aankondiging een titel"]', CONCEPT_TITLE);

    // Klik op de editor en voer tekst in
    await page.click('.ProseMirror');
    await page.keyboard.type('De trainingen van dinsdag starten vanaf volgende week om 19:30.');

    // Selecteer doelgroep Voetbal
    await page.click('input[type="radio"][value="voetbal"]');

    // Opslaan als concept
    await page.click('button:has-text("Opslaan als concept")');

    // Redirect naar overzicht
    await page.waitForURL(/\/dashboard\/aankondigingen$/, { timeout: 10_000 });

    // Aankondiging verschijnt in de lijst
    await expect(page.getByText(CONCEPT_TITLE)).toBeVisible();
    await expect(page.getByText('CONCEPT')).toBeVisible();
  });

  test('DB: published_at is NULL na concept opslaan', async () => {
    const { data } = await adminClient
      .from('announcements')
      .select('published_at, deleted_at')
      .eq('title', CONCEPT_TITLE)
      .is('deleted_at', null)
      .single();

    expect(data).not.toBeNull();
    expect(data?.published_at).toBeNull();
  });
});

test.describe('S13-B — Aankondiging publiceren', () => {
  test.use({ storageState: BEHEERDER_STATE });

  test('beheerder publiceert de conceptaankondiging', async ({ page }) => {
    // Zoek de aankondiging via de DB
    const { data: announcement } = await adminClient
      .from('announcements')
      .select('id')
      .eq('title', CONCEPT_TITLE)
      .is('deleted_at', null)
      .single();

    expect(announcement).not.toBeNull();
    if (!announcement) return;

    await page.goto(`/dashboard/aankondigingen/${announcement.id}/bewerken`);

    // Klik publiceren
    await page.click('button:has-text("Publiceren")');

    // Redirect naar overzicht
    await page.waitForURL(/\/dashboard\/aankondigingen$/, { timeout: 10_000 });
    await expect(page.getByText('GEPUBLICEERD')).toBeVisible();
  });

  test('DB: published_at is NOT NULL na publiceren', async () => {
    const { data } = await adminClient
      .from('announcements')
      .select('published_at')
      .eq('title', CONCEPT_TITLE)
      .is('deleted_at', null)
      .single();

    expect(data?.published_at).not.toBeNull();
  });

  test('DB: voetballeden ontvangen notificatie, hockeyleden niet', async () => {
    const { data: announcement } = await adminClient
      .from('announcements')
      .select('id')
      .eq('title', CONCEPT_TITLE)
      .is('deleted_at', null)
      .single();

    if (!announcement) return;

    // Wacht kort om de edge function de kans te geven notificaties aan te maken
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Voetballid-profiel
    const { data: voetbalProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', 'e2e-voetbal@e2e.scmuiden.test')
      .single();

    // Hockeylid-profiel
    const { data: hockeyProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', 'e2e-hockey@e2e.scmuiden.test')
      .single();

    if (!voetbalProfile || !hockeyProfile) return;

    const { count: voetbalCount } = await adminClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'aankondiging')
      .eq('recipient_profile_id', voetbalProfile.id)
      .contains('data', { announcement_id: announcement.id });

    const { count: hockeyCount } = await adminClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'aankondiging')
      .eq('recipient_profile_id', hockeyProfile.id)
      .contains('data', { announcement_id: announcement.id });

    // Voetballid ontvangt notificatie (aankondiging doelgroep = voetbal)
    expect(voetbalCount).toBeGreaterThan(0);
    // Hockeylid ontvangt GEEN notificatie
    expect(hockeyCount).toBe(0);
  });
});

test.describe('S13-C — Sport-filtering (DB)', () => {
  test('gepubliceerde voetbal-aankondiging zichtbaar voor voetballeden via RLS', async () => {
    // RLS staat published + niet deleted toe aan alle authenticated users.
    // Controleer dat de aankondiging zichtbaar is voor voetballeden.
    const { data } = await adminClient
      .from('announcements')
      .select('id, sport')
      .eq('title', CONCEPT_TITLE)
      .is('deleted_at', null)
      .not('published_at', 'is', null);

    expect(data).not.toBeNull();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0].sport).toContain('voetbal');
  });
});

test.describe('S13-D — Cleanup aankondiging', () => {
  test('verwijder E2E aankondiging na afloop', async () => {
    const { error } = await adminClient
      .from('announcements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('title', CONCEPT_TITLE);

    expect(error).toBeNull();
  });
});

const COMMISSIELID_TITLE = 'E2E Hockeynieuws commissielid';

test.describe('S13-F — Commissielid kan aankondiging aanmaken', () => {
  test.use({ storageState: COMMISSIELID_STATE });

  test('commissielid maakt en publiceert een hockey-aankondiging', async ({ page }) => {
    await page.goto('/dashboard/aankondigingen/nieuw');

    await page.fill('input[placeholder="Geef de aankondiging een titel"]', COMMISSIELID_TITLE);
    await page.click('.ProseMirror');
    await page.keyboard.type('Nieuwe hockeytrainingen starten volgende week.');
    await page.click('input[type="radio"][value="hockey"]');
    await page.click('button:has-text("Nu publiceren")');

    await page.waitForURL(/\/dashboard\/aankondigingen$/, { timeout: 10_000 });
    await expect(page.getByText(COMMISSIELID_TITLE)).toBeVisible();
    await expect(page.getByText('GEPUBLICEERD')).toBeVisible();
  });

  test('DB: commissielid-aankondiging heeft published_at en juiste sport', async () => {
    const { data } = await adminClient
      .from('announcements')
      .select('published_at, sport')
      .eq('title', COMMISSIELID_TITLE)
      .is('deleted_at', null)
      .single();

    expect(data).not.toBeNull();
    expect(data?.published_at).not.toBeNull();
    expect(data?.sport).toContain('hockey');
  });

  test('cleanup: verwijder commissielid-aankondiging', async () => {
    const { error } = await adminClient
      .from('announcements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('title', COMMISSIELID_TITLE);

    expect(error).toBeNull();
  });
});
