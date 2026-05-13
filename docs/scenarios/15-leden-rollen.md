# Scenario: Ledentypes en rollen

Covers het beheren van ledentypes (jeugdlid, niet-spelend lid, trainingslid, spelend lid, relatie), vrijwilliger/barcommissie-vlaggen en het vereenvoudigde rolsysteem (lid/beheerder).

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat: minimaal 5 leden zonder lid_type, 1 beheerder-account
- CMS open in browser
- Beheerder-account: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- Test-lid-account: `e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`

---

## S15-A — Ledentype instellen via detailscherm

**Goal:** Beheerder stelt het ledentype in voor een lid dat nog geen type heeft.

**Prerequisites:** Ingelogd als beheerder. Er bestaat een lid zonder `lid_type` (NULL).

**Steps:**

1. Navigeer naar `/dashboard/leden`.
2. Klik op een lid zonder ledentype.
3. Controleer dat de sectie "Lidmaatschap" zichtbaar is met "Ledentype: —".
4. Klik "Bewerken" in de sectie "Lidmaatschap".
5. Selecteer "Spelend lid" in de dropdown.
6. Klik "Opslaan".

**Expected result:**

- Succesbanner "Wijzigingen opgeslagen" verschijnt.
- De sectie toont nu het ledentype-badge "Spelend lid".
- Formulier is terug in read-only modus.

**Verificatie via Supabase Studio:**

```sql
SELECT lid_type FROM members WHERE id = '<lid-id>';
```
→ Verwacht: `spelend-lid`

---

## S15-B — Vrijwilliger en barcommissie markeren

**Goal:** Beheerder markeert een lid als vrijwilliger én lid van de barcommissie.

**Prerequisites:** Ingelogd als beheerder. Bestaand lid beschikbaar.

**Steps:**

1. Navigeer naar het detailscherm van het lid.
2. Klik "Bewerken" in de sectie "Lidmaatschap".
3. Vink "Vrijwilliger" aan.
4. Vink "Lid barcommissie" aan.
5. Klik "Opslaan".

**Expected result:**

- Succesbanner verschijnt.
- Read-only weergave toont vinkje bij "Vrijwilliger" en "Lid barcommissie".

**Verificatie via Supabase Studio:**

```sql
SELECT is_vrijwilliger, is_barcommissie FROM members WHERE id = '<lid-id>';
```
→ Verwacht: `true, true`

---

## S15-C — Ledentype inline bijwerken vanuit de ledenlijst

**Goal:** Beheerder wijzigt het ledentype van een lid direct in de ledenlijst zonder naar het detailscherm te gaan.

**Prerequisites:** Ingelogd als beheerder. Meerdere leden aanwezig in de lijst.

**Steps:**

1. Navigeer naar `/dashboard/leden`.
2. Zoek een rij op in de tabel.
3. Klik op de dropdown in de kolom "Ledentype" van die rij.
4. Selecteer "Jeugdlid".

**Expected result:**

- Dropdown toont "Jeugdlid" onmiddellijk na selectie.
- Geen paginaherlaad nodig.
- Geen andere rijen worden beïnvloed.

**Verificatie via Supabase Studio:**

```sql
SELECT lid_type FROM members WHERE id = '<lid-id>';
```
→ Verwacht: `jeugdlid`

---

## S15-D — Rol wijzigen van lid naar beheerder

**Goal:** Beheerder verhoogt de toegangsrol van een gebruiker naar `beheerder`.

**Prerequisites:** Ingelogd als beheerder. Er bestaat een gebruiker met `role = 'lid'`.

**Steps:**

1. Navigeer naar `/dashboard/rollen`.
2. Zoek de gebruiker op in de lijst.
3. Selecteer "Beheerder" in de dropdown naast de gebruiker.
4. Bevestig in het dialoogvenster.

**Expected result:**

- De badge naast de gebruiker toont "Beheerder".
- De dropdown toont "Beheerder" geselecteerd.

**Verificatie via Supabase Studio:**

```sql
SELECT role FROM profiles WHERE id = '<profile-id>';
```
→ Verwacht: `beheerder`

---

## S15-E — Rollenlijst toont alleen Lid en Beheerder

**Goal:** De dropdown in `/dashboard/rollen` bevat precies twee opties.

**Prerequisites:** Ingelogd als beheerder.

**Steps:**

1. Navigeer naar `/dashboard/rollen`.
2. Open de dropdown van een willekeurige rij.
3. Controleer de beschikbare opties.

**Expected result:**

- De dropdown toont exact twee opties: "Lid" en "Beheerder".
- Opties als "Ouder", "Trainer", "Coach", "Teammanager", "Commissielid" zijn **niet** aanwezig.

---

## S15-F — Beheerder kan eigen rol niet wijzigen

**Goal:** De dropdown van de ingelogde beheerder is uitgeschakeld.

**Prerequisites:** Ingelogd als beheerder.

**Steps:**

1. Navigeer naar `/dashboard/rollen`.
2. Zoek de eigen rij in de lijst.
3. Probeer de dropdown te openen.

**Expected result:**

- De dropdown is disabled (grijs/niet klikbaar).
- Er verschijnt een tooltip: "Je kunt je eigen rol niet wijzigen".

---

## S15-G — Lid kan CMS niet bereiken

**Goal:** Een gebruiker met `role = 'lid'` krijgt geen toegang tot het CMS.

**Prerequisites:** Gebruiker met `role = 'lid'` aangemeld: `e2e-lid@e2e.scmuiden.test`.

**Steps:**

1. Log in op het CMS als `e2e-lid@e2e.scmuiden.test`.
2. Controleer wat er verschijnt na inloggen.

**Expected result:**

- De pagina toont de "Geen toegang"-component.
- Geen dashboardnavigatie of data is zichtbaar.
- Een uitlogknop is zichtbaar.

---

## S15-H — Ledenlijst toont kolom "Ledentype" in plaats van "Rol"

**Goal:** De tabel op `/dashboard/leden` toont de nieuwe ledentype-kolom.

**Prerequisites:** Ingelogd als beheerder. Er zijn leden met en zonder lid_type aanwezig.

**Steps:**

1. Navigeer naar `/dashboard/leden`.
2. Bekijk de kolomhoofden van de tabel.

**Expected result:**

- Er is een kolom "Ledentype" zichtbaar.
- Er is **geen** kolom "Rol" zichtbaar.
- Leden zonder ledentype tonen "(—)" of een lege dropdown.
- Leden met ledentype tonen de bijpassende waarde in de dropdown.
