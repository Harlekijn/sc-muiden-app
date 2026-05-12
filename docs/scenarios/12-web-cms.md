# Scenario: Web CMS

End-to-end flows voor het volledige CMS: dashboard, ledenbeheer, CSV-import, teamsbeheer, activiteitenbeheer en rolbeheer.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat: 10 leden (waarvan 2 met app-account), 2 teams (1 voetbal, 1 hockey), 3 activiteiten
- CMS open in browser
- Beheerder-account: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- Commissielid-account: `e2e-commissielid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- Test-lid-account (rol: lid): `e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`

---

## S12-A — Dashboard toont correcte telkaarten

**Goal:** Na inloggen als beheerder toont het dashboard actuele aantallen voor leden, teams, aankomende activiteiten en openstaande gezinsverzoeken.

**Steps:**

1. Log in als beheerder via `/login`.
2. Navigeer naar `/dashboard`.

**Expected result:**

- Telkaart "Leden": toont het totaal aantal actieve leden (niet deleted_at).
- Telkaart "Teams": toont het totaal aantal actieve teams.
- Telkaart "Aankomende activiteiten": toont het aantal activiteiten met `starts_at` in de komende 7 dagen.
- Telkaart "Gezinsverzoeken": toont het aantal `family_link_requests` met `status = 'pending'`.
- Sectie "Aankomende activiteiten" toont maximaal 5 rijen, gesorteerd op datum.
- Alle tekst in het Nederlands, geen Engelse strings.

**Verificatie via Supabase Studio:**

```sql
SELECT COUNT(*) FROM members WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM teams WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM activities WHERE starts_at >= now() AND starts_at <= now() + interval '7 days' AND deleted_at IS NULL;
```
→ Verwacht: cijfers komen overeen met de telkaarten.

---

## S12-B — Leden doorzoeken en filteren

**Goal:** Beheerder kan de ledenlijst filteren op naam en sport.

**Steps:**

1. Navigeer naar `/dashboard/leden`.
2. Typ "jan" in het zoekveld.
3. Controleer de gefilterde lijst.
4. Klik op sportfilter "Hockey".
5. Controleer de gecombineerde filter (naam + sport).
6. Verwijder de zoekopdracht.
7. Klik sportfilter "Alle".

**Expected result:**

- Stap 3: alleen leden waarvan voornaam, achternaam of e-mail "jan" bevat worden getoond.
- Stap 5: alleen leden waarvan naam "jan" bevat EN sport "hockey" bevat worden getoond.
- Stap 7: volledige ledenlijst zichtbaar.
- Geen Engelse labels. Paginatitel "Leden" zichtbaar.

---

## S12-C — Lid bewerken

**Goal:** Beheerder kan een lidprofiel bewerken en de wijzigingen worden opgeslagen.

**Prerequisites:** Er bestaat een lid met voornaam "Test" in de seed data.

**Steps:**

1. Navigeer naar `/dashboard/leden`.
2. Zoek naar "Test" en klik op de rij.
3. Klik "Bewerken".
4. Wijzig het telefoonnummer naar "0612345678".
5. Klik "Opslaan".

**Expected result:**

- Formulier gaat terug naar read-only modus.
- Toast verschijnt: "Wijzigingen opgeslagen".
- Telefoonnummer toont nu "0612345678".

**Verificatie via Supabase Studio:**

```sql
SELECT phone, updated_at FROM members WHERE first_name = 'Test';
```
→ Verwacht: `phone = '0612345678'`, `updated_at` recent.

---

## S12-D — CSV-import: nieuw lid toegevoegd, conflict overgeslagen

**Goal:** Beheerder importeert een CSV met één nieuw lid en één conflict. Conflict wordt niet aangevinkt en overgeslagen.

**Setup:**
Maak een CSV-bestand `test-import.csv` met:
```
voornaam,achternaam,geboortedatum,email,sport
NieuwLid,TestAchternaam,2000-01-01,nieuw@test.nl,voetbal
[voornaam van bestaand seed-lid],[achternaam],[zelfde geboortedatum],[zelfde email],voetbal
```

**Steps:**

1. Navigeer naar `/dashboard/leden/importeren`.
2. Upload `test-import.csv`.
3. Controleer de kolomkoppeling (auto-mapping verwacht).
4. Klik "Analyseren".
5. Controleer de previewtabel.
6. Zorg dat de conflictrij **niet aangevinkt** is.
7. Klik "Importeren".

**Expected result:**

- Stap 5: groene rij voor "NieuwLid TestAchternaam", gele rij voor het bestaande lid (checkbox UIT).
- Stap 7: succesbericht "1 nieuwe leden toegevoegd. 0 leden bijgewerkt."
- Het bestaande lid is ongewijzigd in de DB.

**Verificatie via Supabase Studio:**

```sql
SELECT * FROM members WHERE email = 'nieuw@test.nl';
```
→ Verwacht: 1 rij aanwezig.

---

## S12-E — Team aanmaken en lid toevoegen

**Goal:** Beheerder maakt een nieuw team aan en voegt een lid toe met rol "trainer".

**Steps:**

1. Navigeer naar `/dashboard/teams`.
2. Klik "Nieuw team".
3. Vul in: naam "SC Muiden A1", sport "Voetbal", seizoen "2025-2026".
4. Klik "Aanmaken".
5. Controleer redirect naar `/dashboard/teams/[id]`.
6. Klik tabblad "Leden".
7. Klik "Lid toevoegen".
8. Zoek op een bestaand lid, selecteer het, stel rol in op "trainer".
9. Klik "Toevoegen".

**Expected result:**

- Stap 5: team "SC Muiden A1" zichtbaar met gegevens.
- Stap 9: lid verschijnt in de teamledenlijst met badge "trainer".
- Leden-teller op de teamslijst toont "1 lid".

**Verificatie via Supabase Studio:**

```sql
SELECT tm.role FROM team_members tm
JOIN teams t ON t.id = tm.team_id
WHERE t.name = 'SC Muiden A1' AND tm.deleted_at IS NULL;
```
→ Verwacht: 1 rij met `role = 'trainer'`.

---

## S12-F — Training aanmaken (terugkerend)

**Goal:** Beheerder maakt een wekelijks terugkerende training aan voor 4 weken.

**Prerequisites:** Er bestaat een voetbalteam in de seed data.

**Steps:**

1. Navigeer naar `/dashboard/activiteiten/nieuw?type=training`.
2. Selecteer het voetbalteam.
3. Stel datum in op de eerstvolgende dinsdag, begintijd 19:00, eindtijd 20:30, locatie "Veld 1".
4. Zet schakelaar "Wekelijks herhalen" op aan.
5. Stel "Geldig tot" in op 4 weken na de startdatum.
6. Klik "Opslaan".

**Expected result:**

- Redirect naar activiteitenlijst.
- Toast: "Terugkerende training aangemaakt: 4 sessies gegenereerd."
- In de activiteitenlijst zijn 4 trainingen zichtbaar op de vier dinsdagen.

**Verificatie via Supabase Studio:**

```sql
SELECT COUNT(*) FROM activities
WHERE type = 'training' AND recurring_rule_id IS NOT NULL
ORDER BY starts_at;
```
→ Verwacht: 4 rijen, allemaal dezelfde `recurring_rule_id`.

---

## S12-G — Bardienst aanmaken en leden toewijzen

**Goal:** Beheerder maakt een bardienst aan en wijst twee leden toe.

**Steps:**

1. Navigeer naar `/dashboard/activiteiten/nieuw?type=bardienst`.
2. Stel datum, begintijd 12:00, eindtijd 16:00 in.
3. Stel sport in op "Voetbal".
4. Zoek twee leden en voeg ze toe.
5. Klik "Opslaan".

**Expected result:**

- Activiteit aangemaakt met type "bardienst".
- 2 `bar_assignments` aangemaakt, beide met `confirmed_at IS NULL`.

**Verificatie via Supabase Studio:**

```sql
SELECT ba.member_id, ba.confirmed_at
FROM bar_assignments ba
JOIN activities a ON a.id = ba.activity_id
WHERE a.type = 'bardienst'
ORDER BY a.starts_at DESC
LIMIT 2;
```
→ Verwacht: 2 rijen, `confirmed_at IS NULL`.

---

## S12-H — Commissielid heeft geen toegang tot rolbeheer

**Goal:** Commissielid ziet `<GeenToegang />` op de rollen-pagina.

**Steps:**

1. Log uit als beheerder en log in als commissielid (`e2e-commissielid@e2e.scmuiden.test`).
2. Navigeer naar `/dashboard/rollen`.

**Expected result:**

- Pagina toont "Geen toegang" component (Nederlandse tekst).
- Geen ledenlijst of rol-dropdowns zichtbaar.
- Navigatiemenu is nog steeds zichtbaar (commissielid heeft toegang tot rest van dashboard).

---

## S12-I — Rolbeheer: rol toewijzen aan lid

**Goal:** Beheerder wijzigt de rol van een lid naar "trainer".

**Prerequisites:** Er bestaat een profiel met rol "lid" in de seed data.

**Steps:**

1. Log in als beheerder.
2. Navigeer naar `/dashboard/rollen`.
3. Zoek het test-lid-profiel.
4. Open de rol-dropdown en selecteer "trainer".
5. Bevestig in de dialoog.

**Expected result:**

- Toast: "Rol bijgewerkt".
- Dropdown toont nu "trainer".
- Eigen rij van de beheerder heeft een disabled dropdown.

**Verificatie via Supabase Studio:**

```sql
SELECT role FROM profiles WHERE email = 'e2e-lid@e2e.scmuiden.test';
```
→ Verwacht: `role = 'trainer'`.

**Cleanup:**

6. Zet de rol terug naar "lid".

---

## S12-J — Activiteit annuleren (soft-delete)

**Goal:** Beheerder annuleert een bestaande training. De activiteit verdwijnt uit de lijst maar blijft in de DB.

**Steps:**

1. Navigeer naar `/dashboard/activiteiten`.
2. Zoek een training.
3. Klik het annuleer-icoon (`<XCircle />`).
4. Bevestig in de dialoog.

**Expected result:**

- De training verdwijnt uit de activiteitenlijst (niet meer zichtbaar).
- Geen foutmelding.

**Verificatie via Supabase Studio:**

```sql
SELECT id, deleted_at FROM activities WHERE type = 'training' ORDER BY deleted_at DESC LIMIT 1;
```
→ Verwacht: `deleted_at IS NOT NULL`.

---

## S12-K — Gewone gebruiker kan CMS niet benaderen

**Goal:** Een gewone `lid`-gebruiker wordt geblokkeerd door de dashboard role guard.

**Steps:**

1. Log in als test-lid (`e2e-lid@e2e.scmuiden.test`).
2. Navigeer handmatig naar `/dashboard`.

**Expected result:**

- Pagina toont "Geen toegang"-scherm (Dutch, geen stack trace).
- Sidebar zichtbaar maar inhoudspagina toont de foutcomponent.
- Geen data uit de DB wordt getoond.
