# Scenario: Profiel

Covers viewing, editing, and the avatar upload on the mobile profile screen.

**Prerequisites:** Local Supabase running, seed data applied, logged in as Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`).

---

## S02-A — View profile

**Goal:** The profile screen shows the correct personal data from the database.

**Steps:**

1. Log in as Test Lid.
2. Tap the "Profiel" tab.

**Expected result:**

- The avatar circle shows the initials "TL" (Test Lid).
- The display name shown is "Test Lid".
- The email shown is `e2e-lid@e2e.scmuiden.test`.
- Under "Sport" there is one badge: "Voetbal".
- Under "Mijn gezin" the child member "Test Kindlid" is visible (this family link is pre-created by the seed). No clock icon appears next to this name — it is an approved link, not a pending request.
- A "Gezinslid toevoegen" button is visible below the family section.
- An "Uitloggen" button is visible at the bottom.

**Verification via Studio:**

Open Supabase Studio → Table Editor → `profiles`. The row for `e2e-lid@e2e.scmuiden.test` should show:
- `role`: lid
- `sport`: `{voetbal}`
- `member_id`: the UUID of the lid member row in the `members` table

---

## S02-B — Edit display name

**Goal:** A user can change their display name and the change persists.

**Steps:**

1. On the Profiel tab, tap "Bewerken" next to the personal data section.
2. The edit screen opens with the current display name pre-filled ("Test Lid").
3. Clear the field and type: `Test Lid Gewijzigd`
4. Tap the save button.

**Expected result:**

- The edit screen closes and the profile screen is shown again.
- The display name at the top of the profile screen now reads "Test Lid Gewijzigd".
- Open Supabase Studio → `profiles` → the `display_name` column for this user shows "Test Lid Gewijzigd".

**Cleanup:** Repeat the flow to restore the name to "Test Lid" if needed for other scenarios.

---

## S02-C — Edit display name with invalid input

**Goal:** The edit form rejects names that are too short.

**Steps:**

1. On the Profiel tab, tap "Bewerken".
2. Clear the name field and type a single character: `X`
3. Tap the save button.

**Expected result:**

- The form does not save.
- A validation error appears on the name field in Dutch.
- Supabase Studio shows the `display_name` is unchanged.

---

## S02-D — Upload a profile avatar

**Goal:** A user can upload a photo and it appears as their avatar.

**Prerequisites:** Have a small JPEG or PNG image available on the simulator (you can save one from Safari within the simulator).

**Steps:**

1. On the Profiel tab, tap the avatar circle (the initials circle at the top).
2. The image picker opens. Select a photo from the library.
3. The picker closes.

**Expected result:**

- The avatar circle now displays the selected photo instead of the initials.
- Open Supabase Studio → Storage → `avatars`. A folder named after the user's auth UID exists, and a file has been uploaded inside it.
- The `profiles` row for this user has `avatar_url` set to a non-null path.

---

## S02-E — View family member from seed (approved link)

**Goal:** The pre-seeded approved family link between Test Lid and Test Kindlid is visible on the profile screen.

**Steps:**

1. Log in as Test Lid.
2. Navigate to the Profiel tab.
3. Locate the "Mijn gezin" section.

**Expected result:**

- "Test Kindlid" is listed.
- There is no clock or "pending" indicator next to the name.
- "Voetbal" sport badge is shown for Test Kindlid.

**Verification via Studio:**

Open Supabase Studio → `user_family_members`. A single row exists linking:
- `profile_id`: the UUID of the lid profile
- `member_id`: the UUID of the kindlid member (`clubbase_id = e2e-child-001`)
