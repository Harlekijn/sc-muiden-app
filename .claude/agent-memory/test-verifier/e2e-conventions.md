---
name: e2e-conventions
description: Playwright E2E setup: storageState paths, admin client, seed patterns, browser fixture for unauthenticated tests
metadata:
  type: project
---

## E2E conventions for apps/web/e2e/

- **Auth state files** live in `apps/web/e2e/.auth/` — created by `global-setup.ts` before suite runs.
  - `beheerder.json` — created with `E2E_BEHEERDER_EMAIL`
  - `lid.json` — created with `E2E_LID_EMAIL`
  - `commissielid.json` — created with `E2E_COMMISSIELID_EMAIL`
- **Admin client** is imported from `./helpers/admin-client` (re-exports from `supabase/seed.ts`). For per-file admin access, call `createClient(SUPABASE_URL, SECRET_KEY)` directly after loading `.env.test.local` with dotenv.
- **Unauthenticated tests** use `{ browser }` fixture: `const ctx = await browser.newContext(); const page = await ctx.newPage();` — do not pass storageState.
- **Role-scoped describes** use `test.use({ storageState: PATH_CONSTANT })` inside the describe block.
- **Seed pattern** — `supabase/seed.ts` exports `seed()` and `teardown()`. Tests that need extra rows seed in `beforeAll`, tear down in `afterAll`. Use stable identifier constants (not UUIDs) to match for cleanup.
- **Test data cleanup** — always clean up by a stable unique column (`federation_team_id`, `name IN [...]`, `email`) rather than UUIDs because UUIDs are not known at write time.
- **DB state assertions** — use `makeAdmin()` (service-role client) inside the test body to query the DB directly. Never hard-code UUIDs.
- **page.request.post** sends requests with the page's current cookie context (auth cookies follow from storageState).

**Why:** Project uses real local Supabase (no mocking). Tests hit the same stack as production.

**How to apply:** All new E2E tests follow this same pattern. Never mock Supabase in E2E tests.
