<!-- generated: 2026-05-27 -->

# Kalender — Trainings on-the-fly genereren uit `recurring_rules`

**Slug:** `kalender-recurring-on-the-fly`
**Status:** Phase 1 (Design)
**Refactor backlog:** [R-01](../REFACTOR_BACKLOG.md#r-01--trainings-on-the-fly-genereren-uit-recurring_rules)

## Probleemstelling

Trainings worden vandaag uit `recurring_rules` gematerialiseerd naar de `activities`-tabel via [apps/web/app/api/cms/activities/generate-recurring/route.ts](../../apps/web/app/api/cms/activities/generate-recurring/route.ts). Dat creëert duplicate state (rule + rijen kunnen out of sync raken bij wijziging), pollueert `activities` met N rijen per rule per seizoen, en biedt geen single source of truth. Deze refactor vervangt materialisatie door een Postgres-view die trainings on-the-fly genereert binnen het geldigheidsvenster van de rule.

---

## 1. Use cases (Gebruiksscenario's)

`UC-01 — Lid kan in de Agenda-tab terugkerende trainings van zijn team(s) zien zodat hij weet wanneer hij moet komen.`
`UC-02 — Lid kan op een training-occurrence tikken en de detail-pagina openen zodat hij locatie, tijd en notities kan zien.`
`UC-03 — Beheerder kan een RecurringRule aanmaken en de bijbehorende trainings verschijnen direct in de agenda van alle teamleden zonder extra "genereer"-actie.`
`UC-04 — Beheerder kan een RecurringRule wijzigen (tijd, locatie, dag, valid_until) en alle toekomstige occurrences reflecteren de wijziging onmiddellijk.`
`UC-05 — Beheerder kan op één specifieke datum afwijken van de rule (eerder beginnen, andere locatie) door een override-Activity aan te maken zodat alleen die ene datum afwijkt.`
`UC-06 — Beheerder kan één specifieke training-occurrence afzeggen zodat die datum niet meer in de agenda staat, zonder de rule aan te passen.`
`UC-07 — Mobiele app blijft werken met dezelfde Activity-shape — gegenereerde trainings krijgen een echte UUID zodat routing, deep-links en bestaande hooks ongewijzigd blijven.`
`UC-08 — Bij verwijderen van een Team (of zetten van valid_until in het verleden) verdwijnen de trainings automatisch uit de agenda.`

## 2. User flows (Gebruikersstromen)

### UC-01 — Trainings tonen in agenda

1. Lid logt in en opent de Agenda-tab.
2. App vraagt activiteiten op voor de zichtbare maand via `useAgendaActivities(year, month)`.
3. De query selecteert uit een nieuwe view `activities_with_occurrences` die UNION-eert: alle gewone `activities`-rijen + per `recurring_rules`-rij één rij per kalenderdag binnen `valid_from..valid_until` die binnen de gevraagde maand valt en niet door een override-rij afgedekt wordt.
4. De view-rijen krijgen een synthetische deterministische UUID (UUID v5 over `recurring_rule_id` + ISO-datum).
5. App rendert dots/cards zoals voorheen.

**Foutpaden:**
- Geen verbinding → bestaande offline-fallback toont gecachte data.
- View geeft geen rijen voor team van gebruiker → bestaande lege staat "Geen activiteiten op deze dag."

### UC-04 — RecurringRule wijzigen

1. Beheerder opent CMS Activiteiten-pagina, selecteert een training-rule, klikt "Bewerken".
2. Past tijd of locatie aan, klikt "Opslaan".
3. PATCH update op `recurring_rules` rij.
4. Geen vervolgstap nodig — de view reflecteert de nieuwe waardes direct bij de volgende read.

**Foutpaden:**
- `valid_until` in het verleden → alle toekomstige occurrences verdwijnen automatisch (gedrag is intentioneel).
- `valid_from` na `valid_until` → DB CHECK constraint blokkeert de update; Dutch error in UI.

### UC-05 — Override op één datum

1. Beheerder opent kalender in CMS, klikt op de specifieke training-datum.
2. Klikt "Wijzigen alleen deze datum".
3. Form prefilled met de view-waardes (tijd uit rule + lokale datum).
4. Beheerder past tijd aan, klikt "Opslaan".
5. POST naar `/api/cms/activities` met `recurring_rule_id` gezet en `starts_at`/`ends_at` aangepast.
6. View detecteert dat er voor `(rule_id, date)` al een override-Activity bestaat en exclude't de gegenereerde rij voor die datum.

### UC-06 — Training afzeggen

1. Beheerder opent specifieke training-occurrence.
2. Klikt "Annuleren".
3. POST naar `/api/cms/activities` met `recurring_rule_id` + correcte datum + `deleted_at = now()` (overrride met soft-delete).
4. View ziet override-Activity met `deleted_at IS NOT NULL` voor die datum → genereert geen view-rij voor die datum, en de soft-deleted override wordt zelf ook gefilterd → training is volledig onzichtbaar.

## 3. Acceptatiecriteria

| Criterium | Specificatie |
|---|---|
| **AC-01** | Gegeven een actieve RecurringRule (maandag 19:00, valid_from=2026-04-01, valid_until=2026-06-30), als ik de agenda voor mei 2026 open, dan zie ik op elke maandag in mei een trainingsdot. |
| **AC-02** | Gegeven dat geen materialisatie-API meer wordt aangeroepen, als ik een nieuwe RecurringRule aanmaak via CMS, dan staan de trainings binnen 5 seconden in de mobiele agenda. |
| **AC-03** | Gegeven een RecurringRule met `valid_until=2026-05-15`, als ik de agenda voor juni 2026 open, dan zie ik geen trainingsdots voor die rule. |
| **AC-04** | Gegeven een RecurringRule (dinsdag 19:00) en een override-Activity voor één specifieke dinsdag (20:00, locatie X), als ik die dinsdag open, dan toont de agenda exact één training-card met de override-tijd, niet de rule-tijd. |
| **AC-05** | Gegeven een RecurringRule en een override-Activity met `deleted_at IS NOT NULL` op datum D, als ik datum D open, dan zie ik geen training voor die rule op die datum. |
| **AC-06** | Gegeven dat ik op een gegenereerde training-card tik, dan opent `/activiteit/[id]` met dezelfde UUID die de view teruggaf, en die UUID is bij elke read identiek (deterministisch). |
| **AC-07** | Gegeven dat de RLS-policy op `recurring_rules` `authenticated_select` is, als een ingelogd lid de view bevraagt, dan ontvangt hij training-occurrences (RLS van de view valt terug op de onderliggende tabellen via `SECURITY INVOKER`). |
| **AC-08** | Gegeven dat de oude generator-API endpoint verwijderd is, als de CMS-knop "Genereer terugkerende trainings" weg is, dan zijn er geen 404's of console-errors bij het opslaan van een nieuwe rule. |
| **AC-09** | Gegeven de migratie hard-delete uitvoert, als ik na de migratie `SELECT count(*) FROM activities WHERE type='training' AND recurring_rule_id IS NOT NULL AND deleted_at IS NULL` doe, dan krijg ik alleen rijen die override-Activities zijn (afwijkende tijd of locatie t.o.v. de rule). |
| **AC-10** | Gegeven dat training-notificaties verwijderd zijn, als ik notificatie-instellingen open, dan zie ik geen "training"-toggle, en de scheduler-edge-function plant geen training-notificaties meer in. |

---

## 4. UI / Graphical design

### 4.1 Agenda-tab (mobile) — `app/(tabs)/agenda.tsx`

**Geen visuele wijziging.** Trainings tonen identiek aan vandaag (blauwe dot, blauwe kleurstrip, type-badge "Training", sport-badge, tijd in 24h). De data-bron verandert van `activities`-tabel naar de nieuwe view, maar de Activity-shape die de hook teruggeeft blijft `ActivityWithDetails`.

### 4.2 Activiteit-detail (mobile) — `app/activiteit/[id].tsx`

**Geen visuele wijziging.** Hook `useActivityDetail` blijft `Activity.id` gebruiken. Voor view-gegenereerde trainings is `id` de deterministische UUID; de detail-query moet via dezelfde view lezen.

### 4.3 CMS — Trainingsformulier — `app/dashboard/activiteiten/nieuw/_components/TrainingForm.tsx`

| Element | Wijziging |
|---|---|
| Knop "Genereer terugkerende trainings" | **Verwijderen** |
| Toelichting "Trainings worden automatisch zichtbaar in de agenda" | **Toevoegen** als ds-caption onder de form, kleur `--color-text-2` |
| Velden | `team_id`, `day_of_week`, `start_time`, `end_time`, `location`, `notes`, `valid_from`, `valid_until` — ongewijzigd |
| Submit-knop | "Opslaan" — wijzigt label van "Aanmaken & genereren" → "Opslaan" |

**Lege staat (geen rules):** "Nog geen terugkerende trainings ingepland."
**Foutmelding:** "Kon trainingsschema niet opslaan. Probeer het opnieuw." (geen raw Supabase-errors).

### 4.4 CMS — Activiteiten lijst — `app/dashboard/activiteiten/page.tsx`

**Wijziging:** lijst leest uit dezelfde view zodat trainings on-the-fly verschijnen i.p.v. gematerialiseerd. Filter "Alleen toekomst" blijft werken.

### 4.5 Notificatie-instellingen (mobile) — `app/notificatie-instellingen.tsx`

| Element | Wijziging |
|---|---|
| Toggle "Training-herinneringen" | **Verwijderen** |
| Lijst-volgorde | Wedstrijd, Bardienst, Aankondiging — training valt weg |

Geen migratie-melding voor de gebruiker; verwijderen is silent.

### Design-tokens

Geen nieuwe tokens. Alle gebruikte styles (kleur-blue voor trainings, dot-grootte, card-radius) bestaan al.

---

## 5. Technical design

### 5.1 Database

#### Migration: `YYYYMMDDHHMMSS_kalender_recurring_view.sql`

**Stap A — Hard-delete bestaande gegenereerde rule-rijen die geen override zijn**

Bestaande `activities` met `type='training' AND recurring_rule_id IS NOT NULL` zijn gematerialiseerde rijen. Een echte override is een rij waarvan tijd of locatie afwijkt van de rule (we hebben dat niet expliciet getagd). Pragmatische heuristiek: hard-delete álle `(type='training', recurring_rule_id IS NOT NULL)` rijen waarvan `time(starts_at) = recurring_rules.start_time` AND `coalesce(location, '') = coalesce(recurring_rules.location, '')`. Rijen die afwijken (de daadwerkelijke overrides) blijven staan.

```sql
delete from public.activities a
using public.recurring_rules r
where a.recurring_rule_id = r.id
  and a.type = 'training'
  and a.deleted_at is null
  and (a.starts_at::time = r.start_time)
  and (coalesce(a.location, '') = coalesce(r.location, ''));
```

**Stap B — UUID v5 helper**

Postgres heeft geen ingebouwde UUID v5; we gebruiken `pgcrypto.digest` om een SHA-1 te maken en die in UUID-formaat te zetten. Namespace constant: een hardcoded UUID voor "training-occurrence".

```sql
create extension if not exists pgcrypto;

create or replace function public.uuid_v5_training_occurrence(
  p_rule_id uuid,
  p_date date
) returns uuid
language sql
immutable
parallel safe
as $$
  -- Namespace: 7d4f4a8b-1234-5678-9abc-def012345678 (constant for training-occurrence)
  with input as (
    select decode('7d4f4a8b1234567819abdef012345678', 'hex')
        || decode(replace(p_rule_id::text, '-', ''), 'hex')
        || convert_to(to_char(p_date, 'YYYY-MM-DD'), 'UTF8') as bytes
  ),
  hashed as (
    select substring(digest((select bytes from input), 'sha1') from 1 for 16) as h
  )
  select (
    -- set version 5 (top nibble of byte 6)
    encode(
      set_byte(
        set_byte(
          (select h from hashed),
          6,
          (get_byte((select h from hashed), 6) & 15) | 80
        ),
        8,
        (get_byte((select h from hashed), 8) & 63) | 128
      ),
      'hex'
    )
  )::uuid;
$$;
```

> **Note:** als de bovenstaande exact-cast complexiteit te broos blijkt, valt terug op een eenvoudige deterministische hash via `md5` cast naar UUID — niet strikt v5 maar wel deterministisch en collision-vrij voor onze input-ruimte. Beslissing tijdens implementatie.

**Stap C — View `activities_with_occurrences`**

```sql
create or replace view public.activities_with_occurrences
with (security_invoker = true)
as
-- 1) Alle bestaande activities-rijen, ongewijzigd
select
  a.id,
  a.type,
  a.sport,
  a.team_id,
  a.recurring_rule_id,
  a.bar_day_slot_id,
  a.title,
  a.starts_at,
  a.ends_at,
  a.location,
  a.notes,
  a.created_at,
  a.updated_at,
  a.deleted_at,
  false as is_generated
from public.activities a

union all

-- 2) Gegenereerde training-occurrences uit recurring_rules
select
  public.uuid_v5_training_occurrence(r.id, d::date)            as id,
  'training'                                                    as type,
  t.sport                                                       as sport,
  r.team_id                                                     as team_id,
  r.id                                                          as recurring_rule_id,
  null::uuid                                                    as bar_day_slot_id,
  ('Training ' || coalesce(t.name, ''))                         as title,
  ((d::date)::timestamp + r.start_time)                         as starts_at,
  case when r.end_time is not null
       then ((d::date)::timestamp + r.end_time)
       else null end                                            as ends_at,
  r.location                                                    as location,
  r.notes                                                       as notes,
  r.created_at                                                  as created_at,
  r.updated_at                                                  as updated_at,
  null::timestamptz                                             as deleted_at,
  true                                                          as is_generated
from public.recurring_rules r
join public.teams t on t.id = r.team_id and t.deleted_at is null
cross join lateral generate_series(
  r.valid_from,
  coalesce(r.valid_until, r.valid_from + interval '2 years'),
  interval '1 day'
) as d
where r.deleted_at is null
  and extract(isodow from d) = r.day_of_week
  -- Excludeer datums waar een override-Activity bestaat (override = gewone activities-rij)
  and not exists (
    select 1
    from public.activities ov
    where ov.recurring_rule_id = r.id
      and ov.starts_at::date = d::date
  );
```

**Notes:**
- `is_generated boolean` — extra kolom om client te informeren of dit een view-rij is. Niet strikt nodig voor de UI, wel nuttig voor debugging.
- `with (security_invoker = true)` — view gebruikt RLS van onderliggende tabellen (`activities`, `recurring_rules`, `teams`). Geen aparte policy nodig op de view.
- `generate_series` cap fallback van 2 jaar als `valid_until` ontbreekt — voorkomt ongebonden generatie.
- Override-detectie: elke `activities`-rij met `recurring_rule_id = r.id` op die datum exclude't de view-generatie. Of die override soft-deleted is doet er hier niet toe; de override-rij verschijnt zelf in de eerste UNION-tak en wordt door consumers gefilterd op `deleted_at IS NULL` (zoals nu al gebeurt in [useAgendaActivities](../../apps/mobile/hooks/useAgendaActivities.ts:102)).

**Stap D — Drop endpoint `generate-recurring`**

In een latere stap wordt het bestand verwijderd. De DB-migratie zelf raakt het endpoint niet.

**Stap E — Drop training notification preference**

```sql
alter table public.notification_preferences drop column if exists training;
```

**Indexen:**
- `recurring_rules(team_id, deleted_at)` — bestaat al.
- Toevoegen: `recurring_rules(valid_from, valid_until)` voor range-filtering binnen de view.
- `activities(recurring_rule_id, starts_at)` — voor de NOT EXISTS sub-query.

```sql
create index if not exists recurring_rules_validity_idx
  on public.recurring_rules(valid_from, valid_until)
  where deleted_at is null;

create index if not exists activities_rule_date_idx
  on public.activities(recurring_rule_id, (starts_at::date))
  where recurring_rule_id is not null;
```

**RLS:**
- Geen nieuwe policies. View vertrouwt op `security_invoker` + bestaande policies op `activities`, `recurring_rules`, `teams`.

### 5.2 Gedeelde types (`packages/shared/src/`)

**`types/db.types.ts`** — regenereer via `supabase gen types typescript --local`. Verwacht: nieuwe `Views.activities_with_occurrences` entry.

**`types/app.types.ts`:**
- Geen nieuwe types nodig — `Activity` en `ActivityWithDetails` blijven gelijk.
- Verwijder `training` uit `NotificationPreferences` type-shape.

**`schemas/notificationPreferences.schema.ts`:**
- Verwijder veld `training` uit zowel `NotificationPreferencesSchema` als `UpdateNotificationPreferencesSchema`.

**`schemas/cms.schema.ts`:**
- Geen wijziging aan `RecurringRuleSchema`.

### 5.3 Mobiele implementatie (`apps/mobile/`)

**Hooks:**
- `hooks/useAgendaActivities.ts` — change `from('activities')` → `from('activities_with_occurrences')`. Rest blijft gelijk.
- `hooks/useUpcomingActivities.ts` — idem.
- `hooks/useActivityDetail.ts` — idem; voor view-rijen werkt match-join niet (matches.activity_id is FK naar activities), maar trainings hebben sowieso geen match. Bar_assignments-join niet relevant voor trainings. Veilig.

**Schermen:**
- `app/notificatie-instellingen.tsx` — verwijder training-toggle blok.
- `app/(tabs)/__tests__/agenda.test.tsx` — update mock-data om view-shape te reflecteren.
- `app/__tests__/notificatie-instellingen.test.tsx` — verwijder training-toggle test.

**Stores:**
- Geen wijziging.

### 5.4 Web CMS (`apps/web/`)

**Server vs client:** RecurringRule-formulier blijft client-component (form interactie). Activiteiten-lijst blijft server-component (RLS via supabase-server-client).

**Routes:**
- Verwijderen: `app/api/cms/activities/generate-recurring/route.ts`
- Aanpassen: `app/dashboard/activiteiten/nieuw/_components/TrainingForm.tsx` — knop weg, submit-handler doet alleen rule-insert/update.
- `app/dashboard/activiteiten/page.tsx` — switch naar `activities_with_occurrences` view voor de lijstquery.
- `app/dashboard/activiteiten/[id]/bewerken/page.tsx` — als id een view-uuid is, redirect naar rule-edit-pagina (of genereer override-dialog). MVP: alleen echte Activity-IDs (uit `activities`) zijn editable; voor view-uuids tonen we een "Bewerken via trainingsschema" link naar de rule-edit-pagina.

### 5.5 Edge functions (`supabase/functions/`)

**`reminder-scheduler/index.ts`:**
- Verwijder de `training` entry uit het `WINDOWS`-array.
- Geen verdere wijzigingen.

### 5.6 Implementatievolgorde

1. **DB-migratie** `YYYYMMDDHHMMSS_kalender_recurring_view.sql`:
   - `pgcrypto` extension
   - `uuid_v5_training_occurrence` function
   - hard-delete oude rule-rijen (Stap A)
   - view `activities_with_occurrences`
   - drop `notification_preferences.training`
   - extra indexen
2. `supabase db reset` → bevestig migrations slagen
3. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
4. **Shared schemas:** verwijder `training` uit `notificationPreferences.schema.ts` + types
5. **Mobile:**
   - Switch hooks naar view
   - Verwijder training-toggle uit notificatie-instellingen
   - Update tests
6. **Web CMS:**
   - Verwijder `generate-recurring/route.ts`
   - Pas `TrainingForm.tsx` aan
   - Switch lijst naar view
   - Pas `bewerken/page.tsx` aan voor view-uuid edge-case
7. **Edge function:** verwijder training window in `reminder-scheduler`
8. **Tests:** unit (schemas), integration (view-query met seed), e2e Playwright/Maestro voor S05/S17 scenarios
9. **Verificatie:** `pnpm typecheck`, `pnpm test`, `pnpm lint`

---

## 6. GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Indirect — view leest team-naam + locatie + notes; geen nieuwe persoonsgegevens. | — |
| Wettelijke grondslag | Overeenkomst (lidmaatschap) — ongewijzigd. | — |
| Data van kinderen (< 16 jaar)? | Geen wijziging — RLS op `team_members`/`members` blijft via onderliggende tabellen. | — |
| Bewaartermijn | Trainings worden niet gepersisteerd; alleen `recurring_rules` (soft-delete) blijven. Override-Activities volgen bestaande retentie. | — |
| Toegang beperkt via RLS? | Ja — `security_invoker` view valt terug op bestaande policies. | Verifieer in tests dat een lid van team A geen trainings van team B ziet. |
| PII in logs vermeden? | Ja — geen logging in view. | — |
| Data binnen EU (Supabase EU)? | Ja — bestaand. | — |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — geen nieuwe persoonsgegevens. | — |

---

## 7. Scenario-wijzigingen

Hoogste bestaande scenario: `16-bardienst-rooster.md`. Nieuwe scenario's beginnen bij `17-`.

### Te updaten

#### `docs/scenarios/05-activiteiten-kalender.md`

- Vervang prerequisite "Het seed-script maakt een training-Activity aan" door: "Het seed-script maakt een RecurringRule aan voor het voetbalteam (maandag 19:00, valid_from = vorige week, valid_until = +6 maanden)."
- S05-A: training-dot komt nu uit de view; voeg toelichting toe: "Onder water leest de query uit `activities_with_occurrences` view die trainings genereert uit `recurring_rules`."
- S05-B: zelfde detail-shape, maar tikken op trainingscard navigeert via deterministische view-UUID.

#### `docs/scenarios/09-notificatie-instellingen.md`

- Verwijder verwijzingen naar de "Training-herinneringen"-toggle.

#### `docs/scenarios/12-web-cms.md`

- Verwijder stap "Klik 'Genereer terugkerende trainings'".
- Vervang door: "Klik 'Opslaan'. Trainings verschijnen automatisch in de agenda."

### Nieuw

#### `docs/scenarios/17-kalender-recurring-on-the-fly.md`

Volledige inhoud:

```markdown
# Scenario: Kalender — recurring trainings on-the-fly

End-to-end flow: trainings worden niet meer gematerialiseerd in `activities`, maar
gegenereerd uit `recurring_rules` via de view `activities_with_occurrences`.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data toegepast
- RecurringRule bestaat: maandag 19:00, valid_from = vandaag − 7d, valid_until = vandaag + 90d
- Test Lid is via team_members gekoppeld aan het team van de rule

---

## S17-A — RecurringRule produceert dots zonder materialisatie

**Goal:** Een nieuwe RecurringRule levert direct trainings in de agenda, zonder
een "genereer"-knop.

**Steps:**

1. Log in als Test Beheerder in CMS.
2. Open `/dashboard/activiteiten/nieuw`, kies "Training", vul rule-velden in
   (maandag, 19:00–20:30, valid_from = vandaag, valid_until = +30d).
3. Klik "Opslaan".
4. Open de mobiele app als Test Lid.
5. Open Agenda-tab op de huidige maand.

**Expected result:**

- Op elke maandag binnen het venster verschijnt een blauwe trainingsdot.
- Geen aparte "Genereer"-stap was nodig.
- `select count(*) from activities where recurring_rule_id = '<id>'` → 0 rijen.

**Verificatie via Studio:**

- `recurring_rules`: 1 rij voor de aangemaakte rule.
- `activities_with_occurrences`: meerdere rijen voor die rule, één per maandag.

---

## S17-B — Override op één datum overschrijft de rule

**Goal:** Een override-Activity op een specifieke datum vervangt de gegenereerde
training voor die datum.

**Prerequisites:** S17-A.

**Steps:**

1. Log in als Test Beheerder.
2. Open de eerstvolgende maandag in CMS-agenda.
3. Klik op de gegenereerde trainingscard, kies "Wijzigen alleen deze datum".
4. Pas tijd aan naar 18:00 en klik "Opslaan".
5. Open mobiele app, ga naar diezelfde datum.

**Expected result:**

- Eén trainingscard op die datum, met tijd 18:00 (override), niet 19:00 (rule).
- Andere maandagen tonen nog steeds 19:00.

**Verificatie via Studio:**

- `activities`: 1 nieuwe rij met `recurring_rule_id = <id>` en starts_at op die datum.
- `activities_with_occurrences`: voor die datum levert de view alleen de override-rij,
  niet de gegenereerde rij.

---

## S17-C — Soft-deleted override = afgelaste training

**Goal:** Een override met `deleted_at` zorgt dat de training onzichtbaar is.

**Prerequisites:** RecurringRule actief.

**Steps:**

1. Log in als Test Beheerder.
2. Open een specifieke maandag.
3. Klik "Annuleren". Bevestig.
4. Open mobiele app, ga naar diezelfde datum.

**Expected result:**

- Geen trainingsdot op die datum.
- Daglijst toont "Geen activiteiten op deze dag." (of overige activiteiten zonder de training).

**Verificatie via Studio:**

- `activities`: rij met `recurring_rule_id = <id>` op die datum, `deleted_at` gezet.
- `activities_with_occurrences`: voor die datum geen rij voor deze rule.

---

## S17-D — RecurringRule wijzigen update alle toekomstige occurrences

**Goal:** Tijd of locatie aanpassen op de rule reflecteert direct in de agenda.

**Steps:**

1. Log in als Test Beheerder.
2. Open de rule, wijzig start_time van 19:00 → 19:30, klik "Opslaan".
3. Open mobiele app, refresh de agenda.

**Expected result:**

- Alle toekomstige maandagen tonen tijd 19:30.
- Datums met een override behouden hun override-tijd (niet beïnvloed).

---

## S17-E — Geen training-notificatie meer in voorkeuren

**Goal:** Training-notificaties zijn volledig verwijderd uit het systeem.

**Steps:**

1. Log in als Test Lid.
2. Open Notificatie-instellingen.

**Expected result:**

- Toggles zichtbaar: Wedstrijd, Bardienst, Aankondiging.
- Géén "Training"-toggle.

**Verificatie via Studio:**

- `notification_preferences`: kolom `training` bestaat niet (alleen wedstrijd, bardienst, aankondiging, profile_id, id, timestamps).
- `notifications`: geen rijen met type `training_herinnering`.

---

## S17-F — Lid van team A ziet geen trainings van team B (RLS)

**Goal:** RLS via `security_invoker` view blokkeert cross-team-trainings.

**Prerequisites:** RecurringRule voor team A en RecurringRule voor team B.

**Steps:**

1. Log in als Test Lid (alleen gekoppeld aan team A).
2. Query `activities_with_occurrences` via supabase-js.

**Expected result:**

- Resultset bevat alleen rijen met `team_id = team_A`.
- Geen rijen voor team B.
```

---

## 8. Implementatieplan (genummerd)

1. **Migratie schrijven**: `supabase/migrations/YYYYMMDDHHMMSS_kalender_recurring_view.sql`
   - `pgcrypto` extension + `uuid_v5_training_occurrence` function
   - hard-delete oude rule-rijen
   - view `activities_with_occurrences` met `security_invoker = true`
   - drop `notification_preferences.training`
   - indexen `recurring_rules_validity_idx`, `activities_rule_date_idx`
2. `supabase db reset` — bevestig dat migration foutloos draait
3. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
4. **Shared package:**
   - Update `packages/shared/src/schemas/notificationPreferences.schema.ts` (drop `training`)
   - Update `packages/shared/src/types/app.types.ts` (`NotificationPreferences` zonder training)
   - Update `packages/shared/src/__tests__/notificationPreferences.schema.test.ts`
5. **Mobile:**
   - `apps/mobile/hooks/useAgendaActivities.ts` — switch table → view
   - `apps/mobile/hooks/useUpcomingActivities.ts` — switch table → view
   - `apps/mobile/hooks/useActivityDetail.ts` — switch table → view
   - `apps/mobile/app/notificatie-instellingen.tsx` — verwijder training-blok
   - `apps/mobile/app/__tests__/notificatie-instellingen.test.tsx` — verwijder training-test
   - `apps/mobile/app/(tabs)/__tests__/agenda.test.tsx` — update mock voor view
6. **Web CMS:**
   - Delete `apps/web/app/api/cms/activities/generate-recurring/route.ts`
   - `apps/web/app/dashboard/activiteiten/nieuw/_components/TrainingForm.tsx` — verwijder generate-knop, simplify submit
   - `apps/web/app/dashboard/activiteiten/page.tsx` — switch naar view
   - `apps/web/app/dashboard/activiteiten/[id]/bewerken/page.tsx` — handle view-uuid edge case (redirect naar rule-edit)
   - `apps/web/app/dashboard/activiteiten/__tests__/activiteiten.test.tsx` — update
7. **Edge function:** `supabase/functions/reminder-scheduler/index.ts` — verwijder training-window
8. **Seed:** `supabase/seed.ts` (en `apps/web/scripts/seed.ts`) — vervang training-Activity insert door RecurringRule insert
9. **Scenario's bijwerken:**
   - Update `docs/scenarios/05-activiteiten-kalender.md`
   - Update `docs/scenarios/09-notificatie-instellingen.md`
   - Update `docs/scenarios/12-web-cms.md`
   - Create `docs/scenarios/17-kalender-recurring-on-the-fly.md`
10. **Verificatie:**
    - `pnpm typecheck`
    - `pnpm test`
    - `pnpm lint`
11. **REFACTOR_BACKLOG.md:** zet R-01 status op "afgerond" met PR-link

---

## 9. Open vragen

1. **UUID v5 implementatie:** lukt de bovenstaande pure-SQL UUID v5 implementatie of moet het terugvallen op `md5(text)::uuid` (deterministisch maar niet strikt v5)? **Default tijdens implementatie:** start met v5, fallback naar md5 als de bytes-manipulatie te broos blijkt.
2. **`activities_with_occurrences` view en match-FK:** `matches.activity_id` is FK naar `activities`, niet naar de view. Voor trainings is dit niet relevant (geen match). Maar de huidige hook `useActivityDetail` joint via `matches(...)`. Verifieer dat de join leeg returnt voor view-rijen i.p.v. een fout te gooien. Test in S17-A.
3. **CMS bewerk-flow voor view-uuid:** wat doet de huidige `[id]/bewerken/page.tsx` als de id een view-uuid is en niet in `activities`-tabel staat? Beslissing voor MVP: 404 met link "Bewerk het trainingsschema" → rule-edit-page.
