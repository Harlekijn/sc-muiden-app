# SC Muiden App — V1 Roadmap

**Target release:** Q  2026  
**Scope:** iOS + Android app with web CMS. Dutch language throughout.  
**Sports:** Voetbal (KNVB) and hockey (KNHB).

---

## Milestones at a Glance

| Phase | Name | Duration | Cumulative |
|---|---|---|---|
| 0 | Foundation & Setup | 2 weeks | Week 2 |
| 1 | Auth & Family Profiles | 3 weeks | Week 5 |
| 2 | Activities & Calendar | 4 weeks | Week 9 |
| 3 | Home Feed & Notifications | 3 weeks | Week 12 |
| 4 | Federation Integration | 4 weeks | Week 16 |
| 5 | Web CMS | 4 weeks | Week 20 |
| 6 | Announcements & News | 2 weeks | Week 22 |
| 7 | Beta & Polish | 4 weeks | Week 26 |

---

## Phase 0 — Foundation & Setup (Weeks 1–2)

Goal: working monorepo, local dev environment, CI pipelines running, empty apps booting.

### Tasks

- [ ] Init pnpm monorepo with Turborepo
- [ ] Scaffold `apps/mobile` with Expo SDK + TypeScript + Expo Router
- [ ] Scaffold `apps/web` with Next.js 14 App Router + TypeScript
- [ ] Create `packages/shared` with design tokens and base types
- [ ] Create `packages/api-clients` stub
- [ ] Supabase project setup (local + cloud)
- [ ] Apply base database schema (migrations 001–005: profiles, teams, activities, matches, notifications)
- [ ] Configure RLS policies for all tables
- [ ] GitHub repository, branch protection on `main`
- [ ] GitHub Actions: CI workflow (typecheck + lint + test)
- [ ] EAS project setup; EAS Build preview workflow
- [ ] Vercel project setup for `apps/web`
- [ ] Import design tokens into `packages/shared/tokens.ts`
- [ ] Import Barlow + Barlow Condensed fonts in both apps
- [ ] Base component library: Button, Card, Badge, Icon wrapper, Text variants

### Definition of Done
Both apps boot on simulator/browser. CI passes on a trivial PR. Design tokens applied. Empty screens render with correct fonts and colors.

---

## Phase 1 — Auth & Family Profiles (Weeks 3–5)

Goal: a member can register, log in, and set up their family (gezin).

### Tasks

**Auth (mobile + web)**
- [ ] Registration screen: naam, e-mailadres, wachtwoord
- [ ] Login screen
- [ ] Forgot password flow (Supabase magic link)
- [ ] Auth guard in Expo Router root layout
- [ ] Supabase Auth session persistence via `expo-secure-store`
- [ ] CMS auth: login page restricted to `beheerder` / `commissielid` roles

**Profile**
- [ ] Profile screen: display name, avatar (upload to Supabase Storage), contact info
- [ ] Sport preference (voetbal / hockey / beide)

**Family (Gezin)**
- [ ] "Mijn gezin" section in profile tab
- [ ] Add family member form: voornaam, achternaam, geboortedatum, sport
- [ ] Edit / remove family member
- [ ] Family member list with sport badge
- [ ] DB: `family_members` table with RLS (own rows only)

### Definition of Done
A user can register, log in, add two family members (e.g. two children on different teams), and see them listed. Session persists across app restarts.

---

## Phase 2 — Activities & Calendar (Weeks 6–9)

Goal: members can see all their (and their family's) upcoming activities in a calendar.

### Tasks

**Data model**
- [ ] `activities` table: training, wedstrijd, bardienst, clubactiviteit
- [ ] `team_members` linking family members to teams
- [ ] `bar_assignments` for bar service obligations

**Calendar screen (Agenda)**
- [ ] Monthly calendar view with activity dots per day
- [ ] Day detail: list of activities for selected date
- [ ] Activity types distinguished by color/icon
- [ ] Family filter: "Heel gezin" toggle or per-member filter chip
- [ ] Dutch locale: week starts Monday, Dutch month/day names

**Activity detail screen**
- [ ] Type, sport badge, team name
- [ ] Date, time (24h), location with map link
- [ ] Attendees (for bar service: assigned gezinsleden)
- [ ] Notes/description

**Bar service (Bardienst)**
- [ ] Bar service activity type with assigned family members
- [ ] "Bevestigen" confirm button
- [ ] Confirmation stored in `bar_assignments.confirmed_at`

**Training**
- [ ] Training sessions linked to a team
- [ ] Recurring training support (weekly cadence)

### Definition of Done
A family sees all activities across their members in the calendar. Bar service shows which family member is assigned. Switching family filter updates the calendar instantly.

---

## Phase 3 — Home Feed & Push Notifications (Weeks 10–12)

Goal: the home tab shows today's and upcoming activities; push reminders land on device.

### Tasks

**Home feed (Thuisscherm)**
- [ ] "Vandaag" section: activities happening today
- [ ] "Binnenkort" section: next 7 days
- [ ] "Volgende wedstrijd" hero card (nearest match per sport)
- [ ] Empty states in Dutch ("Geen activiteiten vandaag")
- [ ] Pull-to-refresh

**Push Notifications**
- [ ] Request permission on first launch (Expo Notifications)
- [ ] Register push token in `push_tokens` table
- [ ] Supabase Edge Function `push-trigger`: fires on `notifications` insert, calls Expo Push API
- [ ] Notification types: wedstrijd-herinnering (24h before), bardienst-herinnering (48h before), aankondiging
- [ ] Notification tap deep-links to relevant screen in Expo Router
- [ ] Notification preferences screen (opt in/out per type)

**Scheduled reminders**
- [ ] Cron Edge Function `reminder-scheduler`: daily at 06:00, inserts notifications for activities 24h and 48h out
- [ ] Handles family-member-level targeting (notify the parent account)

### Definition of Done
Home feed populates from real data. Push notification arrives on device for a test activity 24h in the future. Tapping it opens the activity detail screen.

---

## Phase 4 — Federation Integration (Weeks 13–16)

Goal: match schedules and results from KNVB and KNHB sync automatically and appear in the app.

### Tasks

**KNVB client (`packages/api-clients/src/knvb.ts`)**
- [ ] Auth (API key)
- [ ] Fetch team schedule by `federation_team_id`
- [ ] Fetch match results
- [ ] Fetch standings
- [ ] Zod schema for all response types

**KNHB client (`packages/api-clients/src/knhb.ts`)**
- [ ] Auth (Club API)
- [ ] Fetch team schedule
- [ ] Fetch match results
- [ ] Zod schema for all response types

**Sync Edge Function (`supabase/functions/federation-sync`)**
- [ ] Daily cron at 03:00
- [ ] Iterate all teams with a `federation_team_id`
- [ ] Upsert matches into `matches` table
- [ ] Upsert corresponding `activities` records (type: `wedstrijd`)
- [ ] Write result to `sync_log`
- [ ] Error handling: log failure, don't crash other teams' sync

**Match data in app**
- [ ] Match detail screen: home/away teams, score, date/time, location
- [ ] Score display: `3 – 1` (en-dash, spaces)
- [ ] Match status badge: `GEPLAND` / `LIVE` / `GESPEELD`
- [ ] Standings screen per team (ranglijst)

**CMS: manual sync trigger**
- [ ] "Synchroniseer nu" button per sport in CMS settings
- [ ] Calls `api/sync/[sport]` route, shows last sync timestamp and status

### Definition of Done
After running the sync function, real match schedules from KNVB appear in the calendar and on the home feed for the correct teams. Results update after a match is played.

---

## Phase 5 — Web CMS (Weeks 17–20)

Goal: club staff can manage members, teams, activities, and roles without touching the database.

### Tasks

**CMS shell**
- [ ] Responsive sidebar navigation (Dutch labels)
- [ ] Role guard: only `beheerder` and `commissielid` can access
- [ ] Dashboard overview: counts of leden, teams, upcoming activities

**Leden (members)**
- [ ] Member list with search, filter by sport and team
- [ ] Member detail view and edit
- [ ] CSV import from ClubBase: map columns to `profiles` + `family_members`
- [ ] Import preview with validation errors shown before committing
- [ ] Duplicate detection on import (e-mail + naam + geboortedatum)

**Teams**
- [ ] Team list: name, sport, age category, season
- [ ] Create / edit team
- [ ] Assign members to a team with role (speler, coach, trainer, teammanager)
- [ ] Link federation team ID (for sync)

**Activiteiten**
- [ ] Activity list with type and date filters
- [ ] Create training: team, date/time, location, recurring option
- [ ] Create clubactiviteit: title, date/time, location, sport filter
- [ ] Edit / cancel activity (soft delete)
- [ ] Bar service: create bardienst activity, assign family members

**Rollen (roles)**
- [ ] Assign / revoke role for a member account
- [ ] Roles: `lid`, `ouder`, `trainer`, `coach`, `teammanager`, `commissielid`, `beheerder`

### Definition of Done
A beheerder can import 50 members from CSV, create teams, assign members to teams, and create a training session — all without SQL access. New activities appear in the mobile app within seconds (Supabase Realtime).

---

## Phase 6 — Announcements & News (Weeks 21–22)

Goal: club can push news and announcements to all members or targeted groups.

### Tasks

**CMS: Aankondigingen**
- [ ] Create announcement: title, body (rich text), target audience (all / sport / team), publish date
- [ ] Draft / published states
- [ ] Published announcement triggers `announcement-push` Edge Function
- [ ] Edge Function fans out push notifications to all matching push tokens

**Mobile: Nieuws tab**
- [ ] Announcement list, newest first
- [ ] Announcement detail: title, body, published date, author
- [ ] Unread indicator (badge on tab)
- [ ] Mark as read on open (`notifications.read_at`)
- [ ] Filter by sport (voetbal / hockey / club)

**In-app notification center**
- [ ] Bell icon in header (profile or home tab)
- [ ] List of all received notifications
- [ ] Tap to navigate to relevant content

### Definition of Done
A beheerder publishes an announcement targeted at "voetbal". All members with voetbal in their sport preference receive a push notification and see the post in the Nieuws tab.

---

## Phase 7 — Beta, Polish & Launch (Weeks 23–26)

Goal: stable, tested app submitted to App Store and Google Play.

### Tasks

**Beta testing**
- [ ] Internal TestFlight + Android internal track (EAS Submit)
- [ ] Recruit 10–15 club members for beta (mix of parents, trainers, commissieleden)
- [ ] Collect feedback via simple Google Form (linked from app settings)
- [ ] Fix critical bugs from beta feedback

**Quality**
- [ ] Accessibility: minimum AA contrast ratios, touch targets ≥ 44px
- [ ] Offline state handling: show cached data with "Geen verbinding" banner
- [ ] Loading skeletons for all list screens (use `--color-mid` shimmer)
- [ ] Empty state screens for all tabs
- [ ] Error boundaries in both apps
- [ ] Sentry error tracking (mobile + web)

**Performance**
- [ ] React Query stale time tuning per screen
- [ ] Image lazy loading and caching (Expo Image)
- [ ] Supabase query optimization (indexes on `activities.starts_at`, `team_members.team_id`)

**App store**
- [ ] App icons (1024px + adaptive Android)
- [ ] Splash screen
- [ ] Screenshots for all required device sizes (Dutch locale)
- [ ] App Store description (Dutch)
- [ ] Google Play listing (Dutch)
- [ ] Privacy policy URL
- [ ] Submit for review (allow 1–2 weeks for App Store review)

**Post-launch**
- [ ] Monitor crash rate in Sentry
- [ ] Monitor push delivery rate in Expo dashboard
- [ ] Monitor sync logs in Supabase for federation errors
- [ ] Hotfix process: EAS Update for JS-only fixes (no store review needed)

### Definition of Done
App is live on both stores. Zero P0 crashes in first 48h of production. Push notifications deliver to >95% of registered tokens.

---

## Out of Scope for V1

The following are tracked for V2:

- Social login (Apple ID, Google)
- In-app chat between members
- Payment processing (membership fees, event registration fees)
- Live match tracking
- Photo and video galleries
- Public-facing club website (separate product)
- Referee management
- Volunteer hour tracking

---

## Key Dependencies & Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| KNVB API access requires approval | Medium | Apply early; build sync with mock data in parallel |
| KNHB API access requires approval | Medium | Same as above |
| App Store review rejection | Low | Follow guidelines strictly; have privacy policy ready |
| ClubBase CSV format changes | Low | Make import column mapping configurable in CMS |
| Push notification deliverability | Low | Use Expo managed service; monitor receipt errors |
| Federation data quality (wrong times, cancelled matches) | High | Surface data source in UI; allow manual override in CMS |
