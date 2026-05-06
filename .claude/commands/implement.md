# /implement — Feature Implementation

Implement a SC Muiden feature from its design document. Reads `docs/designs/<feature-slug>.md`, executes every item in the implementation plan, writes tests, and verifies with typecheck + test + lint.

## Usage

```
/implement <feature-slug>
/implement wedstrijd-herinnering
```

---

## Instructions

The feature slug is: **$ARGUMENTS**

If $ARGUMENTS is empty, ask: "Welke feature slug wil je implementeren? (bijv. `wedstrijd-herinnering`)" Wait for the answer.

---

### Step 1 — Read design

Read these files before writing any code:
- `docs/designs/<feature-slug>.md` — **primary source of truth for all decisions**
- `CLAUDE.md` — project conventions
- `docs/TESTING_STRATEGY.md` — test priorities and tooling
- `packages/shared/src/types/db.types.ts` — current generated Supabase types
- `supabase/migrations/` — directory listing to understand current schema state

If `docs/designs/<feature-slug>.md` does not exist, stop and output:
"Geen design document gevonden voor `<feature-slug>`. Voer eerst `/design <feature-slug>` uit."

Follow the implementation plan from the design doc exactly. If the design doc is ambiguous on a point, use the most conservative interpretation and leave a `// TODO:` comment.

---

### Step 2 — Database migrations

For each DB change in the design doc's technical design section:

1. Determine the current timestamp: run `date +%Y%m%d%H%M%S`

2. Create `supabase/migrations/<timestamp>_<description>.sql` with:
   - `IF NOT EXISTS` guards on all `CREATE TABLE` statements
   - `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` for every new table
   - All RLS policies stated in the design, with Dutch inline comments on complex ones
   - All indexes stated in the design
   - `updated_at` trigger for every new table: use the existing trigger function if one exists, otherwise create it

3. After writing all migration files, reset and verify:
   ```
   supabase db reset
   ```
   Read the output. If it fails, identify the error, fix the migration file, and run `supabase db reset` again. Do not continue to Step 3 until this succeeds.

4. Regenerate TypeScript types:
   ```
   supabase gen types typescript --local > packages/shared/src/types/db.types.ts
   ```

---

### Step 3 — Shared types and schemas

For each item in the design's "Gedeelde types" section:

1. Add Zod schemas to `packages/shared/src/schemas/`:
   - All `.message()` strings in Dutch
   - Use `.min()`, `.max()`, `.email()` with Dutch messages
   - Export from `packages/shared/src/index.ts` if not already exported

2. Add or extend TypeScript types in `packages/shared/src/types/app.types.ts`:
   - No `any`. No `@ts-ignore`.
   - Derive from generated `db.types.ts` types using `Database['public']['Tables']['<table>']['Row']` where applicable

3. Verify shared package:
   ```
   pnpm --filter @sc-muiden/shared typecheck
   ```
   Fix all errors before proceeding.

---

### Step 4 — Mobile implementation (`apps/mobile/`)

Implement in this order:

**React Query hooks** — create in `apps/mobile/hooks/` or `apps/mobile/lib/`:
- One file per domain (e.g. `useActivities.ts`, `useTeamSchedule.ts`)
- Use the Supabase client from `apps/mobile/lib/supabase.ts`
- Set `staleTime` explicitly — frequently-changing data: 0; relatively static data: 5+ minutes
- Use `select` to fetch only needed columns
- Return typed data — never `any`

**Screens and components** — create PascalCase.tsx files per design:
- Follow exact routes specified in the design (Expo Router file-based routing)
- All user-visible strings in Dutch
- Use design tokens from `packages/shared/src/tokens.ts` — no hardcoded hex values
- Lucide outline icons only — no filled variants, no emoji
- Every screen must have three states:
  - Loading: skeleton matching the screen layout
  - Empty: Dutch empty state text and sub-text
  - Error: Dutch error message, retry button

**Zustand stores** — if the design requires local UI state:
- Store file: `apps/mobile/stores/<domain>.ts`
- No server state in Zustand — server state belongs in React Query

---

### Step 5 — Web CMS implementation (`apps/web/`)

Implement per the design's "Web CMS implementatie" section:

**Server components** for all data-fetching pages:
- Use the Supabase SSR client (not the browser client)
- Role guard at the top of every CMS page — redirect to `/dashboard/geen-toegang` if role is not `beheerder` or `commissielid`

**Client components** — only where interactivity requires it:
- Mark with `'use client'` directive
- Keep client components as leaf nodes (push data down from server components)

**API routes** in `apps/web/app/api/` if the design specifies them:
- Validate input with Zod before any DB write
- Return Dutch error messages in JSON body
- Use `SUPABASE_SECRET_KEY` (server-side only, never `NEXT_PUBLIC_`)

All strings in Dutch. No raw Supabase error messages exposed to users.

---

### Step 6 — Edge functions (`supabase/functions/`)

For each edge function in the design:

1. Create `supabase/functions/<function-name>/index.ts`
2. Logging rules:
   - Log: event type, timestamp, outcome (success/failure)
   - Never log: email addresses, member names, member IDs, birth dates, or any PII
3. All secrets via `Deno.env.get('<SECRET_NAME>')` — never hardcoded
4. Error handling: catch all throws, return a structured JSON error with Dutch message, HTTP 500
5. If the function triggers push notifications: use the `push-trigger` pattern from existing functions

---

### Step 7 — Tests

Write tests in priority order per `docs/TESTING_STRATEGY.md`:

**E2E / integration tests (highest priority)**

For every use case with RLS implications or critical user flows:
- Web: Playwright test in `apps/web/e2e/`
- Mobile: Maestro flow in `apps/mobile/.maestro/`
- Never mock Supabase — use the local stack (`supabase start`)
- Add required seed data to `supabase/seed.sql` if not already present
- Reference the scenario ID in a comment: `// S05-A — Gebruiker maakt bardienst aan`

**Unit tests for shared logic**

For every new Zod schema in `packages/shared/`:
- Test file: `packages/shared/src/__tests__/<schema-name>.test.ts`
- Test: valid input passes, invalid input fails with Dutch error message, boundary values

**Component tests (selective)**

Only for components with non-trivial conditional rendering or state logic:
- Mobile: `apps/mobile/components/__tests__/` using jest-expo + React Native Testing Library
- Web: `apps/web/components/__tests__/` using React Testing Library + jest
- Do not write component tests for simple presentational components

---

### Step 8 — Verification

Run each command in sequence. **Fix all errors before running the next command.** Do not skip.

```
pnpm typecheck
```
Fix all TypeScript errors. No `any`. No `@ts-ignore`. No type assertions to `unknown`.

```
pnpm test
```
Fix all failing tests. Do not comment out tests or use `.skip`.

```
pnpm lint
```
Fix all lint errors.

---

### Step 9 — Done

After all three verification commands pass, output:

"Implementatie van `<feature-slug>` voltooid.

- Typecheck: geslaagd
- Tests: geslaagd
- Lint: geslaagd

Klaar voor Phase 3 — voer uit: `/sre <feature-slug>`"
