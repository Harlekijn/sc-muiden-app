// Integration tests for POST /api/cms/teams/import/analyse and POST /api/cms/teams/import
//
// Prerequisites: supabase start, supabase db reset, pnpm dev running at :3000
// Run: pnpm test:e2e --grep "teams-import"
//
// Auth context:
//   - beheerder storageState  → beheerder.json (created in globalSetup)
//   - lid storageState        → lid.json
//   Unauthenticated requests → no storageState (fresh context)

import { test, expect, APIRequestContext } from '@playwright/test';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const BEHEERDER_STATE = path.resolve(__dirname, '../.auth/beheerder.json');
const LID_STATE = path.resolve(__dirname, '../.auth/lid.json');
const COMMISSIELID_STATE = path.resolve(__dirname, '../.auth/commissielid.json');

const ANALYSE_URL = '/api/cms/teams/import/analyse';
const IMPORT_URL = '/api/cms/teams/import';

// Stable federation IDs used in this suite — prefixed to avoid collision with seed data.
const TEST_FED_ID_NEW = 'e2e-import-new-001';
const TEST_FED_ID_CONFLICT = 'e2e-import-conflict-001';
const TEST_FED_ID_DELETED = 'e2e-import-deleted-001';
const TEST_FED_ID_COMPOSITE = 'e2e-import-composite-001';

// Supabase admin client — used for per-test setup and teardown.
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

function makeAdminClient() {
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cleanupTestTeams() {
  const admin = makeAdminClient();
  await admin
    .from('teams')
    .delete()
    .in('federation_team_id', [
      TEST_FED_ID_NEW,
      TEST_FED_ID_CONFLICT,
      TEST_FED_ID_DELETED,
      TEST_FED_ID_COMPOSITE,
    ]);
  // Also clean up by name for teams without federation_team_id
  await admin
    .from('teams')
    .delete()
    .eq('name', 'E2E Composietteam')
    .eq('sport', 'hockey');
}

async function seedActiveConflictTeam() {
  const admin = makeAdminClient();
  const { error } = await admin.from('teams').insert({
    name: 'E2E Conflict Actief',
    sport: 'voetbal',
    season: '2025/2026',
    federation_team_id: TEST_FED_ID_CONFLICT,
  });
  if (error) throw new Error(`seed conflict team: ${error.message}`);
}

async function seedSoftDeletedTeam() {
  const admin = makeAdminClient();
  const { error } = await admin.from('teams').insert({
    name: 'E2E Verwijderd Team',
    sport: 'voetbal',
    season: '2025/2026',
    federation_team_id: TEST_FED_ID_DELETED,
    deleted_at: new Date().toISOString(),
  });
  if (error) throw new Error(`seed soft-deleted team: ${error.message}`);
}

async function seedCompositeConflictTeam() {
  const admin = makeAdminClient();
  const { error } = await admin.from('teams').insert({
    name: 'E2E Composietteam',
    sport: 'hockey',
    season: '2024/2025',
    federation_team_id: TEST_FED_ID_COMPOSITE,
  });
  if (error) throw new Error(`seed composite team: ${error.message}`);
}

// Performs a POST request using the given request context (carries auth cookies).
async function post(request: APIRequestContext, url: string, body: unknown) {
  return request.post(url, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Suite setup / teardown ────────────────────────────────────────────────────

test.beforeAll(async () => {
  await cleanupTestTeams();
});

test.afterAll(async () => {
  await cleanupTestTeams();
});

// ── Analyse — auth guard ──────────────────────────────────────────────────────

test.describe('POST /api/cms/teams/import/analyse — auth', () => {
  test('unauthenticated returns 401', async ({ browser }) => {
    const ctx = await browser.newContext(); // no storageState
    const response = await ctx.request.post(ANALYSE_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(401);
    await ctx.close();
  });

  test('lid role returns 403', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: LID_STATE });
    const response = await ctx.request.post(ANALYSE_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(403);
    await ctx.close();
  });

  test('commissielid role returns 403', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: COMMISSIELID_STATE });
    const response = await ctx.request.post(ANALYSE_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(403);
    await ctx.close();
  });
});

// ── Analyse — happy paths ─────────────────────────────────────────────────────

test.describe('POST /api/cms/teams/import/analyse — beheerder', () => {
  test.use({ storageState: BEHEERDER_STATE });

  test('new team row → status new', async ({ request }) => {
    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'E2E Nieuw Team',
          sport: 'voetbal',
          season: '2025/2026',
          federation_team_id: TEST_FED_ID_NEW,
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{ status: string }>;
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe('new');
  });

  test('federation_team_id conflict with active team → status conflict', async ({ request }) => {
    await seedActiveConflictTeam();

    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'Andere naam',
          sport: 'voetbal',
          season: '2025/2026',
          federation_team_id: TEST_FED_ID_CONFLICT,
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{
      status: string;
      conflictTeamId: string;
      conflictReason: string;
    }>;
    expect(body[0].status).toBe('conflict');
    expect(body[0].conflictTeamId).toBeTruthy();
    expect(body[0].conflictReason).toContain(TEST_FED_ID_CONFLICT);
  });

  test('federation_team_id conflict with soft-deleted team → status conflict with revival note', async ({ request }) => {
    await seedSoftDeletedTeam();

    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'Terugzetten Team',
          sport: 'voetbal',
          season: '2025/2026',
          federation_team_id: TEST_FED_ID_DELETED,
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{
      status: string;
      conflictReason: string;
    }>;
    expect(body[0].status).toBe('conflict');
    expect(body[0].conflictReason).toContain('hersteld');
  });

  test('composite conflict (name + sport + season) → status conflict', async ({ request }) => {
    await seedCompositeConflictTeam();

    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          // No federation_team_id — forces composite detection
          name: 'E2E Composietteam',
          sport: 'hockey',
          season: '2024/2025',
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{
      status: string;
      conflictTeamId: string;
    }>;
    expect(body[0].status).toBe('conflict');
    expect(body[0].conflictTeamId).toBeTruthy();
  });

  test('invalid sport → status invalid with Dutch error', async ({ request }) => {
    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'Ongeldig team',
          sport: 'baseball',
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{
      status: string;
      errors: string[];
    }>;
    expect(body[0].status).toBe('invalid');
    expect(body[0].errors).toContain('Sport is verplicht (voetbal of hockey)');
  });

  test('sport with capital letter is normalised before validation → status new', async ({ request }) => {
    // The analyse endpoint lowercases the sport before Zod validation.
    const resp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'E2E Hoofdletter Sport',
          sport: 'Voetbal',
          federation_team_id: 'e2e-cap-sport-999',
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{ status: string }>;
    expect(body[0].status).toBe('new');
  });

  test('missing name → status invalid with Dutch error', async ({ request }) => {
    const resp = await post(request, ANALYSE_URL, {
      rows: [{ name: '', sport: 'voetbal' }],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as Array<{
      status: string;
      errors: string[];
    }>;
    expect(body[0].status).toBe('invalid');
    expect(body[0].errors).toContain('Teamnaam is verplicht');
  });
});

// ── Import — auth guard ───────────────────────────────────────────────────────

test.describe('POST /api/cms/teams/import — auth', () => {
  test('unauthenticated returns 401', async ({ browser }) => {
    const ctx = await browser.newContext();
    const response = await ctx.request.post(IMPORT_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(401);
    await ctx.close();
  });

  test('lid role returns 403', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: LID_STATE });
    const response = await ctx.request.post(IMPORT_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(403);
    await ctx.close();
  });

  test('commissielid role returns 403', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: COMMISSIELID_STATE });
    const response = await ctx.request.post(IMPORT_URL, {
      data: { rows: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(403);
    await ctx.close();
  });
});

// ── Import — happy paths ──────────────────────────────────────────────────────

test.describe('POST /api/cms/teams/import — beheerder', () => {
  test.use({ storageState: BEHEERDER_STATE });

  test.afterEach(async () => {
    await cleanupTestTeams();
  });

  test('inserts new row → inserted: 1, updated: 0, failed: []', async ({ request }) => {
    const resp = await post(request, IMPORT_URL, {
      rows: [
        {
          index: 0,
          data: {
            name: 'E2E Import Nieuw',
            sport: 'voetbal',
            season: '2025/2026',
            federation_team_id: TEST_FED_ID_NEW,
          },
          status: 'new',
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { inserted: number; updated: number; failed: unknown[] };
    expect(body.inserted).toBe(1);
    expect(body.updated).toBe(0);
    expect(body.failed).toHaveLength(0);
  });

  test('updates conflict row → updated: 1, inserted: 0', async ({ request }) => {
    await seedActiveConflictTeam();

    // First analyse to get conflictTeamId
    const analyseResp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'E2E Conflict Actief — Bijgewerkt',
          sport: 'voetbal',
          season: '2025/2026',
          federation_team_id: TEST_FED_ID_CONFLICT,
        },
      ],
    });
    const analysed = await analyseResp.json() as Array<{
      index: number;
      data: unknown;
      status: string;
      conflictTeamId: string;
    }>;
    expect(analysed[0].status).toBe('conflict');

    const resp = await post(request, IMPORT_URL, {
      rows: [
        {
          index: 0,
          data: {
            name: 'E2E Conflict Actief — Bijgewerkt',
            sport: 'voetbal',
            season: '2025/2026',
            federation_team_id: TEST_FED_ID_CONFLICT,
          },
          status: 'conflict',
          conflictTeamId: analysed[0].conflictTeamId,
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { inserted: number; updated: number; failed: unknown[] };
    expect(body.inserted).toBe(0);
    expect(body.updated).toBe(1);
    expect(body.failed).toHaveLength(0);
  });

  test('revives soft-deleted team → deleted_at becomes null', async ({ request }) => {
    await seedSoftDeletedTeam();

    // Verify team is soft-deleted
    const admin = makeAdminClient();
    const { data: beforeRow } = await admin
      .from('teams')
      .select('id, deleted_at')
      .eq('federation_team_id', TEST_FED_ID_DELETED)
      .single();
    expect(beforeRow).toBeTruthy();
    expect(beforeRow!.deleted_at).not.toBeNull();

    // Analyse to get conflictTeamId
    const analyseResp = await post(request, ANALYSE_URL, {
      rows: [
        {
          name: 'E2E Verwijderd Team',
          sport: 'voetbal',
          season: '2025/2026',
          federation_team_id: TEST_FED_ID_DELETED,
        },
      ],
    });
    const analysed = await analyseResp.json() as Array<{
      status: string;
      conflictTeamId: string;
    }>;

    const resp = await post(request, IMPORT_URL, {
      rows: [
        {
          index: 0,
          data: {
            name: 'E2E Verwijderd Team Hersteld',
            sport: 'voetbal',
            season: '2025/2026',
            federation_team_id: TEST_FED_ID_DELETED,
          },
          status: 'conflict',
          conflictTeamId: analysed[0].conflictTeamId,
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { inserted: number; updated: number };
    expect(body.updated).toBe(1);

    // Verify team is no longer soft-deleted
    const { data: afterRow } = await admin
      .from('teams')
      .select('deleted_at')
      .eq('federation_team_id', TEST_FED_ID_DELETED)
      .single();
    expect(afterRow!.deleted_at).toBeNull();
  });

  test('unselected conflict (no conflictTeamId) is skipped silently → 0 updates', async ({ request }) => {
    const resp = await post(request, IMPORT_URL, {
      rows: [
        {
          index: 0,
          data: {
            name: 'Niet geselecteerd',
            sport: 'voetbal',
          },
          status: 'conflict',
          // conflictTeamId deliberately omitted
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { inserted: number; updated: number; failed: unknown[] };
    expect(body.inserted).toBe(0);
    expect(body.updated).toBe(0);
    expect(body.failed).toHaveLength(0);
  });

  test('per-row isolation: one failure does not roll back other rows', async ({ request }) => {
    // Row 0: valid new team
    // Row 1: invalid data (empty name) — will fail re-validation
    const resp = await post(request, IMPORT_URL, {
      rows: [
        {
          index: 0,
          data: {
            name: 'E2E Import Geslaagd',
            sport: 'voetbal',
            federation_team_id: TEST_FED_ID_NEW,
          },
          status: 'new',
        },
        {
          index: 1,
          data: {
            name: '',
            sport: 'voetbal',
          },
          status: 'new',
        },
      ],
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as {
      inserted: number;
      updated: number;
      failed: Array<{ index: number }>;
    };
    expect(body.inserted).toBe(1);
    expect(body.failed).toHaveLength(1);
    expect(body.failed[0].index).toBe(1);
  });
});
