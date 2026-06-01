---
name: build-with-tests
description: >
  Implement, build, extend, or add a feature to the SC Muiden codebase.
  Triggers automatically when the user asks to implement, add, create, build,
  or extend any feature, screen, hook, migration, edge function, or component.
  Covers the full delivery loop: reading context, matching existing patterns,
  writing production code with tests, and verifying with typecheck + lint +
  test suite before declaring done.
---

You are implementing a production feature in the SC Muiden monorepo. Follow
this process exactly, in order.

---

## Step 1 — Read context first

Before touching any code:

1. Re-read `CLAUDE.md` for constraints (language, design system, roles, DB
   conventions, code conventions).
2. Read the relevant technical brief or scenario files in `docs/scenarios/`
   if they describe the feature being built.
3. Read `docs/TESTING_STRATEGY.md` briefly if you are unsure which test layer
   to use for this feature.

Do not start writing code until you have done this.

---

## Step 2 — Find 2–3 comparable existing features

Locate features that are structurally similar to what you are building and
read their source before writing a single line:

- **New screen (mobile):** find an existing screen in `apps/mobile/app/` in
  the same feature area; read its hook, its `__tests__/`, and its route file.
- **New CMS page (web):** find an existing page in
  `apps/web/app/dashboard/[feature]/`; read its `page.tsx`, `_components/`,
  and `__tests__/`.
- **New schema or utility (shared):** read a neighbouring schema in
  `packages/shared/src/schemas/` and its test in
  `packages/shared/src/__tests__/`.
- **New edge function:** read an existing function in `supabase/functions/`
  with a similar trigger type (DB insert vs cron).

Match the patterns you find exactly — naming, file layout, import style,
error-handling shape. Do not introduce new patterns unless none exist.

---

## Step 3 — Write production code

Follow these conventions precisely.

### Naming
- Components: `PascalCase.tsx`
- Hooks, utilities, stores: `camelCase.ts`
- Test files: `[feature].test.ts(x)` in a `__tests__/` folder co-located with
  the code they test
- Zustand stores (mobile only): `[Domain]Store.ts`

### Where logic lives
- **Validation:** Zod schema in `packages/shared/src/schemas/[domain].schema.ts`
- **Data fetching (mobile):** `useQuery` hook in `apps/mobile/hooks/use[Feature].ts`
- **Mutations (mobile):** `useMutation` in the same hook file; map Supabase
  errors to Dutch user-facing messages
- **Server data (web):** `createSupabaseServerClient()` in Server Components;
  never use the browser client for initial page data
- **Admin operations (web):** `createSupabaseAdminClient()` — server-side only,
  never referenced from client components or the mobile app
- **Pure utilities:** `packages/shared/src/utils/[name].ts`
- **Lightweight state (mobile only):** Zustand store; not for domain logic

### Error handling
- Surface errors in Dutch at the component level
- Do not let raw Supabase error messages reach the UI
- Zod validation errors must use Dutch messages: `{ message: 'Veld is verplicht' }`

### Database
- All columns `snake_case`; every table needs `id`, `created_at`, `updated_at`
- Soft-delete with `deleted_at timestamptz` — never hard-delete member or
  activity records
- Every new table needs RLS enabled and a policy for each access pattern
- Enum values in Dutch where they appear in the UI

### Design system
- Web CMS components: colors only from CSS custom properties — never hardcoded hex
- Icons: Lucide, outline/stroke only; never filled
- No emoji in UI; no gradients in components
- Shadows: `rgba(1, 29, 80, ...)` — never pure black

---

## Step 4 — Write tests alongside production code

Write tests as you build each layer — not after, not as a separate pass.

### Which test layer to use

| What you built | Layer | Runner | Location |
|---|---|---|---|
| Zod schema or pure utility | Unit | Vitest | `packages/shared/src/__tests__/` |
| React Native component | Component | Jest + RTL Native | `apps/mobile/components/__tests__/` |
| Mobile hook | Hook | Jest | `apps/mobile/hooks/__tests__/` |
| Next.js component or page logic | Component | Jest + RTL | `apps/web/app/dashboard/__tests__/` |
| Critical CMS workflow | E2E | Playwright | `apps/web/e2e/*.spec.ts` |

### What to mock and what to keep real
- **Mock:** Supabase client, `useRouter`, Lucide icons, and custom hooks when
  testing a component that consumes them
- **Keep real:** Zod schemas, pure utility functions, component rendering

### Test structure

```typescript
describe('Feature name — S##-X', () => {
  it('saves as draft when published_at is null', () => { ... })
  it('shows Dutch error when title is empty', () => { ... })
})
```

- `describe` → feature name, plus the scenario ID (`S##-X`) if a matching
  scenario file exists in `docs/scenarios/`
- `it` → one observable behaviour per test, description in English
- Zod tests: assert Dutch error messages via `result.error.errors[0].message`
- E2E tests: always add a DB-verification step using the admin client after
  the UI flow to confirm the database state matches what the UI showed

---

## Step 5 — Verify before declaring done

Run all checks in order and fix every failure before reporting the feature
complete:

```bash
pnpm typecheck        # TypeScript strict — no `any`, no `@ts-ignore`
pnpm lint             # ESLint across all packages
pnpm test             # Full unit + component test suite
```

If the feature includes a web CMS page or workflow, also run:

```bash
cd apps/web && pnpm test:e2e
```

Do not skip or explain away failures. If a check fails, fix it.

---

## Output when done

Report:
1. Files created or modified (with paths relative to repo root)
2. Test file(s) written and what scenarios they cover
3. Output of the final typecheck + lint + test run
