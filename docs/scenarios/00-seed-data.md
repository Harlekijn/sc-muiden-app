# Seed Data Reference

All scenario documents reference the fixtures created by the canonical seed script. Run the seed before executing any scenario.

```bash
cd apps/web
pnpm seed
```

To reset to a clean state:

```bash
pnpm teardown
pnpm seed
```

---

## Fixtures created by the seed

### Auth users (can log in)

| Name | Email | Password | Role |
|---|---|---|---|
| Test Beheerder | `e2e-beheerder@e2e.scmuiden.test` | `E2eTestWachtwoord123!` | beheerder |
| Test Lid | `e2e-lid@e2e.scmuiden.test` | `E2eTestWachtwoord123!` | lid |

### Member records

| Display name | Email | Role | Sport | Notes |
|---|---|---|---|---|
| Test Beheerder | `e2e-beheerder@e2e.scmuiden.test` | beheerder | — | Has an auth user and profile |
| Test Lid | `e2e-lid@e2e.scmuiden.test` | lid | voetbal | Has an auth user and profile |
| Test Kindlid | _(none)_ | lid | voetbal | No auth user; identified by `clubbase_id = e2e-child-001` |

### Family links

| Profile (parent) | Member (child) | Status |
|---|---|---|
| Test Lid | Test Kindlid | approved |

The `user_family_members` row already exists after seeding — Test Lid's profile screen shows Test Kindlid as an approved family member without any pending request.

---

### Teams (added in Phase 2)

| Name | Sport | Age category | Season | Notes |
|---|---|---|---|---|
| E2E Voetbalteam JO11-1 | voetbal | JO11 | 2025/2026 | `clubbase_id = e2e-team-001`; Test Kindlid is speler via `team_members` |

### Activities (added in Phase 2)

All activities are seeded relative to the seed run date (`TODAY`). Adjust manually if the fixed dates fall outside the current month.

| Title | Type | Sport | Team | Starts at | Notes |
|---|---|---|---|---|---|
| Training JO11-1 | training | voetbal | E2E Voetbalteam JO11-1 | TODAY 09:00 | Location: "Sportpark De Volharding" |
| Wedstrijd JO11-1 vs FC Diemen | wedstrijd | voetbal | E2E Voetbalteam JO11-1 | TODAY+2 14:00 | Linked `matches` record; status: gepland |
| Bardienst zaterdag | bardienst | — | — (clubbreed) | TODAY+7 12:00 | Bar_assignment for Test Kindlid (not confirmed) |
| Ledenvergadering SC Muiden | clubactiviteit | — | — (clubbreed) | TODAY+3 20:00 | No team; visible to all members |

### Bar assignments (added in Phase 2)

| Activity | Family member | Confirmed |
|---|---|---|
| Bardienst zaterdag | Test Kindlid | No (confirmed_at = null) |

---

## What the seed does NOT create

- Any pending `family_link_requests` — the scenarios that test the request flow start from a clean slate.
- Any extra auth users beyond the two above — the register scenario requires a member record with an email that does not yet have an auth user. The beheerder member email can be used for this if you run teardown first (removes auth users but not members), though typically you add a fresh member row in Supabase Studio for registration testing.
- Any announcements, push tokens, or sync logs — those tables are empty after seeding.

---

## URLs and ports

| Service | URL |
|---|---|
| Mobile app (Expo dev server) | Started via `pnpm start` in `apps/mobile`, then press `i` |
| Web CMS | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Inbucket (email) | http://127.0.0.1:54324 |
