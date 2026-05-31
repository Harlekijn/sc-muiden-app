<!-- generated: 2026-05-29 -->

# Design: Bardienst — `BarDaySlot` opheffen (R-02)

Feature slug: `bardienst-activity-merge`

Refactor R-02 uit [docs/REFACTOR_BACKLOG.md](../REFACTOR_BACKLOG.md).

`Activity(type='bardienst')` wordt dé bar-dag. De tussenlaag `bar_day_slots` (met FK
`activities.bar_day_slot_id`) verdwijnt; bardiensten worden direct in `activities`
geschreven door de generator/publish-flow.

---

## Gebruiksscenario's (Use Cases)

| ID | Wie | Actie | Resultaat |
|---|---|---|---|
| UC-01 | Beheerder | Plant in één wizard-run één of meer bardienst-dagen (datum/tijd/sport per dag) en publiceert het rooster | `activities` + `bar_assignments` + `notifications` worden aangemaakt; geen `bar_day_slots`-rij |
| UC-02 | Beheerder | Past de preview handmatig aan vóór publicatie | Andere lid op een specifieke positie zonder paginaherlaad |
| UC-03 | Beheerder | Bekijkt het gepubliceerde rooster, gegroepeerd per datum | Bevestigingsstatus per dienst zichtbaar in een tabblad |
| UC-04 | Beheerder | Wisselt na publicatie een lid op één dienst om | `bar_assignments.member_id` updaten via PATCH |
| UC-05 | Beheerder | Verwijdert één dienst uit het rooster | `Activity(type='bardienst')` soft-delete; `bar_assignments` blijven via FK staan |
| UC-06 | Systeem | Verdeelt barcommissieleden en reguliere leden eerlijk over alle dagen in één wizard-run | Fairness-score wordt cross-dag bijgehouden binnen één generatie |

---

## Gebruikersstromen (User Flows)

### UC-01 — Plannen en publiceren via wizard

**Happy path:**

1. Beheerder navigeert naar `/dashboard/bardienst/`. Pagina toont alleen de tab "Rooster".
2. Klikt op "Genereer rooster" — naar `/dashboard/bardienst/genereren`.
3. **Stap 1 — Dagen invoeren:** kiest seizoen (label, geen DB-veld; gebruikt voor fairness-bounds),
   voegt één of meer dagen toe via "+ Dag toevoegen". Per dag: datum, begintijd, eindtijd, sport
   (Voetbal/Hockey/Club-breed). Klikt "Genereer preview".
4. Server splitst elke dag in 2,5u-diensten en wijst leden toe (zelfde algoritme als nu;
   fairness over alle dagen in één run).
5. **Stap 2 — Preview:** toont per dag een card met diensten en toegewezen leden.
   Beheerder kan per slot een lid omwisselen (zoek-dropdown).
6. **Stap 3 — Publiceren:** samenvatting (X dagen, Y diensten, Z leden). "Publiceer rooster".
7. Server schrijft per dienst een `Activity(type='bardienst')` rij, drie `bar_assignments`,
   en `notifications` voor leden met een gekoppeld profiel.
8. Redirect naar `/dashboard/bardienst?tab=rooster` met fresh data.

**Foutpaden** (ongewijzigd t.o.v. huidig gedrag):

- Onvoldoende barcommissieleden voor een dag → 422 met code `INSUFFICIENT_BARCOMMISSIE`,
  banner: `"Onvoldoende barcommissieleden beschikbaar voor [datum]. Er zijn minimaal [N] nodig voor [M] diensten."`
- Onvoldoende reguliere leden → 422 met code `INSUFFICIENT_REGULAR`, banner:
  `"Onvoldoende reguliere leden beschikbaar voor [datum]. Er zijn [X] leden beschikbaar, maar [Y] nodig."`
- Eindtijd ≤ begintijd op een dag → Zod-validatie, formulier blokkeert "Genereer preview".
- Datum in het verleden → toegestaan in deze refactor (zelfde als huidige `Activity`-edit-flow).
  Geen client-side blokkade; UX-overweging voor later.
- Netwerkfout → `"Geen verbinding — controleer je internetverbinding en probeer opnieuw."`,
  knoppen blijven actief.
- Publicatie mislukt halverwege → reeds aangemaakte `Activity`-rijen worden gecleaned
  (zelfde rollback-pattern als nu).

---

### UC-02 — Preview handmatig aanpassen

Identiek aan huidig gedrag (zie design `bardienst-rooster.md` UC-03). Endpoint
`/api/cms/bardienst/genereer/leden` blijft bestaan; gebruikt `season` (label) voor
fairness-bounds, `sport` (optioneel) voor filter, en `exclude` voor uitsluitingen.

---

### UC-03 — Gepubliceerd rooster bekijken

**Happy path:**

1. Beheerder navigeert naar `/dashboard/bardienst?tab=rooster`.
2. Pagina laadt alle `Activity(type='bardienst')` rijen waar `deleted_at IS NULL`,
   met embedded `bar_assignments` + `members`.
3. RoosterClient groepeert in geheugen op `starts_at::date` (datum-string `YYYY-MM-DD`).
4. Per dag-card: alle diensten gesorteerd op `starts_at`. Per dienst: 3 leden met
   bevestigingsstatus.
5. Beheerder kan een lid omwisselen via "Wijzigen" → PATCH op `bar_assignments`.

**Verschil met huidig gedrag:**

- Geen "Dag verwijderen"-knop meer (zou een bulk-soft-delete zijn over `bar_day_slot_id`,
  die kolom is verdwenen). Per-activity verwijdering kan via de bestaande
  activity-edit-flow.

---

### UC-04 / UC-05

PATCH `bar_assignments` (UC-04) en soft-delete `Activity` (UC-05) — beide bestaande
mechanismen. Geen wijziging in deze refactor.

---

## Acceptatiecriteria

### UC-01

- Gegeven een wizard-run met N dagen × M diensten en voldoende leden, als beheerder publiceert,
  dan bestaan er N×M `Activity(type='bardienst')` rijen, elk met `deleted_at IS NULL` en zonder
  `bar_day_slot_id`-kolom in het schema.
- Gegeven een gepubliceerde dienst, dan zijn er drie `bar_assignments`-rijen met de juiste `activity_id`.
- Gegeven betrokken leden met een gekoppeld profiel, dan ontvangen zij een rij in `notifications` met `type='bardienst'`.
- Gegeven een fairness-tracking binnen één run, dan krijgt een lid niet twee diensten op dezelfde dag toegewezen.
- Gegeven een fairness-tracking, dan krijgt een lid dat in dag 1 is toegewezen lagere prioriteit voor dag 2 (binnen één run).

### UC-02

- Gegeven een omwissel-actie, dan toont de dropdown alleen leden die voldoen aan dezelfde
  eligibiliteitsregels (barcommissie/regulier) en sport-overlap.
- Gegeven een uitwisseling, dan reflecteert de preview de wijziging zonder paginaherlaad.

### UC-03

- Gegeven een rooster met diensten op verschillende datums, dan toont het tabblad "Rooster"
  diensten gegroepeerd per kalenderdag (lokale tijd; format `zaterdag 26 april 2026`).
- Gegeven dag X heeft 0 zichtbare bardienst-activiteiten, dan toont de pagina deze dag niet.

### UC-04

- Gegeven een PATCH op een `bar_assignment`, dan is de rij geüpdatet en blijft de bijbehorende
  activity ongewijzigd.

### UC-05

- Gegeven een soft-deleted bardienst-activiteit, dan verschijnt deze niet meer in het Rooster-tabblad.

### UC-06 (regressie)

- Gegeven publicatie van wizard-run R1 en daarna run R2, dan reflecteren de fairness-scores in
  R2 de toewijzingen uit R1 (server leest `bar_assignments` voor het opgegeven seizoen-bereik).
- Gegeven `season='2025-2026'`, dan dekken fairness-bounds `2025-08-01 .. 2026-07-31`.

---

## UI / Grafisch Design

### 1. Bardienst Overzicht

**Naam:** Bardienst
**Route:** `/dashboard/bardienst/`
**Lay-out:**

- CMS-standaard sidebar + content area.
- Paginatitel: "Bardienst" (`ds-h1`, `--color-navy`).
- Eén tab: "Rooster" (geen "Day slots"-tab meer). Tab-bar blijft als visueel anker
  voor toekomstige uitbreidingen.
- Actieknop rechts boven tab-inhoud: "Genereer rooster" (primary, `--color-blue`,
  link naar `/dashboard/bardienst/genereren`).

**Tab: Rooster**

- Filterbalk: "Van" (`<input type="date">`) en "Tot" (`<input type="date">`); "Wis filter"-knop
  als één van beide is gevuld. Ongewijzigd t.o.v. huidig.
- Diensten gegroepeerd per kalenderdag (card per dag).
- Per dag-card:
  - Header: datum als `zaterdag 26 april 2026` (`ds-h4`, `--color-navy`).
  - **Geen** "Dag verwijderen"-knop (verschil met huidig).
  - Per dienst (gesorteerd op `starts_at`): tijdvenster, 3 ledenrijen met naam +
    bevestigings-badge. Knop "Wijzigen" per ledenrij opent inline `<select>` voor
    omwissel.
- Lege staat: `"Nog geen rooster gepubliceerd"`, sub-tekst `"Genereer een rooster via de knop hierboven."`
- Foutmelding: `"Verwijderen mislukt. Probeer het opnieuw."` / `"Opslaan mislukt. Probeer het opnieuw."`
  / `"Geen verbinding — controleer je internetverbinding en probeer opnieuw."`

---

### 2. Rooster generatie-wizard

**Naam:** Rooster genereren
**Route:** `/dashboard/bardienst/genereren`

**Stap 1 — Dagen invoeren**

- Card (`max-width: 800px`, `--color-white`, 10px radius, navy shadow).
- Veld "Seizoen" (`<input type="text">`, placeholder `2025-2026`, label "Seizoen").
  Tekstveld i.p.v. `<select>`: er is geen DB-bron meer voor seizoenen.
- Sectie "Dagen":
  - Lijst van rijen — initieel één lege rij. Knop "+ Dag toevoegen" voegt een rij toe;
    knop `<X />` (Lucide) verwijdert een rij (min. 1 rij).
  - Per rij: datum (`<input type="date">`), begintijd (`<input type="time">`),
    eindtijd (`<input type="time">`), sport (`<select>` met opties "Voetbal", "Hockey", "Club-breed").
  - Foutmelding-rij `--color-error` onder een specifieke rij bij Zod-validatiefout
    (eindtijd ≤ begintijd, datum ongeldig).
- Knop "Genereer preview" (primary). Disabled als seizoen leeg is, geen dagen, of
  onvolledige rij. Spinner tijdens API-call.
- Foutbanner bij 422 / netwerkfout in `--color-error-bg`.

**Stap 2 — Preview** (ongewijzigd t.o.v. huidig)

- Per dag-card; per dienst 3 leden; "Omwisselen" per slot. Identiek aan huidige
  `StapPreview`-component.

**Stap 3 — Publiceren** (ongewijzigd)

- Samenvatting + "Publiceer rooster"-knop. Identiek.

---

## Technisch Design

### Database wijzigingen

#### Migratie: `YYYYMMDDHHMMSS_drop_bar_day_slots.sql`

```sql
-- R-02 — Drop BarDaySlot; Activity(type='bardienst') is de bar-dag
--
-- Geen prod-data: drop & recreate. supabase db reset herstelt de seed.

-- 1. View activities_with_occurrences vervangen zonder bar_day_slot_id-kolom
drop view if exists public.activities_with_occurrences;

-- 2. FK + index op activities verwijderen
drop index if exists activities_bar_day_slot_id_idx;
alter table public.activities drop column if exists bar_day_slot_id;

-- 3. Tabel droppen
drop table if exists public.bar_day_slots cascade;

-- 4. View opnieuw aanmaken zonder bar_day_slot_id-kolom
create or replace view public.activities_with_occurrences
with (security_invoker = true)
as
select
  a.id,
  a.type,
  a.sport,
  a.team_id,
  a.recurring_rule_id,
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

select
  public.training_occurrence_id(r.id, d::date)                  as id,
  'training'                                                    as type,
  t.sport                                                       as sport,
  r.team_id                                                     as team_id,
  r.id                                                          as recurring_rule_id,
  ('Training ' || coalesce(t.name, ''))                         as title,
  ((d::date) + r.start_time)::timestamptz                       as starts_at,
  case when r.end_time is not null
       then ((d::date) + r.end_time)::timestamptz
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
  r.valid_from::timestamp,
  coalesce(r.valid_until, r.valid_from + interval '2 years')::timestamp,
  interval '1 day'
) as d
where r.deleted_at is null
  and extract(isodow from d) = r.day_of_week
  and not exists (
    select 1
    from public.activities ov
    where ov.recurring_rule_id = r.id
      and (ov.starts_at)::date = d::date
  );
```

`drop table ... cascade` neemt impliciet de RLS-policy, indexes en trigger op
`bar_day_slots` mee. Geen RLS-aanpassingen nodig op `activities`.

---

### Shared types (`packages/shared/src/`)

**Verwijderen uit `app.types.ts`:**

```ts
export interface BarDaySlot { ... }
export interface BarRosterPreview { bar_day_slot_id: string; ... }
```

**Vervangen door:**

```ts
export interface BarRosterPreview {
  preview_id: string;          // client-side UUID, uniek per dag in de wizard-run
  date: string;                // 'YYYY-MM-DD'
  sport: Sport | null;
  starts_at: string;           // 'HH:MM' — alleen voor preview-rendering
  ends_at: string;
  shifts: BarShift[];
}
```

`BarShift` en `BarShiftMember` blijven ongewijzigd.

**Verwijderen uit `cms.schema.ts`:**

```ts
export const createBarDaySlotSchema = ...
export const updateBarDaySlotSchema = ...
```

**Vervangen `generateRosterSchema`:**

```ts
const wizardDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ongeldige datum' }),
  starts_at: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige begintijd' }),
  ends_at: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige eindtijd' }),
  sport: z.enum(['voetbal', 'hockey']).nullable(),
}).refine((d) => d.ends_at > d.starts_at, {
  message: 'De eindtijd moet na de begintijd liggen',
  path: ['ends_at'],
});

export const generateRosterSchema = z.object({
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  dagen: z.array(wizardDaySchema).min(1, { message: 'Voer minimaal één dag in' }),
});
```

**Vervangen `publishRosterSchema`** (preview heeft nu `preview_id` + datum/sport ipv `bar_day_slot_id`):

```ts
const barRosterPreviewItemSchema = z.object({
  preview_id: z.string().uuid({ message: 'Ongeldig preview-ID' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ongeldige datum' }),
  sport: z.enum(['voetbal', 'hockey']).nullable(),
  shifts: z.array(barShiftSchema).min(1, { message: 'Minimaal één dienst vereist' }),
});

export const publishRosterSchema = z.object({
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  preview: z.array(barRosterPreviewItemSchema).min(1, { message: 'Preview bevat geen diensten' }),
});
```

---

### Algoritme (`apps/web/lib/bardienst-algoritme.ts`)

`AlgorithmSlot` → `AlgorithmDay`:

```ts
export type AlgorithmDay = {
  preview_id: string;          // client-side UUID
  date: string;                // 'YYYY-MM-DD'
  starts_at: string;           // 'HH:MM' of 'HH:MM:SS'
  ends_at: string;
  sport: Sport | null;
};

export function genereerPreviewVoorDag(
  day: AlgorithmDay,
  allMembers: AlgorithmMember[],
  fairnessMap: Map<string, number>
): BarRosterPreview | GenereerFout
```

Logica blijft identiek; alleen veldnaam-mapping wijzigt:

- `slot.id` → `day.preview_id`
- preview-output: `bar_day_slot_id` → `preview_id`, plus `starts_at`/`ends_at`-velden
  (oorspronkelijke wizard-tijden) toegevoegd voor rendering.

Fairness-cross-day-update binnen één run blijft (zelfde `runScores`-pattern).

---

### Web CMS implementatie

**Verwijderen:**

- `apps/web/app/api/cms/bardienst/day-slots/route.ts` (GET + POST)
- `apps/web/app/api/cms/bardienst/day-slots/[id]/route.ts` (PUT + DELETE)
- `apps/web/app/api/cms/bardienst/rooster/[slotId]/route.ts` (DELETE op slot)
- `apps/web/app/dashboard/bardienst/_components/BarDaySlotForm.tsx`
- `apps/web/app/dashboard/bardienst/_components/DaySlotsTab.tsx`
- `apps/web/app/dashboard/bardienst/day-slots/` (volledige tree)

**Wijzigen:**

| Bestand | Wijziging |
|---|---|
| `apps/web/app/api/cms/bardienst/genereer/route.ts` | Body: `{season, dagen}`. Geen DB-load van `bar_day_slots`; itereert direct over `dagen`. Roept `genereerPreviewVoorDag` per dag. |
| `apps/web/app/api/cms/bardienst/publiceer/route.ts` | Geen `bar_day_slots`-lookup meer; sport komt uit `preview.sport`. `activities.insert` zonder `bar_day_slot_id`. Cleanup-pad blijft. |
| `apps/web/app/dashboard/bardienst/page.tsx` | Tab-bar bevat alleen "Rooster". Server-load: query op `Activity(type='bardienst')` zonder `.not('bar_day_slot_id','is',null)`-filter. |
| `apps/web/app/dashboard/bardienst/_components/RoosterClient.tsx` | `Activity.bar_day_slot_id` veld weg. `groupBySlot` → `groupByDate(starts_at::date)`. "Dag verwijderen"-knop verwijderd. |
| `apps/web/app/dashboard/bardienst/genereren/page.tsx` | Geen DB-load van `bar_day_slots`. Render `<GenereerWizard />` zonder props. |
| `apps/web/app/dashboard/bardienst/genereren/_components/GenereerWizard.tsx` | StapSelectie → StapDagen (lijst van form-rijen + add/remove). State: `dagen: WizardDay[]`. Body voor `/genereer`: `{season, dagen}`. Body voor `/publiceer`: `{season, preview}` (preview shape gewijzigd). Stap2/3 ongewijzigd qua structuur, alleen types. |
| `apps/web/lib/bardienst-algoritme.ts` | Type rename + functie rename zoals hierboven. |
| `apps/web/__tests__/bardienst/algoritme.test.ts` | Update naar `AlgorithmDay`. |

**Geen wijziging:**

- `apps/web/app/api/cms/bardienst/genereer/leden/route.ts` (geen slot-koppeling).
- `apps/web/app/api/cms/bardienst/rooster/assignments/[id]/route.ts` (PATCH op `bar_assignments`).

---

### Mobile / shared impact

- Mobile: geen veranderingen — geen referenties naar `bar_day_slots` of `bar_day_slot_id`.
- View `activities_with_occurrences` levert geen `bar_day_slot_id` meer; mobile leest die kolom niet.
- `enrichActivities` verwerkt deze kolom niet → automatisch compatible.

---

### Implementatievolgorde

1. Migratie schrijven: `supabase/migrations/<ts>_drop_bar_day_slots.sql`.
2. `supabase db reset` (dev-omgeving).
3. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`.
4. Shared types & schemas refactoren (`app.types.ts`, `cms.schema.ts`).
5. Algoritme-bestand refactoren (rename + signature update).
6. API routes:
   a. `genereer/route.ts` (nieuwe body shape).
   b. `publiceer/route.ts` (sport uit preview).
   c. `day-slots/*` en `rooster/[slotId]/route.ts` verwijderen.
7. CMS-pagina's:
   a. `bardienst/page.tsx` (tab-bar simplificatie, query update).
   b. `RoosterClient.tsx` (groupByDate, geen slot-DELETE).
   c. `genereren/page.tsx` (geen DB-load).
   d. `GenereerWizard.tsx` (StapDagen-component).
   e. `BarDaySlotForm.tsx`, `DaySlotsTab.tsx`, `day-slots/`-tree verwijderen.
8. Tests bijwerken: `__tests__/bardienst/algoritme.test.ts`, `packages/shared/src/__tests__/cms.schema.test.ts`.
9. `pnpm typecheck && pnpm test && pnpm lint`.
10. Update `docs/REFACTOR_BACKLOG.md` — R-02 status → afgerond.

---

## GDPR Compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Ja — namen/lid-data via `bar_assignments` (ongewijzigd) | — |
| Wettelijke grondslag | Gerechtvaardigd belang — clubbeheer (ongewijzigd) | — |
| Data van kinderen (< 16 jaar)? | Ja — `lid_type='jeugdlid'` kan worden ingepland (ongewijzigd) | RLS via `is_admin()` op `activities`/`bar_assignments` blijft staan |
| Bewaartermijn | Soft-delete; historische roosters bewaard (ongewijzigd) | — |
| Toegang beperkt via RLS? | Ja — `activities`/`bar_assignments` admin-policies blijven; `bar_day_slots`-policy verdwijnt met de tabel | — |
| PII in logs vermeden? | Ja (geen nieuwe logregels in deze refactor) | — |
| Data binnen EU (Supabase EU-region)? | Ja | — |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete + `bar_assignments`-DELETE; geen `bar_day_slots` meer als extra plek | DSAR-flow vereenvoudigt |

Eén **positieve GDPR-impact:** het aantal tabellen met persoonsgegeven-koppelingen
neemt af (één laag minder waar member_id's te traceren zijn).

---

## Scenario's

### S16 — vervangen

Het bestaande bestand `docs/scenarios/16-bardienst-rooster.md` wordt volledig vervangen
(zelfde nummer, nieuwe inhoud — day-slot-stappen vervallen). Zie de bijgewerkte versie
in `docs/scenarios/16-bardienst-rooster.md` na deze design-commit.

### S07 — geen wijziging

`docs/scenarios/07-bardienst-bevestigen.md` blijft geldig: een bardienst-activity is
nog steeds een `Activity(type='bardienst')` met `bar_assignments`. Bevestig-flow ongewijzigd.

### S17 — geen wijziging

`docs/scenarios/17-kalender-recurring-on-the-fly.md` blijft geldig: de view-rijen
worden gefilterd op `recurring_rule_id`. Verdwenen `bar_day_slot_id` kolom is niet
zichtbaar voor de mobile-flow.

---

## Implementatieplan (checklist)

1. [ ] Schrijf `supabase/migrations/<YYYYMMDDHHMMSS>_drop_bar_day_slots.sql` (drop view → drop FK + kolom + index → drop table cascade → recreate view zonder `bar_day_slot_id`).
2. [ ] `supabase db reset`.
3. [ ] `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`.
4. [ ] `packages/shared/src/types/app.types.ts`: drop `BarDaySlot`; refactor `BarRosterPreview` (preview_id + sport + datum + starts_at/ends_at; geen bar_day_slot_id).
5. [ ] `packages/shared/src/schemas/cms.schema.ts`: drop `createBarDaySlotSchema`, `updateBarDaySlotSchema`, `CreateBarDaySlotInput`, `UpdateBarDaySlotInput`. Refactor `generateRosterSchema` (dagen-array). Refactor `publishRosterSchema` / `barRosterPreviewItemSchema` (preview_id ipv bar_day_slot_id).
6. [ ] `packages/shared/src/__tests__/cms.schema.test.ts`: update tests voor nieuwe shapes.
7. [ ] `apps/web/lib/bardienst-algoritme.ts`: `AlgorithmSlot` → `AlgorithmDay`; `genereerPreviewVoorSlot` → `genereerPreviewVoorDag`; preview-output gebruikt `preview_id`.
8. [ ] `apps/web/__tests__/bardienst/algoritme.test.ts`: update naar nieuwe types.
9. [ ] `apps/web/app/api/cms/bardienst/genereer/route.ts`: body = `{season, dagen}`; geen `bar_day_slots`-load.
10. [ ] `apps/web/app/api/cms/bardienst/publiceer/route.ts`: sport uit `preview.sport`; geen `bar_day_slots`-lookup; `activities.insert` zonder `bar_day_slot_id`.
11. [ ] Verwijder `apps/web/app/api/cms/bardienst/day-slots/route.ts` en `[id]/route.ts`.
12. [ ] Verwijder `apps/web/app/api/cms/bardienst/rooster/[slotId]/route.ts`.
13. [ ] `apps/web/app/dashboard/bardienst/page.tsx`: drop `bar_day_slots`-load; tab-bar alleen "Rooster"; query op `activities` zonder `.not('bar_day_slot_id', ...)`-filter.
14. [ ] `apps/web/app/dashboard/bardienst/_components/RoosterClient.tsx`: `Activity.bar_day_slot_id` veld weg; `groupBySlot` → `groupByDate`; "Dag verwijderen"-knop weg.
15. [ ] `apps/web/app/dashboard/bardienst/genereren/page.tsx`: geen `bar_day_slots`-load; render `<GenereerWizard />` zonder props.
16. [ ] `apps/web/app/dashboard/bardienst/genereren/_components/GenereerWizard.tsx`: StapSelectie → StapDagen (form-rij CRUD); body update voor `/genereer` en `/publiceer`; preview-keys via `preview_id`.
17. [ ] Verwijder `apps/web/app/dashboard/bardienst/_components/DaySlotsTab.tsx` en `BarDaySlotForm.tsx`.
18. [ ] Verwijder `apps/web/app/dashboard/bardienst/day-slots/` (hele tree).
19. [ ] `pnpm typecheck`.
20. [ ] `pnpm test`.
21. [ ] `pnpm lint`.
22. [ ] Update `docs/REFACTOR_BACKLOG.md`: R-02 → status afgerond.
23. [ ] Werk `docs/scenarios/16-bardienst-rooster.md` bij (zie afzonderlijk bestand).

---

## Open vragen

_Geen._

---

## SRE Notes

**Datum:** 31-05-2026

### Logging

- Geen `console.log` / `console.error` in `genereer/route.ts`, `publiceer/route.ts`, `genereer/leden/route.ts`, `rooster/assignments/[id]/route.ts` of `lib/bardienst-algoritme.ts` — voldoet aan PII-beleid.
- Supabase audit log blijft de primaire data-access log; applicatie logt niet extra.
- Geen edge functions toegevoegd in deze refactor.

### Monitoring

- Bestaande indexes dekken alle nieuwe query-paden:
  - `activities_type_idx` — gebruikt door rooster-pagina (`type='bardienst'`) en fairness-query
  - `activities_starts_at_idx` — gebruikt door rooster-sortering en fairness-bounds (`starts_at BETWEEN season-start AND season-end`)
  - `activities_team_id_idx` — pre-existing, ongewijzigd
- Geen nieuwe RLS-policies; bestaande admin-policies op `activities` / `bar_assignments` blijven van kracht.
- Geen nieuwe React Query hooks (CMS gebruikt server components + directe `fetch()`).

### Foutafhandeling

- Alle gebruikersgerichte foutmeldingen Nederlands; geen ruwe Supabase-fouttekst zichtbaar.
- Netwerkfout-tekst consistent: `"Geen verbinding — controleer je internetverbinding en probeer opnieuw."` in `RoosterClient.handleSaveAssignment`, `GenereerWizard.handleGenereer`, `GenereerWizard.handlePubliceer`.
- Submit-knoppen uitgeschakeld tijdens in-flight mutaties (`generating`, `publishing`, `savingId`).
- Succes-feedback (redirect via `router.push`) gebeurt pas na server-bevestiging.
- Publicatie-rollback bij DB-fout aanwezig (cleanup van eerder ingevoegde `activities` + `bar_assignments`).

### Beveiliging

- Alle 4 actieve API-routes (`genereer`, `genereer/leden`, `publiceer`, `rooster/assignments/[id]`) hebben:
  - Role-guard via `getAdminUser()` (403 zonder `role='beheerder'`)
  - Zod-validatie vóór elke DB-write (`generateRosterSchema`, `publishRosterSchema`, `patchSchema`)
  - `createSupabaseAdminClient()` (server-side `SUPABASE_SECRET_KEY`, niet in mobile bundle)
- Trust-boundary verschoven: `publiceer`-route leest sport nu uit `preview.sport` (client) i.p.v. uit `bar_day_slots`. Geen privilege-escalation: Zod beperkt sport tot `'voetbal' | 'hockey' | null` en `activities.sport` heeft DB-check-constraint op dezelfde waarden. Effect blijft binnen admin-scope.
- `crypto.randomUUID` server-side gebruikt voor `preview_id` — niet exposed aan client-bundle.
- Geen file uploads, geen secrets gelekt naar `EXPO_PUBLIC_` of `NEXT_PUBLIC_`.
- FK constraint op `bar_assignments.member_id` garandeert dat alleen bestaande leden worden toegewezen.

### Bundle

- Geen nieuwe packages toegevoegd aan `apps/mobile/package.json`, `apps/web/package.json` of root `package.json`.
- `crypto.randomUUID` is een Node built-in (server-side only).

### Openstaande punten

- Geen.
