# SC Muiden App — V1 Roadmap

**Target release:** Q2 2026 (v1.0)  
**Federation integration:** Deferred to v1.1+ (manual setup for v1.0)  
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
| 4 | Web CMS | 4 weeks | Week 16 |
| 5 | Announcements & News | 2 weeks | Week 18 |
| 6 | Beta & Polish | 4 weeks | Week 22 |

---

## Phase 0 — Foundation & Setup (Weeks 1–2) ✅

Goal: working monorepo, local dev environment, CI pipelines running, empty apps booting.

### Tasks

- [x] Init pnpm monorepo with Turborepo
- [x] Scaffold `apps/mobile` with Expo SDK + TypeScript + Expo Router
- [x] Scaffold `apps/web` with Next.js 14 App Router + TypeScript
- [x] Create `packages/shared` with design tokens and base types
- [x] Create `packages/api-clients` stub
- [x] Supabase project setup (local + cloud)
- [x] Apply base database schema (migrations 001–005: profiles, teams, activities, matches, notifications)
- [x] Configure RLS policies for all tables
- [x] GitHub repository, branch protection on `main`
- [x] GitHub Actions: CI workflow (typecheck + lint + test)
- [x] EAS project setup; EAS Build preview workflow
- [x] Vercel project setup for `apps/web`
- [x] Import design tokens into `packages/shared/tokens.ts`
- [x] Import Barlow + Barlow Condensed fonts in both apps
- [x] Base component library: Button, Card, Badge, Icon wrapper, Text variants

### Definition of Done
✅ Both apps boot on simulator/browser. CI passes on a trivial PR. Design tokens applied. Empty screens render with correct fonts and colors.

---

## Phase 1 — Auth & Family Profiles (Weeks 3–5) ✅

Goal: a member can register, log in, and set up their family (gezin).

### Tasks

**Auth (mobile + web)**
- [x] Registration screen: naam, e-mailadres, wachtwoord
- [x] Login screen
- [x] Forgot password flow (Supabase magic link)
- [x] Auth guard in Expo Router root layout
- [x] Supabase Auth session persistence via `expo-secure-store`
- [x] CMS auth: login page restricted to `beheerder` / `commissielid` roles

**Profile**
- [x] Profile screen: display name, avatar (upload to Supabase Storage), contact info
- [x] Sport preference (voetbal / hockey / beide)

**Family (Gezin)**
- [x] "Mijn gezin" section in profile tab
- [x] Add family member form: voornaam, achternaam, geboortedatum, sport
- [x] Edit / remove family member
- [x] Family member list with sport badge
- [x] DB: `family_members` table with RLS (own rows only)

### Definition of Done
✅ A user can register, log in, add two family members (e.g. two children on different teams), and see them listed. Session persists across app restarts.

---

## Phase 2 — Activities & Calendar (Weeks 6–9) ✅

Goal: members can see all their (and their family's) upcoming activities in a calendar.

### Tasks

**Data model**
- [x] `activities` table: training, wedstrijd, bardienst, clubactiviteit
- [x] `team_members` linking family members to teams
- [x] `bar_assignments` for bar service obligations

**Calendar screen (Agenda)**
- [x] Monthly calendar view with activity dots per day
- [x] Day detail: list of activities for selected date
- [x] Activity types distinguished by color/icon
- [x] Family filter: "Heel gezin" toggle or per-member filter chip
- [x] Dutch locale: week starts Monday, Dutch month/day names

**Activity detail screen**
- [x] Type, sport badge, team name
- [x] Date, time (24h), location with map link
- [x] Attendees (for bar service: assigned gezinsleden)
- [x] Notes/description

**Bar service (Bardienst)**
- [x] Bar service activity type with assigned family members
- [x] "Bevestigen" confirm button
- [x] Confirmation stored in `bar_assignments.confirmed_at`

**Training**
- [x] Training sessions linked to a team
- [x] Recurring training support (weekly cadence)

### Definition of Done
✅ A family sees all activities across their members in the calendar. Bar service shows which family member is assigned. Switching family filter updates the calendar instantly.

---

## Phase 3 — Home Feed & Push Notifications (Weeks 10–12) ✅

Goal: the home tab shows today's and upcoming activities; push reminders land on device.

### Tasks

**Home feed (Thuisscherm)**
- [x] "Vandaag" section: activities happening today
- [x] "Binnenkort" section: next 7 days
- [x] "Volgende wedstrijd" hero card (nearest match per sport)
- [x] Empty states in Dutch ("Geen activiteiten vandaag")
- [x] Pull-to-refresh

**Push Notifications**
- [x] Request permission on first launch (Expo Notifications)
- [x] Register push token in `push_tokens` table
- [x] Supabase Edge Function `push-trigger`: fires on `notifications` insert, calls Expo Push API
- [x] Notification types: wedstrijd-herinnering (24h before), bardienst-herinnering (48h before), aankondiging
- [x] Notification tap deep-links to relevant screen in Expo Router
- [x] Notification preferences screen (opt in/out per type)

**Scheduled reminders**
- [x] Cron Edge Function `reminder-scheduler`: daily at 06:00, inserts notifications for activities 24h and 48h out
- [x] Handles family-member-level targeting (notify the parent account)

### Definition of Done
✅ Home feed populates from real data. Push notification arrives on device for a test activity 24h in the future. Tapping it opens the activity detail screen.

---

## Phase 4 — Web CMS (Weeks 13–16) ✅

Goal: club staff can manage members, teams, activities, and roles without touching the database.

### Tasks

**CMS shell**
- [x] Responsive sidebar navigation (Dutch labels)
- [x] Role guard: only `beheerder` and `commissielid` can access
- [x] Dashboard overview: counts of leden, teams, upcoming activities

**Leden (members)**
- [x] Member list with search, filter by sport and team
- [x] Member detail view and edit
- [x] CSV import from ClubBase: map columns to `profiles` + `family_members`
- [x] Import preview with validation errors shown before committing
- [x] Duplicate detection on import (e-mail + naam + geboortedatum)

**Teams**
- [x] Team list: name, sport, age category, season
- [x] Create / edit team
- [x] Assign members to a team with role (speler, coach, trainer, teammanager)
- [x] Link federation team ID (for sync)

**Activiteiten**
- [x] Activity list with type and date filters
- [x] Create training: team, date/time, location, recurring option
- [x] Create clubactiviteit: title, date/time, location, sport filter
- [x] Edit / cancel activity (soft delete)
- [x] Bar service: create bardienst activity, assign family members

**Rollen (roles)**
- [x] Assign / revoke role for a member account
- [x] Roles: `lid`, `ouder`, `trainer`, `coach`, `teammanager`, `commissielid`, `beheerder`

### Definition of Done
✅ A beheerder can import 50 members from CSV, create teams, assign members to teams, and create a training session — all without SQL access. New activities appear in the mobile app within seconds (Supabase Realtime).

---

## Phase 5 — Announcements & News (Weeks 17–18) ✅

Goal: club can push news and announcements to all members or targeted groups.

### Tasks

**CMS: Aankondigingen**
- [x] Create announcement: title, body (rich text), target audience (all / sport / team), publish date
- [x] Draft / published states
- [x] Published announcement triggers `announcement-push` Edge Function
- [x] Edge Function fans out push notifications to all matching push tokens

**Mobile: Nieuws tab**
- [x] Announcement list, newest first
- [x] Announcement detail: title, body, published date, author
- [x] Unread indicator (badge on tab)
- [x] Mark as read on open (`notifications.read_at`)
- [x] Filter by sport (voetbal / hockey / club)

**In-app notification center**
- [x] Bell icon in header (profile or home tab)
- [x] List of all received notifications
- [x] Tap to navigate to relevant content

### Definition of Done
✅ A beheerder publishes an announcement targeted at "voetbal". All members with voetbal in their sport preference receive a push notification and see the post in the Nieuws tab.

---

## Phase 6 — Beta, Polish & Launch (Weeks 19–22) ⏳ NOT STARTED

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
⏳ App is live on both stores. Zero P0 crashes in first 48h of production. Push notifications deliver to >95% of registered tokens.

---

## Out of Scope for V1.0

The following are deferred to v1.1 and beyond:

**Federation Integration (v1.1)**
- KNVB and KNHB automatic sync (match schedules, results, standings)
- Match detail screens with scores and status
- Automatic activity creation from federation data
- v1.0 workaround: manual activity creation in CMS

**Other future features (v1.2+)**
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
