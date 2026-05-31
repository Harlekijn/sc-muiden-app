# Scenario: Aankondigingen & Nieuws

End-to-end flows voor het aanmaken en publiceren van aankondigingen in het CMS, het lezen van nieuws in de app, het notificatiecentrum en de aankondigingsinstellingen.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat: beheerder-account, commissielid-account, 2 leden-accounts (1 voetbal, 1 hockey)
- CMS open in browser
- Beheerder-account: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- Commissielid-account: `e2e-commissielid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- Voetbal-lid: `e2e-voetbal@e2e.scmuiden.test` / `E2eTestWachtwoord123!` (sport = ['voetbal'])
- Hockey-lid: `e2e-hockey@e2e.scmuiden.test` / `E2eTestWachtwoord123!` (sport = ['hockey'])

---

## S13-A — Aankondiging aanmaken als concept

**Goal:** Beheerder maakt een nieuwe aankondiging aan en slaat hem op als concept. De aankondiging is niet zichtbaar voor leden in de app.

**Steps:**

1. Log in als beheerder via `/login`.
2. Navigeer naar `/dashboard/aankondigingen`.
3. Klik "Nieuwe aankondiging".
4. Vul in: titel "Trainingstijden gewijzigd", doelgroep "Voetbal", body "De trainingen van dinsdag starten vanaf volgende week om 19:30."
5. Klik "Opslaan als concept".

**Expected result:**

- Redirect naar `/dashboard/aankondigingen`.
- Toast "Aankondiging opgeslagen als concept" zichtbaar.
- Aankondiging verschijnt in de lijst met status-badge "CONCEPT".
- Geen push-notificaties verstuurd.

**Verificatie via Supabase Studio:**

```sql
SELECT title, published_at, deleted_at FROM announcements
WHERE title = 'Trainingstijden gewijzigd';
```
→ Verwacht: 1 rij, `published_at IS NULL`, `deleted_at IS NULL`.

```sql
SELECT count(*) FROM announcement_teams at2
JOIN announcements a ON a.id = at2.announcement_id
WHERE a.title = 'Trainingstijden gewijzigd';
```
→ Verwacht: 0 rijen (sport-filter, geen team-koppeling).

---

## S13-B — Aankondiging publiceren via CMS (push-notificaties verstuurd)

**Goal:** Beheerder publiceert een conceptaankondiging voor "Voetbal". Alleen voetballeden ontvangen een notificatie; hockeyleden niet.

**Prerequisites:** S13-A voltooid (concept aanwezig).

**Steps:**

1. Log in als beheerder.
2. Navigeer naar `/dashboard/aankondigingen`.
3. Klik het bewerken-icoon naast "Trainingstijden gewijzigd".
4. Klik "Publiceren".

**Expected result:**

- Toast "Aankondiging gepubliceerd" zichtbaar.
- Status-badge toont "GEPUBLICEERD".
- Aankondiging is zichtbaar in de Nieuws-tab voor voetballeden.

**Verificatie via Supabase Studio:**

```sql
SELECT title, published_at FROM announcements
WHERE title = 'Trainingstijden gewijzigd';
```
→ Verwacht: `published_at IS NOT NULL`.

```sql
SELECT n.recipient_profile_id, n.type
FROM notifications n
JOIN profiles p ON p.id = n.recipient_profile_id
WHERE n.type = 'aankondiging'
  AND n.data->>'announcement_id' = (
    SELECT id::text FROM announcements WHERE title = 'Trainingstijden gewijzigd'
  );
```
→ Verwacht: rij voor voetballeden aanwezig; GEEN rij voor hockeyleden.

---

## S13-C — Nieuws-tab toont gepubliceerde aankondigingen (sport-filtering)

**Goal:** Voetballid ziet de voetbal-aankondiging in de Nieuws-tab. Hockeylid ziet hem niet.

**Prerequisites:** S13-B voltooid.

**Steps (voetballid):**

1. Log in als voetballid in de app.
2. Navigeer naar de Nieuws-tab.
3. Controleer de lijst.

**Expected result (voetballid):**

- Aankondiging "Trainingstijden gewijzigd" zichtbaar met sportbadge "VOETBAL".
- Ongelezen dot zichtbaar.
- Datum in Dutch formaat (bijv. "zaterdag 10 mei 2026").

**Steps (hockeylid):**

4. Log in als hockeylid in de app.
5. Navigeer naar de Nieuws-tab.

**Expected result (hockeylid):**

- Aankondiging "Trainingstijden gewijzigd" NIET zichtbaar.
- Als geen andere aankondigingen: lege staat "Geen berichten beschikbaar."

---

## S13-D — Ongelezen-indicator verdwijnt na openen aankondiging

**Goal:** Wanneer een lid de aankondiging opent, verdwijnt de ongelezen dot en wordt `read_at` gezet.

**Prerequisites:** S13-B voltooid; voetballid heeft ongelezen notificatie.

**Steps:**

1. Log in als voetballid.
2. Navigeer naar de Nieuws-tab.
3. Controleer: ongelezen dot zichtbaar op aankondiging.
4. Tik op de aankondiging.
5. Wacht tot detailscherm volledig geladen is.
6. Navigeer terug.

**Expected result:**

- Stap 3: blauwe ongelezen dot zichtbaar.
- Stap 6: ongelezen dot verdwenen van de kaart.
- Bell-icoon badge in header: teller verlaagd.

**Verificatie via Supabase Studio:**

```sql
SELECT read_at FROM notifications
WHERE type = 'aankondiging'
  AND recipient_profile_id = (
    SELECT id FROM profiles WHERE email = 'e2e-voetbal@e2e.scmuiden.test'
  );
```
→ Verwacht: `read_at IS NOT NULL`.

---

## S13-E — Notificatiecentrum toont gemengde notificaties

**Goal:** Bell-icoon in de Nieuws-tab opent het notificatiecentrum met alle ontvangen notificaties.

**Prerequisites:** Voetballid heeft minstens één aankondigingsnotificatie (S13-B).

**Steps:**

1. Log in als voetballid.
2. Navigeer naar de Nieuws-tab.
3. Tik op bell-icoon rechts in de header.
4. Controleer de notificatielijst.

**Expected result:**

- Scherm "Notificaties" opent.
- Aankondigingsnotificatie zichtbaar met `<Newspaper />` icoon.
- Titel en tijdstip zichtbaar.
- Tik op de aankondigingsnotificatie → navigeert naar aankondigingsdetail.

---

## S13-F — Commissielid kan aankondiging aanmaken

**Goal:** Commissielid heeft dezelfde aanmaakrechten als beheerder voor aankondigingen.

**Steps:**

1. Log uit als beheerder; log in als commissielid.
2. Navigeer naar `/dashboard/aankondigingen`.
3. Klik "Nieuwe aankondiging".
4. Maak aankondiging aan: titel "Hockeynieuws", doelgroep "Hockey", klik "Nu publiceren".

**Expected result:**

- Aankondiging gepubliceerd; status GEPUBLICEERD.
- Hockeylid ontvangt notificatie in DB.

**Verificatie via Supabase Studio:**

```sql
SELECT title, published_at, author_id FROM announcements
WHERE title = 'Hockeynieuws';
```
→ Verwacht: 1 rij, `published_at IS NOT NULL`.

---

## S13-G — Aankondigingspush uitschakelen

**Goal:** Lid schakelt push-voorkeur voor aankondigingen uit. Volgende publicatie stuurt geen push naar dit lid (notificatie in DB wél aangemaakt).

**Steps:**

1. Log in als voetballid in de app.
2. Navigeer naar Profiel → Notificatie-instellingen.
3. Schakel toggle "Aankondigingen" uit.
4. Log in als beheerder in CMS; publiceer een nieuwe aankondiging "Test voorkeur" voor doelgroep "Voetbal".

**Expected result:**

- Stap 3: toggle staat uit; geen foutmelding.
- Stap 4: in Supabase DB bestaat een `notifications`-rij voor het voetballid.
- Het push-token van het voetballid ontvangt géén push-notificatie (te verifiëren via Expo dashboard of push-token log).

**Verificatie via Supabase Studio:**

```sql
SELECT aankondiging FROM notification_preferences
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'e2e-voetbal@e2e.scmuiden.test'
);
```
→ Verwacht: `aankondiging = false`.

```sql
SELECT id FROM notifications
WHERE type = 'aankondiging'
  AND recipient_profile_id = (
    SELECT id FROM profiles WHERE email = 'e2e-voetbal@e2e.scmuiden.test'
  )
  AND data->>'announcement_id' = (
    SELECT id::text FROM announcements WHERE title = 'Test voorkeur'
  );
```
→ Verwacht: rij aanwezig (notificatie opgeslagen voor in-app centrum).
