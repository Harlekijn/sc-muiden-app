# Scenario: Gezinslid koppelen

End-to-end flow for linking a family member — from the mobile request through admin review in the CMS to the approved result back on the mobile profile screen.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open and logged in as Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)
- Web CMS running (`cd apps/web && pnpm dev`)

The seed already creates one approved family link (Test Lid ↔ Test Kindlid). This scenario tests the full flow for an *additional* request. We will link a second child member that does not yet have an auth user.

**Setup — create a second child member:**

1. Open Supabase Studio at http://127.0.0.1:54323
2. Table Editor → `members` → Insert row:
   - `first_name`: Tweede
   - `last_name`: Kindlid
   - `email`: _(leave blank)_
   - `role`: lid
   - `sport`: `{hockey}`
   - `clubbase_id`: e2e-child-002
3. Save. Note the UUID of the newly created row — you will need it in step 17.

---

## S03-A — Submit a family link request (mobile)

**Steps:**

1. Log in as Test Lid on the mobile app.
2. Tap the "Profiel" tab.
3. Tap "Gezinslid toevoegen".
4. The form screen "Gezinslid toevoegen" opens. An info card explains that an admin will manually verify and link the correct member record.
5. Fill in:
   - Voornaam: Tweede
   - Achternaam: Kindlid
   - Geboortedatum: _(leave blank — this field is optional)_
6. Tap "Verzoek indienen".

**Expected result:**

- A success confirmation screen is shown: "Verzoek ingediend" with an explanation that the admin will process the request.
- Navigating back to the Profiel tab, the "Mijn gezin" section now shows "Tweede Kindlid" with a clock icon indicating the request is pending.

**Verification via Studio:**

Open Supabase Studio → `family_link_requests`. A new row exists with:
- `first_name`: Tweede
- `last_name`: Kindlid
- `birth_date`: null
- `status`: pending
- `profile_id`: the UUID of the Test Lid profile
- `member_id`: null (not yet linked by admin)

---

## S03-B — Submit with birth date

**Goal:** The optional birth date field is accepted and stored correctly.

**Steps:**

1. On the Profiel tab, tap "Gezinslid toevoegen".
2. Fill in:
   - Voornaam: Derde
   - Achternaam: Kind
   - Geboortedatum: `15-03-2018`
3. Tap "Verzoek indienen".

**Expected result:**

- Success screen is shown.
- Studio → `family_link_requests`: the new row has `birth_date` = `2018-03-15`.

---

## S03-C — Submit with missing required fields

**Goal:** The form does not submit when first or last name is empty.

**Steps:**

1. Tap "Gezinslid toevoegen".
2. Leave "Voornaam" empty.
3. Fill in "Achternaam": Testlid
4. Tap "Verzoek indienen".

**Expected result:**

- The form does not submit.
- A validation error appears on the "Voornaam" field in Dutch.
- No row is created in `family_link_requests`.

---

## S03-D — View pending request in the web CMS (admin)

**Goal:** The admin sees the pending request submitted in S03-A in the CMS dashboard.

**Steps:**

1. Open the web CMS at http://localhost:3000.
2. Log in with beheerder credentials: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`.
3. In the left sidebar, click "Gezinsverzoeken".

**Expected result:**

- The "In Behandeling" section shows the request from S03-A:
  - Requested by: "Test Lid" / `e2e-lid@e2e.scmuiden.test`
  - Family member: "Tweede Kindlid"
  - Birth date: "–" (no date was entered)
  - Status badge: pending (yellow)
- If S03-B was also run, a second row appears for "Derde Kind" with birth date shown.

---

## S03-E — Admin links and approves the request (via Supabase Studio)

**Goal:** The admin links the pending request to the correct member record and approves it.

> The CMS currently shows requests but does not yet have an approve button in the UI. Approval is done directly in Supabase Studio until phase 5 implements the admin action.

**Steps:**

1. Open Supabase Studio at http://127.0.0.1:54323.
2. Navigate to Table Editor → `family_link_requests`.
3. Find the row for "Tweede Kindlid" (status: pending, profile is Test Lid).
4. Edit the row:
   - `member_id`: paste the UUID of the "Tweede Kindlid" member row (created in the setup above)
   - `status`: `approved`
5. Save the row.
6. Now navigate to Table Editor → `user_family_members`.
7. Insert a new row:
   - `profile_id`: the UUID of the Test Lid profile (find it in `profiles` by email)
   - `member_id`: the UUID of the "Tweede Kindlid" member row
8. Save the row.

**Expected result:**

- `family_link_requests` row: `status = approved`, `member_id` is populated.
- `user_family_members`: a new row exists linking Test Lid's profile to the Tweede Kindlid member.

---

## S03-F — Approved link appears on the mobile profile (mobile)

**Goal:** After admin approval, the family member appears on the profile screen without a pending indicator.

**Steps:**

1. Return to the mobile app (still logged in as Test Lid).
2. Navigate away from Profiel and back (or pull to refresh if supported) to trigger a data reload.
3. View the "Mijn gezin" section on the Profiel tab.

**Expected result:**

- "Tweede Kindlid" is now shown in the family list **without** a clock icon.
- The "Hockey" sport badge is shown for Tweede Kindlid.
- The original clock icon entry for "Tweede Kindlid" is gone (the pending request was resolved).
- "Test Kindlid" (from the seed) is still shown as before.

---

## S03-G — Reject a family link request (via Supabase Studio)

**Goal:** A rejected request is reflected correctly on the mobile app and in the CMS.

**Setup:** Submit another request (follow S03-A steps with name "Vierde Kind") to create a new pending request.

**Steps:**

1. In Supabase Studio → `family_link_requests`, find the "Vierde Kind" row.
2. Edit the row:
   - `status`: `rejected`
3. Save.

**Expected result:**

- Studio → `family_link_requests`: status is `rejected`, `member_id` remains null.
- Studio → `user_family_members`: no new row was added.
- Web CMS → Gezinsverzoeken: the "Vierde Kind" row moves to the "Afgehandeld" section with a rejected (red) status badge.
- Mobile app: the "Vierde Kind" entry with the clock icon disappears from the Profiel screen (pending requests are shown; rejected requests are not displayed on the mobile profile).
