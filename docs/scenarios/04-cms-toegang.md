# Scenario: CMS toegangscontrole

Covers authentication and role-based access control on the web CMS dashboard.

**Prerequisites:** Local Supabase running, seed data applied, web CMS running at http://localhost:3000.

---

## S04-A — Unauthenticated access is redirected to login

**Goal:** Visiting any dashboard URL without a session sends the user to the login page.

**Steps:**

1. Open an incognito/private browser window.
2. Navigate directly to http://localhost:3000/dashboard.

**Expected result:**

- The browser redirects to http://localhost:3000/login.
- The login page is shown (not a 404 or error page).

**Steps (sub-path):**

3. Try http://localhost:3000/dashboard/gezinsverzoeken in the same incognito window.

**Expected result:**

- Same redirect to `/login`.

---

## S04-B — Login as beheerder grants dashboard access

**Goal:** An account with role `beheerder` can log into the CMS and sees the full dashboard.

**Steps:**

1. Navigate to http://localhost:3000/login.
2. Enter email: `e2e-beheerder@e2e.scmuiden.test`
3. Enter password: `E2eTestWachtwoord123!`
4. Click the login button.

**Expected result:**

- The browser redirects to http://localhost:3000/dashboard.
- The dashboard layout is visible: a left sidebar with navigation and a main content area.
- The sidebar shows links: Dashboard, Leden, Teams, Activiteiten, Aankondigingen, Gezinsverzoeken, Rollen, Instellingen.
- The main content area shows the dashboard overview (currently a placeholder "Overzicht volgt in fase 5").
- The "Geen toegang" error screen is **not** shown.

---

## S04-C — Login as lid is blocked from the dashboard

**Goal:** An account with role `lid` reaches the dashboard URL but is shown an access denied message — not an empty dashboard.

**Steps:**

1. Navigate to http://localhost:3000/login.
2. Enter email: `e2e-lid@e2e.scmuiden.test`
3. Enter password: `E2eTestWachtwoord123!`
4. Click the login button.

**Expected result:**

- The browser redirects to http://localhost:3000/dashboard.
- The "Geen toegang" screen is shown with a message explaining that the account does not have admin rights and a link to contact the SC Muiden administrator.
- A logout link is visible on the access-denied screen.
- The sidebar navigation and dashboard content are **not** shown.

---

## S04-D — Login with wrong password shows Dutch error

**Goal:** Incorrect credentials on the CMS login form show a user-friendly Dutch error.

**Steps:**

1. Navigate to http://localhost:3000/login.
2. Enter email: `e2e-beheerder@e2e.scmuiden.test`
3. Enter password: `FoutWachtwoord999`
4. Click the login button.

**Expected result:**

- The login page stays on screen.
- A Dutch error message is displayed. It must not be a raw English Supabase error string.
- No redirect occurs.

---

## S04-E — Navigate to Gezinsverzoeken as beheerder

**Goal:** A beheerder can reach the family requests page and sees the correct content.

**Prerequisites:** Logged in as beheerder (S04-B). At least one `family_link_requests` row exists (run scenario S03-A first, or insert one manually in Studio).

**Steps:**

1. In the CMS sidebar, click "Gezinsverzoeken".

**Expected result:**

- The URL changes to http://localhost:3000/dashboard/gezinsverzoeken.
- The page title "Gezinsverzoeken" is shown.
- An explanation text is visible describing the manual approval process.
- The "In Behandeling" section shows any pending requests with columns: requested by, family member name, birth date, submitted on, status.
- The "Afgehandeld" section shows any approved or rejected requests (dimmed).
- Status badges use appropriate colours: yellow for pending, green for approved, red for rejected.

---

## S04-F — Empty state: no family requests

**Goal:** The Gezinsverzoeken page shows a meaningful state when there are no requests.

**Prerequisites:** Logged in as beheerder. Ensure `family_link_requests` table is empty (run `pnpm teardown && pnpm seed` which removes all requests, then do not run S03-A).

**Steps:**

1. Navigate to Gezinsverzoeken in the CMS sidebar.

**Expected result:**

- The page loads without error.
- The "In Behandeling" section shows 0 items or an empty state message.
- The "Afgehandeld" section shows 0 items or an empty state message.

---

## S04-G — Dashboard pages that are placeholders

**Goal:** Confirm that placeholder pages load without error and show the correct Dutch placeholder text.

**Note:** After Phase 5 is implemented, pages Leden, Teams, Activiteiten en Rollen tonen geen placeholder meer maar echte content. Aankondigingen (fase 6) en Instellingen behouden hun placeholder.

**Prerequisites:** Logged in as beheerder.

**Steps:**

1. Click each item in the sidebar one at a time:
   - Dashboard (home)
   - Leden
   - Teams
   - Activiteiten
   - Aankondigingen
   - Rollen
   - Instellingen

**Expected result per page:**

| Page | Na fase 5 verwacht |
|---|---|
| Dashboard | Telkaarten + aankomende activiteiten |
| Leden | Ledenlijst met zoeken + filter |
| Teams | Teamslijst met "Nieuw team"-knop |
| Activiteiten | Activiteitenlijst met filters |
| Aankondigingen | "Aankondigingenbeheer volgt in fase 6" |
| Rollen | Rollenlijst (beheerder) of GeenToegang (commissielid) |
| Instellingen | Synchronisatiepagina (fase 4) |

No page should return a 404 or throw an unhandled error.

---

## S04-H — Gebruiker met rol 'lid' heeft geen toegang tot het CMS

**Goal:** Een gebruiker met `role = 'lid'` bereikt `/dashboard` maar ziet de "Geen toegang"-component — niet het dashboard.

**Note:** De rol 'commissielid' bestaat niet meer na de vereenvoudiging van het rolsysteem (zie design `leden-rollen`). Het systeem kent nu twee rollen: `lid` (alleen app) en `beheerder` (app + CMS).

**Prerequisites:** Ingelogd als lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`).

**Steps:**

1. Navigeer naar `/login` en log in als lid.
2. Navigeer naar `/dashboard`.

**Expected result:**

- De "Geen toegang"-component is zichtbaar.
- Er is geen sidebar of dashboardnavigatie zichtbaar.
- Een uitlogknop is aanwezig.
- Geen data uit de DB wordt getoond.

**Verificatie via Supabase Studio:**

```sql
SELECT role FROM profiles WHERE email = 'e2e-lid@e2e.scmuiden.test';
```
→ Verwacht: `lid`
