# Scenario: Bardienst Rooster Generator

End-to-end flows voor het inplannen en publiceren van een bardienst-rooster vanuit het CMS.
Sinds R-02 (`bardienst-activity-merge`) bestaat er geen aparte `bar_day_slots`-tabel meer:
de wizard accepteert dagen inline en publicatie schrijft direct in `activities`.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Seed bevat:
  - Minimaal 3 leden met `is_barcommissie = true`, `sport` bevat `'voetbal'`
  - Minimaal 6 leden met `lid_type IN ('spelend-lid', 'relatie')`, `is_vrijwilliger = false`,
    `is_barcommissie = false`, `sport` bevat `'voetbal'`
  - Minimaal 2 leden met `is_barcommissie = true`, `sport` bevat `'hockey'`
  - Minimaal 4 leden regulier met `sport` bevat `'hockey'`
  - Beheerder-account: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`
- CMS open in browser, ingelogd als beheerder

---

## S16-A — Bardienst-pagina toont alleen "Rooster"-tab

**Goal:** Na R-02 is er geen "Day slots"-tab meer; de bardienst-pagina toont alleen "Rooster".

**Steps:**

1. Navigeer naar `/dashboard/bardienst/`.

**Expected result:**

- Pagina toont één tab: "Rooster".
- Knop "Genereer rooster" zichtbaar boven de tab-inhoud.
- Geen "Day slots"-tab, geen "Nieuw day-slot"-knop.

**Verificatie via Supabase Studio:**

```sql
select to_regclass('public.bar_day_slots');
```
→ Verwacht: `null` (tabel bestaat niet).

```sql
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'activities' and column_name = 'bar_day_slot_id';
```
→ Verwacht: `0 rows`.

---

## S16-B — Rooster genereren voor één voetbaldag (happy path)

**Goal:** Beheerder genereert een preview voor één voetbal-dag van 08:00–13:00
(twee diensten van 2,5u) zonder een day-slot record aan te maken.

**Steps:**

1. Navigeer naar `/dashboard/bardienst/genereren`.
2. Vul "Seizoen": `2025-2026`.
3. Vul de eerste dag-rij in: datum komende zaterdag, begintijd `08:00`, eindtijd `13:00`,
   sport "Voetbal".
4. Klik "Genereer preview".

**Expected result:**

- Wizard gaat naar stap 2 "Preview".
- Eén dag-card; daarbinnen 2 diensten: `08:00 – 10:30` en `10:30 – 13:00`.
- Per dienst: 1 lid met badge "Barcommissie", 2 reguliere leden.
- Elk lid heeft een naam en diensten-score zichtbaar.
- Geen hockey-leden in de preview.

**Verificatie via Supabase Studio:**

```sql
select count(*) from activities where type = 'bardienst' and starts_at::date = current_date + interval '6 days';
```
→ Verwacht: `0` (preview zonder DB-writes).

---

## S16-C — Preview handmatig aanpassen

**Goal:** Beheerder wisselt een regulier lid in dienst 1 uit voor een ander lid.

**Prerequisites:** S16-B uitgevoerd (wizard op stap 2).

**Steps:**

1. Klik "Omwisselen" naast een regulier lid in de eerste dienst.
2. Een zoek-dropdown verschijnt met alternatieve leden (gesorteerd op diensten-score).
3. Selecteer een ander lid uit de dropdown.

**Expected result:**

- De geselecteerde naam vervangt het vorige lid in de preview.
- De dropdown sluit.
- Geen paginaherlaad.
- Het ingewisselde lid verschijnt niet meer als alternatief in de dropdown van hetzelfde slot
  (dubbele toewijzing voorkomen).

---

## S16-D — Rooster publiceren

**Goal:** Beheerder publiceert de preview en `activities` + `bar_assignments` worden
direct aangemaakt zonder `bar_day_slot_id`-FK.

**Prerequisites:** S16-B of S16-C uitgevoerd (wizard op stap 2). Preview bevat
2 diensten × 3 leden = 6 toewijzingen.

**Steps:**

1. Klik "Doorgaan naar publiceren" in stap 2.
2. Stap 3 toont samenvatting: 1 dag, 2 diensten, 6 leden.
3. Klik "Publiceer rooster".

**Expected result:**

- Succesbericht of redirect naar `/dashboard/bardienst?tab=rooster`.
- De twee diensten verschijnen onder een dag-card met de datum als kop.
- Per dienst: 3 leden met "Niet bevestigd"-badge.
- Geen "Dag verwijderen"-knop op de dag-card.

**Verificatie via Supabase Studio:**

```sql
select title, type, starts_at, ends_at, sport
  from activities
 where type = 'bardienst'
   and deleted_at is null
   and starts_at::date = current_date + interval '6 days'
 order by starts_at;
```
→ Verwacht: 2 rijen, sport = `'voetbal'`. Geen `bar_day_slot_id`-kolom in het resultaat-schema.

```sql
select ba.member_id, a.starts_at
  from bar_assignments ba
  join activities a on a.id = ba.activity_id
 where a.type = 'bardienst'
   and a.starts_at::date = current_date + interval '6 days'
 order by a.starts_at, ba.member_id;
```
→ Verwacht: 6 rijen (2 diensten × 3 leden).

```sql
select recipient_profile_id, title, body
  from notifications
 where type = 'bardienst'
 order by created_at desc
 limit 6;
```
→ Verwacht: notificaties voor leden met een gekoppeld profiel.

---

## S16-E — Onvoldoende barcommissieleden

**Goal:** Systeem geeft een Nederlandstalige foutmelding als er onvoldoende
barcommissieleden zijn voor de gevraagde dag.

**Prerequisites:**
- Zorg dat er slechts 3 barcommissieleden beschikbaar zijn voor sport `'voetbal'`.

**Steps:**

1. Open de wizard (`/dashboard/bardienst/genereren`).
2. Vul seizoen `2025-2026`.
3. Vul één dag in: datum komende zaterdag, `08:00–21:00` (8 diensten van 2,5u),
   sport "Voetbal".
4. Klik "Genereer preview".

**Expected result:**

- Wizard blijft op stap 1.
- Foutbanner: "Onvoldoende barcommissieleden beschikbaar voor [datum]."
- Geen preview gegenereerd.

---

## S16-F — Sport-filtering: hockey-leden niet in voetbal-rooster

**Goal:** Bij een voetbal-dag worden leden zonder `'voetbal'` in hun sport-array niet ingepland.

**Prerequisites:**
- Er bestaan leden met `sport = ['hockey']` (exclusief hockey).

**Steps:**

1. Genereer een preview voor één voetbal-dag (zie S16-B).
2. Noteer de `member_id`'s van alle toegewezen leden in de preview.

**Expected result:**

- Geen van de toegewezen leden heeft uitsluitend `sport = ['hockey']` zonder `'voetbal'`.

**Verificatie via Supabase Studio:**

```sql
select id, first_name, last_name, sport
  from members
 where id in (<member_ids_uit_preview>);
```
→ Verwacht: alle rijen hebben `'voetbal'` in de sport-array.

---

## S16-G — Eerlijke verdeling bij tweede run

**Goal:** Leden die in de eerste run meer diensten hebben gekregen staan lager in
prioriteit bij de tweede run.

**Prerequisites:**
- S16-D uitgevoerd: rooster van run 1 is gepubliceerd.
- Minstens één lid uit run 1 heeft nu 1 extra dienst dit seizoen.

**Steps:**

1. Open opnieuw de wizard.
2. Vul seizoen `2025-2026` en één dag voor volgende week (zelfde sport).
3. Klik "Genereer preview".
4. Vergelijk de toegewezen leden met die van run 1.

**Expected result:**

- Leden uit run 1 hebben in de preview van run 2 een hogere `diensten_count`-waarde.
- Leden die in run 1 níet zijn toegewezen (score 0 of 1) staan voor leden met score ≥ 2.

**Verificatie:**

- Preview in stap 2 toont de diensten-score per lid; leden met score 0 of 1 staan vóór
  leden met score 2.

---

## S16-H — Rooster gegroepeerd op datum (geen day-slot)

**Goal:** Het Rooster-tabblad groepeert diensten per kalenderdag op basis van
`starts_at::date`, niet op een `bar_day_slot_id`-FK.

**Prerequisites:** S16-D uitgevoerd. Maak optioneel een tweede run voor een andere
datum zodat er minimaal 2 dag-cards zichtbaar zijn.

**Steps:**

1. Navigeer naar `/dashboard/bardienst?tab=rooster`.

**Expected result:**

- Diensten verschijnen gegroepeerd per kalenderdag, gesorteerd op datum oplopend.
- Per dag-card geen "Dag verwijderen"-knop (verwijderen gebeurt per activity via de
  bestaande activity-edit-flow).

**Verificatie via Supabase Studio:**

```sql
select starts_at::date as dag, count(*) as aantal_diensten
  from activities
 where type = 'bardienst' and deleted_at is null
 group by starts_at::date
 order by dag;
```
→ Verwacht: één rij per zichtbare dag-card op het Rooster-tabblad, met aantal diensten gelijk aan wat de UI toont.
