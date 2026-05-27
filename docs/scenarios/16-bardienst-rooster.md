# Scenario: Bardienst Rooster Generator

End-to-end flows voor het aanmaken van day-slots, genereren van een rooster-preview, handmatig aanpassen en publiceren van een bardienst-rooster vanuit het CMS.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat:
  - Minimaal 3 leden met `is_barcommissie = true`, `sport` bevat `'voetbal'`
  - Minimaal 6 leden met `lid_type IN ('spelend-lid', 'jeugdlid', 'relatie')`, `is_vrijwilliger = false`, `is_barcommissie = false`, `sport` bevat `'voetbal'`
  - Minimaal 2 leden met `is_barcommissie = true`, `sport` bevat `'hockey'`
  - Minimaal 4 leden regulier met `sport` bevat `'hockey'`
  - Beheerder-account: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- CMS open in browser, ingelogd als beheerder

---

## S16-A — Day-slot aanmaken (happy path)

**Goal:** Beheerder maakt een day-slot aan voor een voetbaldag.

**Steps:**

1. Navigeer naar `/dashboard/bardienst/`.
2. Klik op de tab "Day slots".
3. Klik op "Nieuw day-slot".
4. Vul in:
   - Datum: een datum in de toekomst (bijv. volgende zaterdag)
   - Begintijd: `08:00`
   - Eindtijd: `18:00`
   - Sport: "Voetbal"
   - Seizoen: `2025-2026`
   - Notities: leeg laten
5. Klik "Opslaan".

**Expected result:**

- Succesbericht of redirect naar de day-slots lijst.
- Het nieuwe day-slot verschijnt in de lijst met datum, "08:00 – 18:00", sport-badge "Voetbal", seizoen "2025-2026".

**Verificatie via Supabase Studio:**

```sql
SELECT date, starts_at, ends_at, sport, season, deleted_at
FROM bar_day_slots
ORDER BY created_at DESC
LIMIT 1;
```
→ Verwacht: de ingevulde waarden, `deleted_at IS NULL`.

---

## S16-B — Day-slot aanmaken — validatiefout eindtijd

**Goal:** Het systeem weigert een day-slot waarbij eindtijd ≤ begintijd.

**Steps:**

1. Open het formulier voor een nieuw day-slot.
2. Vul begintijd `14:00` en eindtijd `08:00` in.
3. Klik "Opslaan".

**Expected result:**

- Foutmelding verschijnt onder het eindtijd-veld: "De eindtijd moet na de begintijd liggen."
- Er wordt niets opgeslagen.
- Formulier blijft open.

**Verificatie via Supabase Studio:**

```sql
SELECT COUNT(*) FROM bar_day_slots WHERE starts_at = '14:00:00' AND ends_at = '08:00:00';
```
→ Verwacht: `0`.

---

## S16-C — Rooster genereren voor voetbaldag (happy path)

**Goal:** Beheerder genereert een preview voor één voetbal-day-slot van 08:00–13:00 (twee diensten van 2,5u).

**Prerequisites:**
- Day-slot bestaat: datum komende zaterdag, `08:00–13:00`, sport `'voetbal'`, seizoen `2025-2026`.
- Voldoende barcommissie- en reguliere leden beschikbaar (zie seed-prerequisites).

**Steps:**

1. Navigeer naar `/dashboard/bardienst/genereren`.
2. Selecteer seizoen `2025-2026`.
3. Vink het day-slot van komende zaterdag aan.
4. Klik "Genereer preview".

**Expected result:**

- Wizard gaat naar stap 2 "Preview".
- Er worden 2 diensten getoond: `08:00 – 10:30` en `10:30 – 13:00`.
- Per dienst: 1 lid met badge "Barcommissie", 2 reguliere leden.
- Elk lid heeft een naam en diensten-score zichtbaar.
- Geen hockey-leden in de preview.

**Verificatie:**
- Controleer in de UI dat alle 6 getoonde leden `sport INCLUDES 'voetbal'` hebben (te verifiëren via Studio door de member_id's te controleren).

---

## S16-D — Preview handmatig aanpassen

**Goal:** Beheerder wisselt een regulier lid in dienst 1 uit voor een ander lid.

**Prerequisites:** S16-C uitgevoerd (wizard op stap 2).

**Steps:**

1. Klik "Omwisselen" naast een regulier lid in de eerste dienst.
2. Een zoek-dropdown verschijnt met alternatieve leden (gesorteerd op diensten-score).
3. Selecteer een ander lid uit de dropdown.

**Expected result:**

- De geselecteerde naam vervangt het vorige lid in de preview.
- De dropdown sluit.
- Geen paginaherlaad.
- Het ingewisselde lid verschijnt niet meer als alternatief in de dropdown van hetzelfde slot (dubbele toewijzing voorkomen).

---

## S16-E — Rooster publiceren

**Goal:** Beheerder publiceert de preview en activiteiten + toewijzingen worden aangemaakt.

**Prerequisites:** S16-C of S16-D uitgevoerd (wizard op stap 2). Preview bevat 2 diensten × 3 leden = 6 toewijzingen.

**Steps:**

1. Klik "Doorgaan naar publiceren" in stap 2.
2. Stap 3 toont samenvatting: 1 day-slot, 2 diensten, 6 leden.
3. Klik "Publiceer rooster".

**Expected result:**

- Succesbericht: "Rooster gepubliceerd."
- Redirect naar `/dashboard/bardienst/` → "Rooster"-tab.
- De twee diensten verschijnen in het rooster gegroepeerd onder de datum van het day-slot.

**Verificatie via Supabase Studio:**

```sql
SELECT a.title, a.type, a.starts_at, a.ends_at, a.bar_day_slot_id
FROM activities a
WHERE a.type = 'bardienst'
  AND a.bar_day_slot_id IS NOT NULL
  AND a.deleted_at IS NULL
ORDER BY a.starts_at;
```
→ Verwacht: 2 rijen met `bar_day_slot_id` ingevuld.

```sql
SELECT ba.member_id, a.starts_at
FROM bar_assignments ba
JOIN activities a ON a.id = ba.activity_id
WHERE a.bar_day_slot_id IS NOT NULL
ORDER BY a.starts_at, ba.member_id;
```
→ Verwacht: 6 rijen (2 diensten × 3 leden).

```sql
SELECT profile_id, title, body
FROM notifications
WHERE type = 'bardienst'
ORDER BY created_at DESC
LIMIT 6;
```
→ Verwacht: 6 notificaties voor de betrokken leden.

---

## S16-F — Onvoldoende barcommissieleden

**Goal:** Systeem geeft een duidelijke foutmelding als er niet genoeg barcommissieleden zijn voor de gevraagde day-slot.

**Prerequisites:**
- Maak een day-slot aan van `08:00–21:00` op een datum in de toekomst (8 diensten van 2,5u — meer diensten dan beschikbare barcommissieleden).
- Zorg dat er slechts 3 barcommissieleden beschikbaar zijn (minder dan 8).

**Steps:**

1. Selecteer de day-slot in de wizard (stap 1).
2. Klik "Genereer preview".

**Expected result:**

- Wizard blijft op stap 1.
- Foutbanner verschijnt: "Onvoldoende barcommissieleden beschikbaar voor [datum]. Er zijn minimaal [N] nodig voor [M] diensten."
- Geen preview gegenereerd.

---

## S16-G — Sport-filtering: hockey-leden niet in voetbal-rooster

**Goal:** Bij een voetbal-day-slot worden leden zonder 'voetbal' in hun sport-array niet ingepland.

**Prerequisites:**
- Er bestaan leden met `sport = ['hockey']` (exclusief hockey).
- Day-slot: sport = `'voetbal'`.

**Steps:**

1. Genereer een preview voor het voetbal-day-slot (zie S16-C).
2. Noteer de member_id's van alle toegewezen leden in de preview.

**Expected result:**

- Geen van de toegewezen leden heeft uitsluitend `sport = ['hockey']` zonder `'voetbal'`.

**Verificatie via Supabase Studio:**

```sql
SELECT id, first_name, last_name, sport
FROM members
WHERE id IN (<member_ids_uit_preview>);
```
→ Verwacht: alle rijen hebben `'voetbal'` in de sport-array.

---

## S16-H — Eerlijke verdeling bij tweede run

**Goal:** Leden die in de eerste run meer diensten hebben gekregen staan lager in prioriteit bij de tweede run.

**Prerequisites:**
- S16-E uitgevoerd: rooster van run 1 is gepubliceerd.
- Minstens één lid uit run 1 heeft nu 1 extra dienst dit seizoen.

**Steps:**

1. Maak een tweede day-slot aan (volgende week, zelfde seizoen, zelfde sport).
2. Genereer een preview voor dit tweede day-slot.
3. Vergelijk de toegewezen leden met die van run 1.

**Expected result:**

- Leden die in run 1 zijn toegewezen hebben in de preview van run 2 een hogere diensten-score.
- Leden die in run 1 **niet** zijn toegewezen (diensten-score = 0 of lager) staan hoger in de prioriteit en worden preferentieel toegewezen.

**Verificatie:**
- Preview in stap 2 toont de diensten-score per lid; leden met score 0 of 1 staan voor leden met score 2.
