# Scenario: Authenticatie

Covers login, registration, password recovery, and logout on the mobile app.

**Prerequisites:** Local Supabase running (`supabase start`), seed data applied (`cd apps/web && pnpm seed`), Expo dev client open on simulator or device.

---

## S01-A — Login with valid credentials

**Goal:** A user with an existing account can log in and reaches the main tabs.

**Steps:**

1. Open the mobile app. The app should open on the login screen ("Welkom terug").
2. Enter email: `e2e-lid@e2e.scmuiden.test`
3. Enter password: `E2eTestWachtwoord123!`
4. Tap the sign-in button.

**Expected result:**

- The login screen closes.
- The bottom tab bar appears with five tabs: Thuis, Agenda, Teams, Nieuws, Profiel.
- The app is on the Thuis tab.

---

## S01-B — Login with wrong password

**Goal:** An incorrect password shows a user-friendly Dutch error message rather than a raw error.

**Steps:**

1. Open the app on the login screen.
2. Enter email: `e2e-lid@e2e.scmuiden.test`
3. Enter password: `VerkeerWachtwoord999`
4. Tap the sign-in button.

**Expected result:**

- The app stays on the login screen.
- An error message is shown in Dutch. It must not contain raw Supabase error text or English.
- The password field is not cleared (the user can correct only the password).

---

## S01-C — Login with unknown email

**Goal:** An email address that has no account shows a clear error.

**Steps:**

1. Open the app on the login screen.
2. Enter email: `bestaat-niet@voorbeeld.nl`
3. Enter password: `WillekeurigWachtwoord1`
4. Tap the sign-in button.

**Expected result:**

- The app stays on the login screen.
- A Dutch error message is shown indicating the credentials are invalid.

---

## S01-D — Register with an email that exists in the members table

**Goal:** A club member whose email is in the `members` table can create an account.

**Setup:** The seed has a `members` row for `e2e-beheerder@e2e.scmuiden.test` but no auth user after `pnpm teardown && pnpm seed` only creates auth users for both accounts. To test fresh registration, insert a new member row via Supabase Studio first:

1. Open Supabase Studio at http://127.0.0.1:54323
2. Navigate to Table Editor → `members`
3. Insert a new row:
   - `first_name`: Nieuw
   - `last_name`: Testlid
   - `email`: nieuw-testlid@e2e.scmuiden.test
   - `role`: lid
   - `sport`: `{voetbal}`
4. Save the row.

**Steps:**

5. Open the app. On the login screen, tap "Registreren" (the register link at the bottom).
6. Fill in the form:
   - Naam: Nieuw Testlid
   - E-mail: `nieuw-testlid@e2e.scmuiden.test`
   - Wachtwoord: `NieuwWachtwoord123!`
   - Wachtwoord bevestigen: `NieuwWachtwoord123!`
7. Tap the submit button.

**Expected result:**

- A success screen is shown explaining that the account has been created.
- Open Supabase Studio → Authentication → Users: the new user appears.
- Open Studio → Table Editor → `profiles`: a row exists with the new user's email and `member_id` linked to the `members` row created in step 3.

---

## S01-E — Register with an email not in the members table

**Goal:** Someone who is not a club member cannot create an account.

**Steps:**

1. From the login screen, tap "Registreren".
2. Fill in the form:
   - Naam: Onbekende Persoon
   - E-mail: `iemand-willekeurig@extern.nl`
   - Wachtwoord: `WachtwoordABC123!`
   - Wachtwoord bevestigen: `WachtwoordABC123!`
3. Tap the submit button.

**Expected result:**

- The app does not create an account.
- An error is shown explaining that the email is not found in the club administration.
- Supabase Studio → Authentication → Users: no new user was created.

---

## S01-F — Register with mismatched passwords

**Goal:** The form prevents submission when the two password fields do not match.

**Steps:**

1. From the login screen, tap "Registreren".
2. Fill in the form:
   - Naam: Test Persoon
   - E-mail: `e2e-lid@e2e.scmuiden.test`
   - Wachtwoord: `WachtwoordA123!`
   - Wachtwoord bevestigen: `WachtwoordB456!`
3. Tap the submit button.

**Expected result:**

- The form does not submit.
- A validation error appears on the password confirmation field in Dutch (e.g. "Wachtwoorden komen niet overeen").

---

## S01-G — Forgot password

**Goal:** A user who forgot their password receives a reset email.

**Steps:**

1. On the login screen, tap the "Wachtwoord vergeten?" link.
2. Enter email: `e2e-lid@e2e.scmuiden.test`
3. Tap the submit button.

**Expected result:**

- A confirmation message is shown saying an email has been sent.
- Open Inbucket at http://127.0.0.1:54324 and find the inbox for `e2e-lid@e2e.scmuiden.test`.
- A password reset email is present containing a reset link.

---

## S01-J — Nieuw wachtwoord instellen via webpagina (vervolg op S01-G)

**Doel:** Een gebruiker die de herstelmail heeft ontvangen, kan via de webpagina een nieuw wachtwoord instellen.

**Vereisten:** S01-G doorlopen; reset-e-mail staat in Inbucket.

**Stappen:**

1. Open Inbucket op http://127.0.0.1:54324.
2. Open de inbox voor `e2e-lid@e2e.scmuiden.test`.
3. Open de reset-e-mail en klik op de herstelkoppeling.
4. De browser navigeert naar `http://localhost:3000/auth/wachtwoord-reset?code=xxx`.
5. Het formulier "Nieuw wachtwoord instellen" verschijnt.
6. Vul in: Nieuw wachtwoord `NieuwWachtwoord123!`, Bevestiging `NieuwWachtwoord123!`.
7. Klik op "Wachtwoord opslaan".

**Verwacht resultaat:**

- De succesmelding "Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS." verschijnt.
- Het formulier is niet meer zichtbaar.

**Verificatie via Supabase Studio:**

- Navigeer naar Table Editor → `profiles`.
- De rij voor `e2e-lid@e2e.scmuiden.test` heeft een gevulde `password_changed_at`.

---

## S01-K — Vervallen herstelkoppeling

**Doel:** Een verlopen of al gebruikte koppeling toont een foutmelding, zonder formulier.

**Stappen:**

1. Navigeer handmatig naar `http://localhost:3000/auth/wachtwoord-reset` (zonder `?code=` parameter).

**Verwacht resultaat:**

- De pagina toont "Deze koppeling is niet meer geldig."
- Er is geen wachtwoordformulier zichtbaar.

---

## S01-H — Logout

**Goal:** A logged-in user can sign out and is returned to the login screen.

**Prerequisites:** Log in first (see S01-A).

**Steps:**

1. Navigate to the Profiel tab.
2. Scroll to the bottom of the profile screen.
3. Tap "Uitloggen".
4. A confirmation dialog appears. Confirm.

**Expected result:**

- The app navigates back to the login screen.
- Pressing the back button does not return to the tabs (the session is cleared).
- Reopening the app from scratch opens the login screen, not the tabs.

---

## S01-I — Session persistence after app restart

**Goal:** A logged-in user stays logged in after closing and reopening the app.

**Prerequisites:** Log in first (see S01-A).

**Steps:**

1. Close the app completely (remove it from the app switcher on the simulator or device).
2. Reopen the app.

**Expected result:**

- The app opens directly on the Thuis tab without showing the login screen.
- The Profiel tab shows the correct display name and email.
