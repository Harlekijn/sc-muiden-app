# Class Structure

Overview of the main domain entities in the SC Muiden App, the Supabase tables that back them, and the relationships between them.

Sources:
- Supabase migrations in [supabase/migrations/](../supabase/migrations/)
- Generated DB types: [packages/shared/src/types/db.types.ts](../packages/shared/src/types/db.types.ts)
- Domain types: [packages/shared/src/types/app.types.ts](../packages/shared/src/types/app.types.ts)
- Federation types: [packages/shared/src/types/federation.types.ts](../packages/shared/src/types/federation.types.ts)

---

## Diagram

```mermaid
classDiagram
    direction LR

    %% ── Identity & family ───────────────────────────────────────────
    class Profile {
      +uuid id  (= auth.users.id)
      +string display_name
      +string email
      +string phone
      +string avatar_url
      +UserRole role
      +Sport[] sport
      +uuid member_id
      +timestamptz password_changed_at
      +timestamps
    }
    note for Profile "table: profiles\nUserRole = 'lid' | 'beheerder'\nLinks an auth.users account to one optional Member."

    class Member {
      +uuid id
      +string first_name
      +string last_name
      +date birth_date
      +string email
      +string phone
      +Sport[] sport
      +LidType lid_type
      +bool is_vrijwilliger
      +bool is_barcommissie
      +string clubbase_id
      +string ouder_email_1
      +string ouder_email_2
      +timestamps
    }
    note for Member "table: members\nLidType = 'spelend-lid' | 'niet-spelend-lid' | 'relatie'\nImported from ClubBase CSV."

    class UserFamilyMember {
      +uuid id
      +uuid profile_id
      +uuid member_id
      +timestamptz linked_at
    }
    note for UserFamilyMember "table: user_family_members\nA Profile can be linked to many Members (ouder ↔ kinderen)."

    class FamilyLinkRequest {
      +uuid id
      +uuid profile_id
      +string first_name
      +string last_name
      +date birth_date
      +uuid member_id
      +FamilyLinkStatus status
      +string admin_notes
      +uuid reviewed_by
      +timestamps
    }
    note for FamilyLinkRequest "table: family_link_requests\nStatus = 'pending' | 'approved' | 'rejected'"

    class AccountRequest {
      +uuid id
      +string display_name
      +string email
      +date birth_date
      +AccountRequestStatus status
      +string admin_notes
      +uuid reviewed_by
      +timestamptz reviewed_at
      +timestamps
    }
    note for AccountRequest "table: account_requests\nSelf-signup queue, reviewed by beheerder."

    %% ── Teams ───────────────────────────────────────────────────────
    class Team {
      +uuid id
      +string name
      +Sport sport
      +string age_category
      +string season
      +string federation_team_id
      +timestamps
    }
    note for Team "table: teams"

    class TeamMember {
      +uuid id
      +uuid team_id
      +uuid member_id
      +TeamMemberRole role
      +int jersey_number
      +timestamps
    }
    note for TeamMember "table: team_members\nRole = 'speler' | 'trainer' | 'coach' | 'teammanager'"

    %% ── Activities & scheduling ─────────────────────────────────────
    class Activity {
      +uuid id
      +ActivityType type
      +Sport sport
      +uuid team_id
      +uuid recurring_rule_id
      +uuid bar_day_slot_id
      +string title
      +timestamptz starts_at
      +timestamptz ends_at
      +string location
      +string notes
      +timestamps
    }
    note for Activity "table: activities\nType = 'training' | 'wedstrijd' | 'bardienst' | 'clubactiviteit'"

    class RecurringRule {
      +uuid id
      +uuid team_id
      +int day_of_week  (1=ma..7=zo)
      +time start_time
      +time end_time
      +string location
      +string notes
      +date valid_from
      +date valid_until
      +timestamps
    }
    note for RecurringRule "table: recurring_rules\nGenerates training Activities for a Team."

    class Match {
      +uuid id
      +uuid activity_id
      +uuid team_id
      +string federation_match_id
      +FederationSource federation_source
      +string home_team
      +string away_team
      +int score_home
      +int score_away
      +MatchStatus status
      +timestamptz played_at
      +jsonb raw_data
      +timestamps
    }
    note for Match "table: matches\nStatus = 'gepland' | 'live' | 'gespeeld' | 'afgelast'\nFederationSource = 'knvb' | 'knhb'"

    %% ── Bardienst rooster ───────────────────────────────────────────
    class BarDaySlot {
      +uuid id
      +date date
      +time starts_at
      +time ends_at
      +Sport sport
      +string season
      +string notes
      +timestamps
    }
    note for BarDaySlot "table: bar_day_slots\nA bar-day window; null sport = club-breed."

    class BarAssignment {
      +uuid id
      +uuid activity_id
      +uuid member_id
      +timestamptz confirmed_at
      +timestamptz created_at
    }
    note for BarAssignment "table: bar_assignments\nLinks a Member to a 'bardienst' Activity."

    %% ── Communicatie ────────────────────────────────────────────────
    class Announcement {
      +uuid id
      +string title
      +string body
      +Sport[] sport
      +uuid[] teams
      +timestamptz published_at
      +uuid author_id
      +timestamps
    }
    note for Announcement "table: announcements\nteams[] is a soft array filter, not a FK."

    class Notification {
      +uuid id
      +uuid recipient_profile_id
      +uuid activity_id
      +NotificationType type
      +string title
      +string body
      +jsonb data
      +timestamptz sent_at
      +timestamptz read_at
    }
    note for Notification "table: notifications\nType = 'wedstrijd_herinnering' | 'bardienst_herinnering' | 'training_herinnering' | 'aankondiging'"

    class NotificationPreferences {
      +uuid id
      +uuid profile_id  (unique)
      +bool wedstrijd
      +bool bardienst
      +bool training
      +bool aankondiging
      +timestamps
    }
    note for NotificationPreferences "table: notification_preferences\n1:1 with Profile."

    class PushToken {
      +uuid id
      +uuid profile_id
      +string token
      +Platform platform
      +timestamps
    }
    note for PushToken "table: push_tokens\nPlatform = 'ios' | 'android'"

    %% ── Federation sync ─────────────────────────────────────────────
    class SyncLog {
      +uuid id
      +Sport sport
      +string triggered_by  (cron|manual)
      +timestamptz started_at
      +timestamptz finished_at
      +int records_updated
      +string error
    }
    note for SyncLog "table: sync_log\nWritten by edge function 'federation-sync'."

    class KNVBMatch {
      <<external>>
      +string id
      +string homeTeam
      +string awayTeam
      +int homeScore
      +int awayScore
      +string scheduledAt
      +string venue
      +string status
    }
    class KNHBMatch {
      <<external>>
      +string id
      +string homeTeam
      +string awayTeam
      +int homeScore
      +int awayScore
      +string scheduledAt
      +string venue
      +string status
    }
    class KNVBStandings {
      <<external>>
      +string teamId
      +string season
      +KNVBStanding[] standings
    }
    note for KNVBMatch "Wire format from federation API\n→ normalised into Match."

    %% ── Relationships ───────────────────────────────────────────────
    Profile "1" --> "0..1" Member : member_id (primary)
    Profile "1" --> "0..*" UserFamilyMember
    Member  "1" --> "0..*" UserFamilyMember
    Profile "1" --> "0..*" FamilyLinkRequest : profile_id
    Member  "1" --> "0..*" FamilyLinkRequest : member_id (resolved)
    Profile "1" --> "0..*" FamilyLinkRequest : reviewed_by
    Profile "1" --> "0..*" AccountRequest : reviewed_by

    Team    "1" --> "0..*" TeamMember
    Member  "1" --> "0..*" TeamMember
    Team    "1" --> "0..*" RecurringRule
    Team    "1" --> "0..*" Activity     : team_id
    Team    "1" --> "0..*" Match        : team_id

    RecurringRule "1" --> "0..*" Activity : recurring_rule_id
    Activity "1" --> "0..1" Match         : activity_id
    Activity "1" --> "0..*" BarAssignment
    Member   "1" --> "0..*" BarAssignment
    BarDaySlot "1" --> "0..*" Activity    : bar_day_slot_id

    Profile "1" --> "0..*" Announcement   : author_id
    Profile "1" --> "0..*" Notification   : recipient_profile_id
    Activity "1" --> "0..*" Notification  : activity_id
    Profile "1" --> "1"     NotificationPreferences
    Profile "1" --> "0..*" PushToken

    KNVBMatch ..> Match : normalised
    KNHBMatch ..> Match : normalised
    KNVBStandings ..> Team : keyed by federation_team_id
```

---

## Domain groups

### Identity & family

| Class | Table | Purpose |
|---|---|---|
| `Profile` | `profiles` | Extends `auth.users` with display name, role and a primary `member_id`. Created on signup via `handle_new_user` trigger ([20260515115558_fix_handle_new_user_trigger.sql](../supabase/migrations/20260515115558_fix_handle_new_user_trigger.sql)). |
| `Member` | `members` | Person record imported from ClubBase. Independent of auth — a Member can exist without a login. Carries flags `is_vrijwilliger`, `is_barcommissie` and `lid_type` used by the bardienst-roster. |
| `UserFamilyMember` | `user_family_members` | Many-to-many link between a `Profile` (e.g. an ouder) and the `Member` rows for their kinderen. Drives the family-aggregated activity feed. |
| `FamilyLinkRequest` | `family_link_requests` | Pending request from a user to be linked to a `Member`; resolved by a `beheerder`. |
| `AccountRequest` | `account_requests` | Self-signup queue ([20260513161501_account_requests.sql](../supabase/migrations/20260513161501_account_requests.sql)). |

`Profile.member_id` is the *own* Member of the account holder; additional family members live in `user_family_members`.

### Teams

| Class | Table | Purpose |
|---|---|---|
| `Team` | `teams` | A team for a season + sport (voetbal of hockey), optionally linked to a federation team via `federation_team_id`. |
| `TeamMember` | `team_members` | Junction of `Member` ↔ `Team` with a role (`speler`, `trainer`, `coach`, `teammanager`) and optional jersey number. |

### Activities & scheduling

| Class | Table | Purpose |
|---|---|---|
| `Activity` | `activities` | Single source of truth for everything that appears on the calendar: trainings, wedstrijden, bardiensten, clubactiviteiten. |
| `RecurringRule` | `recurring_rules` | Weekly recurrence (e.g. "elke dinsdag 19:00") that materialises into `Activity` rows for a `Team`. |
| `Match` | `matches` | Wedstrijd-specific data (score, status, home/away). Optionally tied to an `Activity` and a `Team`. Sourced from federation sync. |

`Activity.bar_day_slot_id` ties bardienst-activiteiten back to the bar-day window they belong to.

### Bardienst rooster

| Class | Table | Purpose |
|---|---|---|
| `BarDaySlot` | `bar_day_slots` | A bar day with a date + open/close time + season; introduced in [20260515052815_bardienst_rooster.sql](../supabase/migrations/20260515052815_bardienst_rooster.sql). `sport = null` betekent club-breed. |
| `BarAssignment` | `bar_assignments` | Assignment of a `Member` to a `bardienst` `Activity`, optionally `confirmed_at`. |

The roster generator produces a `BarRosterPreview` (in-memory shape, not a table) shaped as `BarShift[]` per `BarDaySlot`.

### Communicatie

| Class | Table | Purpose |
|---|---|---|
| `Announcement` | `announcements` | Aankondiging gericht op alle leden, een sport, of een set teams (soft array filter). |
| `Notification` | `notifications` | Individuele push-/in-app notificatie voor één `Profile`. Inserted by app code; delivery is fired by edge function `push-trigger`. |
| `NotificationPreferences` | `notification_preferences` | 1:1 voorkeuren per `Profile` voor de vier notificatietypes. |
| `PushToken` | `push_tokens` | Expo push token per device. |

### Federation sync

| Class | Source | Purpose |
|---|---|---|
| `SyncLog` | `sync_log` | Audit trail for federation-sync runs. |
| `KNVBMatch`, `KNHBMatch`, `KNVBStandings` | external API DTOs | Wire formats from KNVB/KNHB. Normalised into `Match` and standings views; the app never calls federation APIs directly. |

---

## Type ↔ table mapping

The TypeScript domain interfaces in [app.types.ts](../packages/shared/src/types/app.types.ts) are the canonical shapes used by the mobile app and CMS. Each maps 1:1 to a Supabase table:

| Domain type | Table |
|---|---|
| `Profile` | `profiles` |
| `Member` | `members` |
| `UserFamilyMember` | `user_family_members` |
| `FamilyLinkRequest` | `family_link_requests` |
| `AccountRequest` | `account_requests` |
| `Team` | `teams` |
| `TeamMember` | `team_members` |
| `Activity` | `activities` |
| `RecurringRule` | `recurring_rules` |
| `Match` | `matches` |
| `BarDaySlot` | `bar_day_slots` |
| `BarAssignment` | `bar_assignments` |
| `Announcement` | `announcements` |
| `Notification` / `NotificationWithMeta` | `notifications` |
| `NotificationPreferences` | `notification_preferences` |
| `PushToken` | `push_tokens` |
| `SyncLog` | `sync_log` |

Composite/UI types (`ActivityWithDetails`, `BarAssignmentWithMember`, `TeamWithMemberCount`, `BarRosterPreview`, `MatchWithActivity`, `CsvImportRow`/`CsvImportResult`, `DashboardStats`) are derived shapes and have no table of their own.
