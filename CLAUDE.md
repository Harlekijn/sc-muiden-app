# SC Muiden App — Claude Code Guide

## Project Overview

Mobile app (iOS + Android) and web CMS for SC Muiden, a local football and hockey club in Muiden, Netherlands. The app serves members, parents, volunteers, and club staff. All UI copy is in Dutch.

- **App:** `apps/mobile/` — React Native + Expo
- **CMS (web admin):** `apps/web/` — Next.js
- **Shared:** `packages/shared/` — types, API clients, utilities
- **Backend/DB:** `supabase/` — schema, migrations, edge functions

Full stack docs: [docs/TECH_STACK.md](docs/TECH_STACK.md)  
V1 roadmap: [docs/ROADMAP_V1.md](docs/ROADMAP_V1.md)  
Design system: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)  
Entity/table diagram: [docs/CLASS_STRUCTURE.md](docs/CLASS_STRUCTURE.md)  
Dev environment setup: [docs/RUNNING.md](docs/RUNNING.md)  
Testing strategy: [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)

---

## Key Constraints

- **Language:** All UI copy must be in Dutch. No English strings in user-facing screens.
- **Design system:** Follow [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) strictly — colors, typography, spacing, icons (Lucide outline only), no emoji, no gradients in components.
- **Sports:** The app covers both football (voetbal) and hockey. All federation integrations and data models must handle both sports.
- **Family model:** A user account can have multiple family members. Activities are aggregated across the family in a single feed.
- **Roles:** `lid` (member), `ouder` (parent), `trainer`, `coach`, `teammanager`, `commissielid` (committee), `beheerder` (admin). Role assignment happens in the CMS.

---

## Monorepo Structure

```
sc-muiden-app/
├── apps/
│   ├── mobile/          # Expo React Native app (iOS + Android)
│   └── web/             # Next.js CMS / admin panel
├── packages/
│   ├── shared/          # Shared TypeScript types, Zod schemas, utils
│   └── api-clients/     # KNVB + KNHB API client wrappers
├── supabase/
│   ├── migrations/      # SQL migrations (run in order)
│   └── functions/       # Edge functions (federation sync, push triggers)
├── docs/
│   ├── TECH_STACK.md
│   ├── ROADMAP_V1.md
│   ├── DESIGN_SYSTEM.md
│   ├── CLASS_STRUCTURE.md
│   ├── RUNNING.md
│   ├── TESTING_STRATEGY.md
│   └── TESTING_LOCAL.md
└── CLAUDE.md
```

---

## Development Commands

```bash
# Install all dependencies (run from root)
pnpm install

# Mobile app (Expo — requires expo-dev-client, cannot run in plain Expo Go)
cd apps/mobile
pnpm ios                # Build + run on iOS Simulator (requires Xcode)
pnpm android            # Build + run on Android Emulator (requires Android Studio)
pnpm start              # Start Expo dev server (connect existing dev client)

# Web CMS (Next.js)
cd apps/web
pnpm dev                # Start at http://localhost:3000
pnpm seed               # Insert beheerder + lid + family fixture data
pnpm teardown           # Remove fixture data

# Supabase (local)
supabase start          # Start local Supabase stack
supabase db reset       # Reset + replay migrations
supabase functions serve # Serve edge functions locally

# Type generation from Supabase schema
supabase gen types typescript --local > packages/shared/src/db.types.ts

# Tests
pnpm test               # Run all tests from root
pnpm typecheck          # TypeScript check across all packages

# See docs/RUNNING.md for the full local/preview/production setup guide.
```

---

## Architecture Notes

### Authentication
- Supabase Auth (email/password). Social login is out of scope for V1.
- JWT is passed in all API calls. Row Level Security (RLS) enforces data access.
- Family members are sub-profiles linked to the primary account — they do not have their own login.

### Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `push-trigger` | DB insert on `notifications` | Delivers push notifications to iOS/Android via Expo |
| `announcement-push` | DB insert on `announcements` | Sends targeted push notifications for new announcements |
| `reminder-scheduler` | Cron | Schedules activity reminders |
| `federation-sync` | Cron (daily) + manual CMS trigger | Syncs KNVB/KNHB schedules, results, standings |

Never send push notifications from the mobile app directly — always via DB insert → `push-trigger`.

### Federation Data Sync
- KNVB: `https://api.knvbdataservice.nl/` — football schedules, results, standings.
- KNHB: `https://clubi.hockeyweerelt.nl/` — hockey schedules, results.
- All federation data is stored locally in Supabase — the app never calls federation APIs directly.

### CMS
- Next.js app with Supabase client. No separate backend for the CMS.
- Access is restricted to users with role `beheerder` or `commissielid`.
- Member import accepts CSV export from ClubBase (the club's existing member system).

---

## Database Conventions

- All tables use `snake_case` column names.
- Every table has `id uuid primary key default gen_random_uuid()`, `created_at`, and `updated_at`.
- Soft deletes: add `deleted_at timestamptz` — never hard-delete member or activity records.
- RLS is enabled on all tables. Write a policy for every access pattern.
- Enum values in Dutch where they appear in the UI (e.g. sport: `'voetbal' | 'hockey'`).

---

## Code Conventions

- TypeScript strict mode everywhere.
- Zod for all runtime validation (API responses, form inputs, federation data).
- React Query (TanStack Query v5) for server state in both mobile and web.
- Zustand for lightweight local UI state in the mobile app (auth session, selected family member filter). Not used in the web CMS.
- `packages/shared` types are the single source of truth — never duplicate type definitions.
- Component files: `PascalCase.tsx`. Utility/hook files: `camelCase.ts`.
- No `any`. No `@ts-ignore`. Fix the types.

---

## Design System Quick Reference

| Token | Value |
|---|---|
| Primary navy | `#011d50` |
| Brand blue | `#046bba` |
| Accent yellow | `#f5c518` |
| Body font | Barlow, 15px/400 |
| Display font | Barlow Condensed |
| Base spacing unit | 4px |
| Card radius | 10px |
| Button radius | 8px |

- Icons: Lucide, outline/stroke only, never filled.
- No emoji in UI.
- All shadows navy-tinted (`rgba(1, 29, 80, ...)`), never pure black.
- Score format: `3 – 1` (en-dash, spaces). Time: `14:30`. Date: `zaterdag 26 april`.

---

## Environment Variables

Create `.env.local` in each app (never commit these):

```
# apps/mobile/.env.local
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # Supabase publishable key (replaces legacy anon key)

# apps/web/.env.local
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=               # Supabase publishable key (replaces legacy anon key)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=                    # Supabase secret key (replaces legacy service_role key) — CMS only, never expose to mobile

# supabase/.env.local (for edge functions)
KNVB_API_KEY=
KNHB_API_KEY=
EXPO_PUSH_ACCESS_TOKEN=
```
