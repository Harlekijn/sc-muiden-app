# SC Muiden App — Testing Strategy

## Philosophy

The app handles real club data: children's whereabouts, admin-gated family links, bar duties, and team assignments. A bug that lets an unauthenticated user access member data, or a silent failure in the registration gate, is a privacy incident — not just a test failure. The testing strategy therefore prioritises **end-to-end correctness of critical flows** over coverage metrics.

**Test priority order:**

1. **E2E / integration tests** — full flows against a real local Supabase instance; highest confidence
2. **Unit tests for shared logic** — Zod schemas and pure utilities; cheap, fast, run everywhere
3. **Component tests** — only for non-trivial UI logic (form validation feedback, conditional rendering)

---

## Layer 1 — End-to-End Tests (Highest Priority)

Run against the local Supabase stack (`supabase start`). Tests use the **public anon key** and **service role key** to match real production conditions. No mocking of Supabase.

### Tooling

| Layer | Tool |
|---|---|
| Mobile flow simulation | [Maestro](https://maestro.mobile.dev/) — YAML-based, runs on iOS simulator |
| Web flow simulation | [Playwright](https://playwright.dev/) — headless Chromium |
| DB seeding / teardown | Supabase JS client with service role key |

### Critical Flows to Test

#### Auth flows (mobile)

| Test | What can go wrong |
|---|---|
| **Registration gate** — email not in `members` → blocked with Dutch message | Members check query wrong, error message missing or in English |
| **Registration gate** — email in `members` → account created; `profiles.member_id` auto-linked | Trigger broken, member_id stays null |
| **Login** — wrong credentials → Dutch error message | Error mapping missing, raw Supabase error shown |
| **Login** — correct credentials → lands on tabs, not auth | Auth guard redirect logic broken |
| **Session persistence** — kill app, reopen → still logged in | SecureStore not used, session lost |
| **Logout** → returns to login, session cleared | Auth guard doesn't react to SIGNED_OUT |

#### Family linking flow (mobile + web)

| Test | What can go wrong |
|---|---|
| Submit gezin/nieuw form → `family_link_requests` row created with status `pending` | RLS insert policy blocks own insert |
| Submitted request visible on profiel screen with clock icon | useFamilyLinkRequests hook query wrong |
| Admin approves (via service role): sets status → `approved`, inserts `user_family_members` row | FK violation if member_id not set |
| Approved member appears in profiel gezin section without clock icon | useFamilyMembers hook not refetching |
| CMS `/dashboard/gezinsverzoeken` shows pending request | Server query wrong, profiles join missing |

#### Role-based CMS access (web)

| Test | What can go wrong |
|---|---|
| Unauthenticated → `/dashboard` → redirect to `/login` | Middleware matcher wrong |
| `lid` role account → `/dashboard` → "Geen toegang" | Role check missing or wrong roles list |
| `beheerder` account → `/dashboard` → dashboard visible | Redirect fires despite correct role |
| `/login` with wrong password → Dutch error | Error mapping missing |
| `/login` correct → `/dashboard` redirect | Supabase browser client not setting cookie |

#### Data access / RLS (integration — service role seeded, anon key queried)

| Test | What can go wrong |
|---|---|
| User A cannot read User B's `family_link_requests` | RLS policy missing or too permissive |
| User can only read their own `member` record + approved family members | `members_select_own_and_family` policy wrong |
| User cannot read members with no link to them | Policy missing subquery for non-linked members |
| Admin can read all `members` | Admin policy missing |

---

## Layer 2 — Unit Tests (Shared Logic)

Located in `packages/shared/src/__tests__/`. No external dependencies — pure TypeScript/Zod. Run with Vitest (to be added to the shared package; it has no test runner configured yet).

### Auth schemas (`auth.schema.ts`)

```
loginSchema
  ✓ valid email + password ≥6 chars → passes
  ✓ invalid email format → 'Ongeldig e-mailadres'
  ✓ password shorter than 6 chars → 'Wachtwoord minimaal 6 tekens'

registerSchema
  ✓ matching passwords → passes
  ✓ mismatching passwords → 'Wachtwoorden komen niet overeen' on passwordBevestiging
  ✓ password shorter than 8 chars → error on password field
  ✓ naam shorter than 2 chars → error

forgotPasswordSchema
  ✓ valid email → passes
  ✓ invalid email → Dutch error
```

### Member / family schemas (`member.schema.ts`)

```
createFamilyLinkRequestSchema
  ✓ first_name + last_name only (birth_date omitted) → passes
  ✓ empty first_name → error
  ✓ birth_date provided → passes

updateProfileSchema
  ✓ display_name ≥2 chars → passes
  ✓ display_name = '' → 'Naam is verplicht'
  ✓ display_name = 'X' (1 char) → 'Naam is verplicht'
```

### Utilities

```
sport.ts
  ✓ sportLabel('voetbal') → 'Voetbal'
  ✓ sportLabel('hockey') → 'Hockey'

score.ts
  ✓ formatScore(3, 1) → '3 – 1' (en-dash, spaces)
  ✓ formatScore(0, 0) → '0 – 0'

date.ts
  ✓ formatDutchDate('2026-04-26') → 'zondag 26 april 2026'  (or equivalent)
```

---

## Layer 3 — Component Tests (Selective)

Located in `apps/mobile/components/__tests__/` and `apps/web/components/__tests__/`. Use jest-expo + React Native Testing Library (mobile) and jest + React Testing Library (web). Only test components with non-trivial logic — skip dumb layout wrappers.

### Mobile — worth testing

| Component / Screen | What to test |
|---|---|
| `FormField` | Renders label; renders error text when `error` prop set; does not render error element when `error` undefined |
| `TextInput` | Passes `onChangeText` through; applies focused style on focus event |
| `gezin/nieuw.tsx` | Shows success state after mutation resolves; birth_date field is optional (submit without it succeeds) |
| `profiel.tsx` | Pending requests rendered with clock icon text; approved family members rendered without clock icon |

### Web — worth testing

| Component | What to test |
|---|---|
| `RequestRow` (gezinsverzoeken) | Renders `–` when `profiles` is null or empty |
| Dashboard `layout.tsx` (unit) | `GeenToegang` renders when role is `lid`; children render when role is `beheerder` |

---

## Test Data Conventions

All E2E tests use a dedicated seed script (`supabase/seed.ts`) that:

1. Creates a `members` record with a known email (e.g. `testlid@scmuiden.nl`)
2. Creates a `members` record for a family member (child, no email)
3. Creates a `beheerder` member record with a known email
4. Signs up both test users via the auth admin API (bypasses email confirmation)
5. Cleans up all created rows in `afterAll` using service role

Never hard-code `uuid`s in test assertions — query the DB for created ids after seeding.

---

## What We Do Not Test

- **Third-party SDKs** (Supabase JS, expo-router, React Hook Form) — we trust them
- **Design tokens / styling** — visual regression is out of scope for V1
- **Federation sync** (KNVB/KNHB) — covered separately when those integrations are built
- **Push notification delivery** — hardware-dependent, not suitable for CI

---

## CI Integration (Target)

When a CI pipeline is set up, the test order should be:

```
1. pnpm typecheck          # fast, catches most breakage
2. pnpm test (unit only)   # packages/shared Vitest, <5s
3. supabase start
4. supabase db reset       # apply all migrations fresh
5. pnpm test:e2e           # Playwright (web) + Maestro (mobile, iOS only)
```

Unit tests run on every push. E2E tests run on PRs to `main` and on the `main` branch after merge.

---

## Implementation Order

1. Add Vitest to `packages/shared` → write all schema + utility unit tests (no infra needed)
2. Add Playwright to `apps/web` → write CMS auth and role-access E2E tests (needs `supabase start`)
3. Add Maestro flows for mobile critical auth + family link flows
4. Add component tests for `FormField`, `TextInput`, and `gezin/nieuw`
5. Write seed script for repeatable E2E data setup
