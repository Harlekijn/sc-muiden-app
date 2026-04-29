# SC Muiden App — Tech Stack

## Summary

| Layer | Technology | Rationale |
|---|---|---|
| Mobile | React Native + Expo (TypeScript) | Single codebase for iOS + Android; Expo handles push, OTA, build pipeline |
| Web CMS | Next.js 14 (App Router, TypeScript) | Full-stack React; server components for fast CMS pages; same React skills as mobile |
| Database | Supabase (PostgreSQL) | Managed Postgres + auth + realtime + storage + edge functions in one platform |
| Auth | Supabase Auth | Email/password; JWT + RLS-based access control; built into Supabase |
| Push Notifications | Expo Push + Firebase Cloud Messaging | Expo abstracts APNs (iOS) and FCM (Android) behind a single API |
| Federation Sync | Supabase Edge Functions (Deno) | Serverless; runs on a schedule; isolated from the app |
| Monorepo | pnpm workspaces + Turborepo | Shared types and clients between mobile and web without a separate package registry |
| State (server) | TanStack Query v5 | Consistent caching and sync patterns across mobile and web |
| State (local) | Zustand | Minimal boilerplate for session and UI state |
| Validation | Zod | Runtime-safe schemas shared via `packages/shared` |
| Forms | React Hook Form + Zod resolver | Used in CMS and mobile onboarding flows |
| Navigation (mobile) | Expo Router v3 | File-based routing; deep links; typed routes |
| Styling (mobile) | StyleSheet + design tokens | Native StyleSheet; tokens imported from `packages/shared/tokens.ts` |
| Styling (web) | CSS Modules + design tokens | `colors_and_type.css` from design system imported in `globals.css` |
| CI/CD | GitHub Actions | Type check + lint + test on PR; EAS Build for mobile; Vercel for web |
| Mobile builds | Expo EAS Build | Managed build service for iOS and Android; OTA updates via EAS Update |
| Web hosting | Vercel | Next.js first-class support; preview deployments per branch |
| Database hosting | Supabase Cloud | Managed Postgres; branching for preview environments |

---

## Mobile App (`apps/mobile`)

**Runtime:** Expo SDK 51+, React Native 0.74+

### Key Packages

```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "expo-notifications": "~0.28.0",
  "expo-secure-store": "~13.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.0.0",
  "zod": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "@hookform/resolvers": "^3.0.0",
  "date-fns": "^3.0.0",
  "date-fns/locale/nl": "included"
}
```

### Screen Structure (Expo Router)

```
apps/mobile/app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx          # Bottom tab bar (5 tabs)
│   ├── index.tsx            # Thuisscherm (home feed)
│   ├── agenda.tsx           # Kalender / activities
│   ├── teams.tsx            # Teams & squads
│   ├── nieuws.tsx           # Announcements / news
│   └── profiel.tsx          # Account + family members
├── activiteit/[id].tsx      # Activity detail
├── wedstrijd/[id].tsx       # Match detail
└── _layout.tsx              # Root layout (auth guard)
```

### Navigation Tabs (Dutch labels)

| Tab | Icon | Label |
|---|---|---|
| Home | `home` | Thuis |
| Calendar | `calendar` | Agenda |
| Teams | `users` | Teams |
| News | `newspaper` | Nieuws |
| Profile | `user` | Profiel |

---

## Web CMS (`apps/web`)

**Runtime:** Next.js 14, App Router, React 18

### Key Packages

```json
{
  "next": "^14.0.0",
  "@supabase/ssr": "^0.3.0",
  "@supabase/supabase-js": "^2.0.0",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "date-fns": "^3.0.0"
}
```

### CMS Route Structure

```
apps/web/app/
├── (auth)/login/            # CMS login
├── dashboard/
│   ├── page.tsx             # Overview
│   ├── leden/               # Member management + import
│   ├── teams/               # Team management
│   ├── activiteiten/        # Training, matches, bar service, events
│   ├── aankondigingen/      # Announcements / push messages
│   ├── rollen/              # Role assignment
│   └── instellingen/        # Club settings, federation keys
└── api/
    ├── webhooks/            # Supabase webhook handlers
    └── sync/[sport]/        # Manual federation sync trigger
```

---

## Database (`supabase/`)

### Core Tables

```sql
-- Accounts (Supabase Auth user + profile)
profiles (id, display_name, email, phone, avatar_url, role, sport[], created_at, updated_at)

-- Family
family_members (id, account_id, first_name, last_name, birth_date, sport[], created_at)

-- Club structure
teams (id, name, sport, age_category, season, federation_team_id, created_at)
team_members (id, team_id, family_member_id, role, jersey_number, created_at)

-- Activities
activities (id, type, sport, team_id, title, starts_at, ends_at, location, notes, created_at)
-- type: 'training' | 'wedstrijd' | 'bardienst' | 'clubactiviteit'

-- Matches (enriched from federation)
matches (id, activity_id, federation_match_id, home_team, away_team, score_home, score_away,
         status, played_at, federation_source, raw_data jsonb, created_at)

-- Bar service assignments
bar_assignments (id, activity_id, family_member_id, confirmed_at, created_at)

-- Announcements
announcements (id, title, body, sport[], teams uuid[], published_at, author_id, created_at)

-- Notifications
notifications (id, recipient_profile_id, title, body, data jsonb, sent_at, read_at, created_at)

-- Push tokens
push_tokens (id, profile_id, token, platform, created_at, updated_at)

-- Federation sync log
sync_log (id, sport, started_at, finished_at, records_updated, error text, created_at)
```

### RLS Policy Pattern

- `profiles`: SELECT own row; UPDATE own row. CMS role: SELECT all.
- `activities`: SELECT for team members and their families. CMS role: full CRUD.
- `announcements`: SELECT published records for relevant sport/team. CMS role: full CRUD.
- `notifications`: SELECT/UPDATE own records only.

---

## Shared Package (`packages/shared`)

```
packages/shared/src/
├── types/
│   ├── db.types.ts          # Auto-generated from Supabase schema (never edit by hand)
│   ├── app.types.ts         # Derived/domain types
│   └── federation.types.ts  # KNVB + KNHB response shapes
├── schemas/
│   ├── activity.schema.ts   # Zod schemas for activities
│   ├── member.schema.ts
│   └── announcement.schema.ts
├── tokens.ts                # Design token constants (colors, spacing, typography)
└── utils/
    ├── date.ts              # Dutch date formatting helpers (uses date-fns/locale/nl)
    ├── score.ts             # Score formatting: "3 – 1"
    └── sport.ts             # Sport label helpers
```

---

## Federation API Clients (`packages/api-clients`)

### KNVB (football)

- Base URL: `https://api.knvbdataservice.nl/`
- Auth: API key in `Authorization` header
- Key endpoints used: team schedule, results, standings, player registrations
- Client: `packages/api-clients/src/knvb.ts`

### KNHB (hockey)

- Base URL: `https://clubi.hockeyweerelt.nl/`
- Auth: Per KNHB Club API spec
- Key endpoints used: team schedule, results
- Client: `packages/api-clients/src/knhb.ts`

Both clients wrap raw responses in Zod schemas and return typed, normalized data.

---

## Supabase Edge Functions (`supabase/functions/`)

| Function | Trigger | Description |
|---|---|---|
| `federation-sync` | Cron (daily 03:00) + manual | Fetch KNVB + KNHB schedules and results; upsert into `matches` and `activities` |
| `push-trigger` | DB webhook on `notifications` insert | Send push via Expo Push API |
| `announcement-push` | DB webhook on `announcements` published | Fan out push notifications to all relevant profile tokens |

---

## CI/CD

### GitHub Actions Workflows

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR to `main` | pnpm install → typecheck → lint → test |
| `eas-preview.yml` | PR to `main` | EAS Build preview (internal distribution) |
| `eas-production.yml` | Push to `main` | EAS Build production → submit to stores |
| `deploy-web.yml` | Push to `main` | Vercel production deploy |

### Environments

| Env | Mobile | Web | Database |
|---|---|---|---|
| Development | Expo Go / simulator | `localhost:3000` | `supabase start` (local) |
| Preview | EAS Build (internal) | Vercel preview URL | Supabase branch |
| Production | App Store / Play Store | `cms.scmuiden.nl` | Supabase production |

---

## Not In Scope for V1

- Social login (Google, Apple)
- In-app chat or messaging between members
- Payment processing (e.g. membership fees)
- Live match tracking / GPS
- Photo/video galleries
- Public-facing website (separate from CMS)
