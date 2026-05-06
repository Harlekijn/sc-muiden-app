# /sre — Production Readiness Audit

Audit a SC Muiden feature for production readiness: logging, monitoring, error handling, security, and bundle impact. Documents findings and fixes inline. Appends an SRE Notes section to the feature's design document.

## Usage

```
/sre <feature-slug>
/sre wedstrijd-herinnering
```

---

## Instructions

The feature slug is: **$ARGUMENTS**

If $ARGUMENTS is empty, ask: "Welke feature slug wil je auditen? (bijv. `wedstrijd-herinnering`)" Wait for the answer.

Read `docs/designs/<feature-slug>.md`. If it does not exist, stop:
"Geen design document gevonden voor `<feature-slug>`. Voer eerst `/design <feature-slug>` uit."

Also read `CLAUDE.md` and `docs/TESTING_STRATEGY.md` before starting.

Identify all implementation files introduced by this feature using:
```
git diff main...HEAD --name-only
```

Run each check below in sequence. Output the result of each check immediately as you complete it. Fix issues inline — do not collect all findings and fix later.

---

### Check 1 — Logging

For every edge function and server-side API route in the feature:

**Verify and fix:**
- [ ] No `console.log`, `console.error`, or `logger.info` statement includes: email addresses, member names, member IDs, birth dates, location data, or any column from `members`, `profiles`, `user_family_members`, or `push_tokens` tables
- [ ] Log statements include only: event type (string), timestamp, outcome (`success` / `failure`), and — if useful — a sport label (`voetbal` / `hockey`)
- [ ] Supabase's built-in audit log is the primary data-access log — application logs do not duplicate it
- [ ] Each edge function logs its start time and end time (for execution duration tracking)

If a log statement contains PII: rewrite it to log only the event type and outcome. Show the before/after diff.

Output: "Check 1 Logging — [GESLAAGD / N problemen opgelost]"

---

### Check 2 — Monitoring

For each new database table introduced by this feature:

**Verify and add if missing:**
- [ ] Index on every foreign key column (`CREATE INDEX IF NOT EXISTS ...`)
- [ ] Index on every column used in RLS policy `USING (...)` or `WITH CHECK (...)` clauses
- [ ] Index on `created_at` if the table is queried with date-range filters
- [ ] No RLS policy that results in a full table scan (every policy must filter by `auth.uid()` or a fixed value)

For each React Query hook introduced by this feature:

**Verify:**
- [ ] `staleTime` is set explicitly (not the default 0 for all queries — static data should use at least 5 minutes)
- [ ] `select` is used to fetch only the columns that the UI actually displays

For each edge function introduced by this feature:

**Verify:**
- [ ] Execution start time is recorded at the top of the handler
- [ ] A `sync_log` row or equivalent audit record is written on completion

If any index is missing: create an additional migration file `supabase/migrations/<timestamp>_add_<feature>_indexes.sql`.

Output: "Check 2 Monitoring — [GESLAAGD / N problemen opgelost]"

---

### Check 3 — Error handling

For each user-facing error state in the feature's UI:

**Verify and fix:**
- [ ] Error message is in Dutch
- [ ] Error message does not contain raw Supabase error text (e.g. "duplicate key value violates unique constraint"), HTTP status codes, or English strings
- [ ] Error message tells the user what to do next — not just what went wrong
- [ ] Network / connectivity errors display: "Geen verbinding — controleer je internetverbinding en probeer opnieuw."
- [ ] Authentication errors (session expired, 401) redirect to the login screen rather than showing a raw error

For each mutation or form submission:

**Verify:**
- [ ] Optimistic updates (if used) are rolled back when the mutation fails
- [ ] The submit button is disabled while the mutation is in-flight (no double-submit)
- [ ] Success feedback is shown only after receiving server confirmation — not immediately on submit

Fix any violations inline. Show the changed file and line.

Output: "Check 3 Foutafhandeling — [GESLAAGD / N problemen opgelost]"

---

### Check 4 — Security

For each new RLS policy introduced by the feature:

**Verify:**
- [ ] Every policy references `auth.uid()` — no policy allows access without authentication unless intentional (public data only)
- [ ] No `USING (true)` on tables that contain personal data
- [ ] INSERT policies prevent users from setting `profile_id`, `member_id`, or any ownership column to a value other than `auth.uid()` (or a value derived from it)
- [ ] Admin-approval pattern is enforced for `user_family_members` and `family_link_requests` — non-admin users cannot directly approve or modify others' family links
- [ ] DELETE is restricted to `beheerder` or record owner — no broad delete access

For each new API route or edge function:

**Verify:**
- [ ] All input is validated with Zod before any database write
- [ ] No secret key appears in `EXPO_PUBLIC_` or `NEXT_PUBLIC_` environment variables
- [ ] `SUPABASE_SECRET_KEY` is used only in server-side code (CMS API routes or edge functions) — never in `apps/mobile/`
- [ ] No KNVB or KNHB API keys appear in mobile or web client bundles

For each new form with file uploads (avatars, documents):

**Verify:**
- [ ] MIME type is validated on the client and enforced in Supabase Storage bucket policy
- [ ] File size is limited on the client and in the bucket policy

If any violation is found: fix it inline. Show the changed file and line.

Output: "Check 4 Beveiliging — [GESLAAGD / N problemen opgelost]"

---

### Check 5 — Bundle size (mobile only)

If the feature adds new packages to `apps/mobile/package.json` or `package.json` at the root that affect the mobile bundle:

- List each new package
- Check if it is larger than 50 KB gzipped by running: `npx bundlephobia-cli <package-name>` (if available) or note the approximate size from the package README
- Flag any package over 50 KB as a review item with a comment in the design doc
- Verify no packages with known React Native incompatibilities were added

If no new packages were added: skip this check.

Output: "Check 5 Bundle — [GESLAAGD / geen nieuwe packages / N items ter review]"

---

### Step 2 — Document findings

Append an `## SRE Notes` section to `docs/designs/<feature-slug>.md`:

```markdown
## SRE Notes

**Datum:** <today's date in format DD-MM-YYYY>

### Logging
<pass/items fixed — one line each>

### Monitoring
<indexes verified or added — one line each>

### Foutafhandeling
<Dutch error strings verified or corrected — one line each>

### Beveiliging
<RLS policy review, secret handling, input validation — one line each>

### Bundle
<new packages and their impact, or "geen nieuwe packages">

### Openstaande punten
<any items requiring follow-up before production, or "geen">
```

---

### Step 3 — Verify nothing broke

After all fixes, run:
```
pnpm typecheck
pnpm test
```

Fix any regressions before reporting completion.

---

### Step 4 — Done

Output:

"SRE audit voor `<feature-slug>` voltooid.

- Logging: [resultaat]
- Monitoring: [resultaat]
- Foutafhandeling: [resultaat]
- Beveiliging: [resultaat]
- Bundle: [resultaat]

Bevindingen gedocumenteerd in `docs/designs/<feature-slug>.md`.

Klaar voor Phase 4 — voer uit: `/pr-gate <feature-slug>`"
