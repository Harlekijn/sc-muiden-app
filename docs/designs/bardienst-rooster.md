<!-- generated: 2026-05-15 -->

# Design: Bardienst Rooster Generator

Feature slug: `bardienst-rooster`

---

## Gebruiksscenario's (Use Cases)

| ID | Wie | Actie | Resultaat |
|---|---|---|---|
| UC-01 | Beheerder | Kan day-slots aanmaken en beheren | Configureerbare lijst van te bedienen dagen is beschikbaar voor generatie |
| UC-02 | Beheerder | Kan een bardienst-rooster genereren voor geselecteerde day-slots | Een eerlijk verdeeld rooster-preview wordt gegenereerd zonder data op te slaan |
| UC-03 | Beheerder | Kan de preview handmatig aanpassen | Individuele leden kunnen worden omgewisseld per dienst-slot vóór publicatie |
| UC-04 | Beheerder | Kan het rooster publiceren | Activiteiten en toewijzingen worden aangemaakt; betrokken leden ontvangen een push-notificatie |
| UC-05 | Beheerder | Kan het gepubliceerde rooster inzien | Bevestigingsstatus van alle diensten en leden is overzichtelijk per dag |
| UC-06 | Systeem | Verdeelt barcommissieleden en reguliere leden eerlijk op basis van sport-overlap en diensten-score | Leden met minste diensten dit seizoen krijgen voorrang; sport-specifieke slots sluiten niet-overeenkomende leden uit |

---

## Gebruikersstromen (User Flows)

### UC-01 — Day-slot aanmaken

**Happy path:**
1. Beheerder navigeert naar `/dashboard/bardienst/`.
2. Klikt op "Day slots"-tab.
3. Klikt op "Nieuw day-slot".
4. Vult formulier in: datum, begintijd, eindtijd, sport (optioneel), seizoen, notities.
5. Klikt "Opslaan".
6. Systeem valideert: eindtijd > begintijd, datum niet in verleden.
7. Record wordt aangemaakt, beheerder keert terug naar de day-slots lijst.

**Foutpad — ongeldige tijden:**
- Systeem toont: "De eindtijd moet na de begintijd liggen."
- Formulier blijft open, velden behouden hun waarde.

**Foutpad — datum in verleden:**
- Systeem toont: "De datum kan niet in het verleden liggen."

---

### UC-02 — Rooster genereren

**Happy path:**
1. Beheerder navigeert naar `/dashboard/bardienst/genereren`.
2. **Stap 1 — Selectie:** kiest seizoen (bijv. `2025-2026`), ziet gefilterde lijst van day-slots voor dat seizoen, selecteert een of meerdere slots met checkboxes, klikt "Genereer preview".
3. Systeem voert algoritme uit (zie Technisch design), geeft preview terug.
4. **Stap 2 — Preview:** beheerder ziet tabel per datum → dienst-tijdvenster → 3 toegewezen leden (1 barcommissielid, 2 regulier). Per lid: naam, lid_type badge, diensten-score.
5. **Stap 3 — Publiceren:** bevestigingsdialoog toont samenvatting (X dagen, Y diensten, Z leden). Beheerder klikt "Publiceer rooster".
6. Systeem slaat activiteiten en `bar_assignments` op, stuurt push-notificaties, redirect naar `/dashboard/bardienst/rooster`.

**Foutpad — onvoldoende barcommissieleden:**
- Systeem retourneert fout vóór preview: "Onvoldoende barcommissieleden beschikbaar voor [datum]. Er zijn minimaal [N] nodig voor [M] diensten."
- Wizard blijft op stap 1.

**Foutpad — onvoldoende reguliere leden:**
- Systeem retourneert fout: "Onvoldoende reguliere leden beschikbaar voor [datum]. Er zijn [X] leden beschikbaar, maar [Y] nodig."

---

### UC-03 — Preview handmatig aanpassen

**Happy path:**
1. In stap 2 van de wizard klikt beheerder "Omwisselen" naast een lid.
2. Een zoek-dropdown opent met alternatieve leden, gesorteerd op diensten-score (asc), gefilterd op dezelfde eligibiliteitsregels als het te vervangen slot (barcommissie of regulier) én sport.
3. Beheerder selecteert een ander lid.
4. Preview wordt in React-state bijgewerkt; diensten-scores in de dropdown reflecteren de gewijzigde toewijzing.
5. Beheerder kan doorgaan naar publiceren.

---

### UC-04 — Rooster publiceren

**Happy path:**
1. Beheerder bevestigt publicatie in stap 3.
2. Systeem maakt voor elke dienst een `activities`-record aan (type: `bardienst`, `bar_day_slot_id` ingevuld).
3. Systeem maakt voor elke toewijzing een `bar_assignments`-record aan.
4. Systeem voegt voor elk betrokken lid een rij toe aan de `notifications`-tabel (push-trigger Edge Function verzendt vervolgens de push).
5. Redirect naar `/dashboard/bardienst/rooster`.

**Foutpad — publicatie mislukt:**
- Alle DB-writes worden teruggedraaid (transactie).
- Beheerder ziet: "Publicatie mislukt. Probeer het opnieuw."
- Wizard blijft op stap 3.

---

### UC-05 — Gepubliceerd rooster inzien

**Happy path:**
1. Beheerder navigeert naar `/dashboard/bardienst/` → "Rooster"-tab of direct naar `/dashboard/bardienst/rooster`.
2. Rooster toont diensten gegroepeerd per dag.
3. Per dienst: tijdvenster, 3 leden met naam + bevestigingsstatus (badge: bevestigd / niet bevestigd).
4. Beheerder kan op een dienst klikken om naar het activiteitdetail te navigeren (bestaande CMS-flow).

---

## Acceptatiecriteria

### UC-01

- Gegeven een geldig formulier, als de beheerder opslaat, dan verschijnt het day-slot in de lijst en bestaat het record in de `bar_day_slots` tabel.
- Gegeven eindtijd ≤ begintijd, als de beheerder opslaat, dan verschijnt de foutmelding en wordt er niets opgeslagen.
- Gegeven een datum in het verleden, als de beheerder opslaat, dan verschijnt de foutmelding en wordt er niets opgeslagen.
- Gegeven een aangemaakt day-slot, als de beheerder het soft-verwijdert, dan verdwijnt het uit de lijst en heeft het record `deleted_at IS NOT NULL`.

### UC-02

- Gegeven geselecteerde day-slots en voldoende leden, als de beheerder genereert, dan bevat de preview per dienst precies 3 leden: 1 met `is_barcommissie = true` en 2 reguliere leden.
- Gegeven een voetbal-day-slot, dan bevat de preview geen leden met `sport` zonder `'voetbal'`.
- Gegeven een club-brede day-slot (sport = NULL), dan worden leden van beide sporten in aanmerking genomen.
- Gegeven onvoldoende barcommissieleden, als de beheerder genereert, dan verschijnt de foutmelding vóór de preview.

### UC-03

- Gegeven een preview, als de beheerder een lid omwisselt, dan toont de dropdown alleen leden die voldoen aan dezelfde eligibiliteitsregels en sport-overlap.
- Gegeven een omgewisseld lid, dan reflecteert de preview de wijziging zonder paginaherlaad.

### UC-04

- Gegeven een gepubliceerd rooster, dan bestaan er voor elke dienst `activities`-records met `type = 'bardienst'` en `bar_day_slot_id` ingevuld.
- Gegeven publicatie, dan ontvangt elk betrokken lid een push-notificatie (via `notifications` tabel).
- Gegeven een DB-fout tijdens publicatie, dan is er niets opgeslagen en kan de beheerder opnieuw proberen.

### UC-05

- Gegeven gepubliceerde diensten, dan toont het roosteroverzicht de bevestigingsstatus van elk lid.

### UC-06

- Gegeven twee generatieruns, dan hebben leden die in de eerste run meer diensten kregen een lagere prioriteit in de tweede run.
- Gegeven een lid dat al is ingepland in een eerdere dienst op dezelfde dag, dan wordt dat lid overgeslagen bij de volgende dienst op dezelfde dag.

---

## UI / Grafisch Design

### 1. Bardienst Overzicht

**Naam:** Bardienst  
**Route:** `/dashboard/bardienst/`  
**Lay-out:**
- CMS-standaard sidebar + content area
- Paginatitel: "Bardienst" (ds-h1, `--color-navy`)
- Twee tabs: "Day slots" | "Rooster" (Lucide `<CalendarDays />` icoon per tab)
- Actieknop rechts boven tab-inhoud: "Nieuw day-slot" (blauwe button, `--color-blue`) op de Day slots tab; "Genereer rooster" op de Rooster tab

**Tab: Day slots**
- Tabel met kolommen: Datum, Tijd, Sport, Seizoen, Notities, Acties
- Sport-badge: `--color-blue` achtergrond, wit label; "Club-breed" in `--color-mid`
- Datum: `zaterdag 26 april 2026` (Dutch long form)
- Tijdvenster: `08:00 – 18:00`
- Acties: `<Pencil />` (bewerken) + `<Trash2 />` (verwijderen, met bevestigingsdialoog)
- Lege staat: `<CalendarX />` icoon, "Nog geen day-slots aangemaakt", sub-tekst "Voeg een day-slot toe om een bardienst-rooster te kunnen genereren."
- Laadindicator: rij-skelet, `--color-mid` shimmer

**Tab: Rooster**
- Diensten gegroepeerd per datum (card per dag, `--color-white`, 10px radius, navy shadow)
- Per dienst: tijdvenster als koptekst (ds-label, `--color-text-2`), dan 3 ledenrijen
- Per lid: naam (ds-body), badge "Bevestigd" (`--color-success`) of "Niet bevestigd" (`--color-text-2`)
- Lege staat: `<ClipboardList />` icoon, "Nog geen rooster gepubliceerd", sub-tekst "Genereer een rooster via de knop hierboven."

---

### 2. Day-slot formulier

**Naam:** Day-slot aanmaken / bewerken  
**Route:** `/dashboard/bardienst/day-slots/nieuw` | `/dashboard/bardienst/day-slots/[id]/bewerken`  
**Lay-out:**
- Formuliercard (max-breedte 640px, `--color-white`, 10px radius, navy shadow)
- Velden (top → bottom):
  - Datum — `<input type="date">`, label "Datum"
  - Begintijd — `<input type="time">`, label "Begintijd"
  - Eindtijd — `<input type="time">`, label "Eindtijd"
  - Sport — `<select>`: opties "Club-breed", "Voetbal", "Hockey"; label "Sport"
  - Seizoen — `<input type="text">` placeholder `2025-2026`; label "Seizoen"
  - Notities — `<textarea>` optioneel; label "Notities"
- Footer: "Annuleren" (ghost button) + "Opslaan" (primary button, `--color-blue`, 8px radius)
- Foutmeldingen: rood (`--color-error`) onder het betreffende veld, nooit raw Supabase-errors

---

### 3. Rooster generatie-wizard

**Naam:** Rooster genereren  
**Route:** `/dashboard/bardienst/genereren`  
**Lay-out:** Stappenwiziard; stap-indicator bovenaan (3 stappen, actieve stap in `--color-blue`)

**Stap 1 — Selectie**
- Seizoen-dropdown: tekstveld of `<select>` (bijv. `2025-2026`)
- Day-slots checklist: datum, tijdvenster, sport-badge per rij, checkbox links
- "Selecteer alles" toggle
- Knop "Genereer preview" (`--color-blue`); disabled als geen slots geselecteerd; laadspinner tijdens API-call
- Foutmelding (onvoldoende leden) in `--color-error-bg` banner bovenaan

**Stap 2 — Preview**
- Per geselecteerde dag: card met datum-koptekst
  - Per dienst (2,5u tijdvenster): sub-koptekst tijdvenster
    - 3 ledenrijen:
      - Slot 1 (barcommissie): badge "Barcommissie" (`--color-yellow` achtergrond, `--color-navy` tekst)
      - Slot 2-3 (regulier): geen badge
      - Per rij: naam lid, `lid_type` label in `--color-text-2`, diensten-score "N diensten dit seizoen"
      - Knop `<RefreshCw />` "Omwisselen" rechts van naam → opent inline zoek-dropdown
    - Zoek-dropdown toont: naam, diensten-score; gesorteerd op score asc
- Navigatiebuttons: "Vorige" (ghost) | "Doorgaan naar publiceren" (`--color-blue`)

**Stap 3 — Publiceren**
- Samenvatting card:
  - X day-slots geselecteerd
  - Y diensten gegenereerd
  - Z unieke leden ingepland
- Waarschuwingstekst: "Na publicatie ontvangen betrokken leden een push-notificatie."
- Navigatiebuttons: "Vorige" (ghost) | "Publiceer rooster" (primary, `--color-blue`); laadspinner tijdens opslaan
- Succesbericht na publicatie: "Rooster gepubliceerd. [N] leden ontvangen een push-notificatie."

---

## Technisch Design

### Database wijzigingen

#### Nieuwe tabel: `bar_day_slots`

```sql
CREATE TABLE public.bar_day_slots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date        NOT NULL,
  starts_at  time        NOT NULL,
  ends_at    time        NOT NULL,
  sport      text        CHECK (sport IN ('voetbal', 'hockey')), -- NULL = club-breed
  season     text        NOT NULL,   -- bijv. '2025-2026'
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT bar_day_slots_times_check CHECK (ends_at > starts_at)
);
```

**RLS policies:**

```sql
ALTER TABLE public.bar_day_slots ENABLE ROW LEVEL SECURITY;

-- Alleen beheerders mogen lezen en schrijven
CREATE POLICY "bar_day_slots_admin_all"
  ON public.bar_day_slots
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

**Indexes:**
```sql
CREATE INDEX bar_day_slots_date_idx     ON public.bar_day_slots (date);
CREATE INDEX bar_day_slots_season_idx   ON public.bar_day_slots (season);
CREATE INDEX bar_day_slots_deleted_idx  ON public.bar_day_slots (deleted_at) WHERE deleted_at IS NULL;
```

---

#### Nieuwe kolom op `activities`

```sql
ALTER TABLE public.activities
  ADD COLUMN bar_day_slot_id uuid REFERENCES public.bar_day_slots(id) ON DELETE SET NULL;

CREATE INDEX activities_bar_day_slot_id_idx ON public.activities (bar_day_slot_id)
  WHERE bar_day_slot_id IS NOT NULL;
```

Hiermee is traceerbaar welke activiteiten auto-gegenereerd zijn vanuit een day-slot.

---

### Shared types (`packages/shared/src/`)

**`packages/shared/src/types/app.types.ts`** — toevoegen:

```typescript
export interface BarDaySlot {
  id: string;
  date: string;          // ISO date bijv. '2026-04-26'
  starts_at: string;     // bijv. '08:00:00'
  ends_at: string;       // bijv. '18:00:00'
  sport: Sport | null;   // null = club-breed
  season: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BarShift {
  starts_at: string;     // ISO datetime bijv. '2026-04-26T08:00:00'
  ends_at: string;
  barcommissie_member: BarShiftMember;
  regular_members: [BarShiftMember, BarShiftMember];
}

export interface BarShiftMember {
  member_id: string;
  first_name: string;
  last_name: string;
  lid_type: LidType | null;
  is_barcommissie: boolean;
  diensten_count: number;  // diensten dit seizoen (voor fairness weergave)
}

export interface BarRosterPreview {
  bar_day_slot_id: string;
  date: string;
  shifts: BarShift[];
}
```

**`packages/shared/src/schemas/cms.schema.ts`** — toevoegen:

```typescript
export const createBarDaySlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ongeldige datum' }),
  starts_at: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige begintijd' }),
  ends_at: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Ongeldige eindtijd' }),
  sport: z.enum(['voetbal', 'hockey']).nullable().optional(),
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => data.ends_at > data.starts_at,
  { message: 'De eindtijd moet na de begintijd liggen', path: ['ends_at'] }
);

export const generateRosterSchema = z.object({
  season: z.string().min(1, { message: 'Seizoen is verplicht' }),
  bar_day_slot_ids: z.array(z.string().uuid()).min(1, { message: 'Selecteer minimaal één day-slot' }),
});

export const publishRosterSchema = z.object({
  preview: z.array(z.object({
    bar_day_slot_id: z.string().uuid(),
    date: z.string(),
    shifts: z.array(z.object({
      starts_at: z.string(),
      ends_at: z.string(),
      barcommissie_member: z.object({ member_id: z.string().uuid() }),
      regular_members: z.tuple([
        z.object({ member_id: z.string().uuid() }),
        z.object({ member_id: z.string().uuid() }),
      ]),
    })),
  })),
  season: z.string(),
});
```

---

### Web CMS implementatie (`apps/web/`)

**Server vs client — beslissingen:**
- Overzichtspagina (`/dashboard/bardienst/`): async server component (leest day-slots + rooster server-side)
- Day-slot formulier: client component (gecontroleerde form-state, validatie)
- Generatie-wizard: volledig client component (multi-step state, preview in geheugen)
- Rooster read-only view: server component

**API routes (`apps/web/app/api/cms/bardienst/`):**

| Route | Methode | Beschrijving |
|---|---|---|
| `day-slots/route.ts` | GET | Lijst day-slots (filter op `season`, `deleted_at IS NULL`) |
| `day-slots/route.ts` | POST | Aanmaken day-slot (Zod: `createBarDaySlotSchema`) |
| `day-slots/[id]/route.ts` | PUT | Bijwerken day-slot |
| `day-slots/[id]/route.ts` | DELETE | Soft-delete (set `deleted_at`) |
| `genereer/route.ts` | POST | Genereer preview (Zod: `generateRosterSchema`) — zie algoritme |
| `genereer/leden/route.ts` | GET | Eligible leden voor een specifiek slot-type en sport (voor omwissel-dropdown) |
| `publiceer/route.ts` | POST | Publiceer rooster (Zod: `publishRosterSchema`) — transactioneel |

**Role guard:** alle API routes checken `is_admin()` via de Supabase service-role client. Return 403 bij onvoldoende rechten.

---

### Generatie-algoritme (`apps/web/app/api/cms/bardienst/genereer/route.ts`)

```
Input: { season, bar_day_slot_ids }

1. Laad alle bar_day_slots voor de gegeven IDs (deleted_at IS NULL).

2. Laad fairness scores:
   SELECT member_id, COUNT(*) as count
   FROM bar_assignments ba
   JOIN activities a ON a.id = ba.activity_id
   WHERE a.starts_at >= [seizoen_start]
     AND a.starts_at <= [seizoen_eind]
     AND a.type = 'bardienst'
     AND a.deleted_at IS NULL
   GROUP BY member_id
   → In-memory Map<member_id, count>; leden zonder rij tellen als 0.

3. Laad alle niet-verwijderde leden:
   SELECT id, first_name, last_name, sport, lid_type, is_vrijwilliger, is_barcommissie
   FROM members
   WHERE deleted_at IS NULL

4. Voor elke bar_day_slot:
   a. Splits tijdvenster in diensten van 2,5 uur (150 min).
      Resterende tijd < 2,5u → niet opnemen als aparte dienst.
   b. Filter leden op sport:
      - Sport-specifiek slot: member.sport INCLUDES slot.sport
      - Club-breed slot (sport IS NULL): alle leden
   c. Splits gefilterde leden in:
      - barcommissie: is_barcommissie = true, is_vrijwilliger = false
      - regulier: is_barcommissie = false, is_vrijwilliger = false,
                  lid_type IN ('spelend-lid', 'jeugdlid', 'relatie')
   d. Controleer: barcommissie.length >= shifts.length, anders → fout
      Controleer: regulier.length >= shifts.length * 2, anders → fout
   e. Houd bij: ingeplande members per dag (Set<member_id>)
   f. Voor elke dienst:
      i.  Sorteer barcommissie op fairness_score[member_id] asc, dan naam asc
          Filter: member niet al ingepland op deze dag (dag-Set check)
          Wijs eerste toe, voeg toe aan dag-Set, verhoog score in-memory
      ii. Sorteer regulier op fairness_score[member_id] asc, dan naam asc
          Filter: member niet al ingepland op deze dag
          Wijs eerste 2 toe, voeg toe aan dag-Set, verhoog scores in-memory

5. Return: BarRosterPreview[] — geen DB-writes.
```

**Seizoensperiode bepaling:** `season = '2025-2026'` → start = `2025-08-01`, eind = `2026-07-31`.

---

### Publicatie (`apps/web/app/api/cms/bardienst/publiceer/route.ts`)

Alle writes in één Supabase-transactie (via RPC of meerdere inserts met rollback bij fout):

```
Voor elke BarRosterPreview:
  Voor elke BarShift:
    1. INSERT INTO activities (title, type, sport, starts_at, ends_at, bar_day_slot_id)
       title: "Bardienst [datum]"
    2. INSERT INTO bar_assignments (activity_id, member_id) × 3
    3. INSERT INTO notifications (profile_id, title, body, type, activity_id)
       Voor elk member: zoek gekoppeld profile_id via user_family_members WHERE member_id = ?
       title: "Bardienst ingepland"
       body:  "Je bent ingepland voor bardienst op [datum Dutch long form] van [begintijd] tot [eindtijd]."
       type:  "bardienst"
```

Push-notificaties worden verzonden via de bestaande `push-trigger` Edge Function (luistert op `notifications`-inserts).

---

### Implementatievolgorde

1. DB migratie: `YYYYMMDDHHMMSS_bardienst_rooster.sql`
2. `supabase db reset && supabase gen types typescript --local > packages/shared/src/db.types.ts`
3. Shared types: `BarDaySlot`, `BarShift`, `BarShiftMember`, `BarRosterPreview` in `app.types.ts`
4. Shared schemas: `createBarDaySlotSchema`, `generateRosterSchema`, `publishRosterSchema` in `cms.schema.ts`
5. CMS API: day-slots CRUD (`app/api/cms/bardienst/day-slots/`)
6. CMS API: genereer algoritme (`app/api/cms/bardienst/genereer/`)
7. CMS API: eligible leden endpoint (`app/api/cms/bardienst/genereer/leden/`)
8. CMS API: publiceer (`app/api/cms/bardienst/publiceer/`)
9. CMS UI: overzichtspagina met tabs (`app/dashboard/bardienst/`)
10. CMS UI: day-slot formulier (`app/dashboard/bardienst/day-slots/nieuw/`, `[id]/bewerken/`)
11. CMS UI: generatie-wizard (`app/dashboard/bardienst/genereren/`)
12. CMS UI: rooster read-only view (onderdeel van overzichtspagina)
13. Tests: `apps/web/__tests__/bardienst/` (algoritme unit tests, API route tests)
14. Verificatie: `pnpm typecheck && pnpm test && pnpm lint`

---

### Mobile impact

Geen nieuwe schermen. Gegenereerde bardienst-activiteiten zijn gewone `bardienst`-type activiteiten en verschijnen automatisch via bestaande flows:
- Agenda-tab (bestaand)
- Activiteit-detailscherm met `BardienstSectie` (bestaand)
- Push-notificatie via `push-trigger` Edge Function (bestaand)

---

## GDPR Compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Ja — namen en lid-data van leden worden gekoppeld aan diensten | — |
| Wettelijke grondslag | Gerechtvaardigd belang — clubbeheer en organisatie bardiensten | Vastleggen in design doc |
| Data van kinderen (< 16 jaar)? | Ja — `lid_type = 'jeugdlid'` kan worden ingepland | RLS reeds aanwezig via `is_admin()`; admin-only tabellen |
| Bewaartermijn | Soft-delete; historische roosters bewaard per seizoen (gerechtvaardigd belang) | Beleid vastleggen: na 2 seizoenen archiveren |
| Toegang beperkt via RLS? | Ja — `bar_day_slots`: alleen beheerder; `activities`/`bar_assignments`: bestaand beleid | Policies schrijven voor `bar_day_slots` |
| PII in logs vermeden? | Ja — logs bevatten alleen activity_id's, counts, en uitkomststatus | — |
| Data binnen EU (Supabase EU-region)? | Ja | — |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — via soft-delete + verwijdering van `bar_assignments` rows | Bestaande DSAR-flow afdoende |

---

## Scenario's

### Nieuwe scenario-bestanden

Aanmaken: `docs/scenarios/16-bardienst-rooster.md` — zie het afzonderlijk opgeslagen bestand.

### Bestaande scenario's — geen updates nodig

`docs/scenarios/07-bardienst-bevestigen.md` blijft geldig: de gegenereerde bardienst-activiteiten zijn gewone `bardienst`-activiteiten en het bevestig-flow is ongewijzigd.

---

## Implementatieplan (checklist)

1. [ ] Schrijf migratie `YYYYMMDDHHMMSS_bardienst_rooster.sql`:
   - `CREATE TABLE public.bar_day_slots` met alle kolommen, constraint, RLS, indexes
   - `ALTER TABLE public.activities ADD COLUMN bar_day_slot_id`
   - `CREATE INDEX activities_bar_day_slot_id_idx`

2. [ ] `supabase db reset`

3. [ ] `supabase gen types typescript --local > packages/shared/src/db.types.ts`

4. [ ] Voeg toe aan `packages/shared/src/types/app.types.ts`:
   - `BarDaySlot`, `BarShift`, `BarShiftMember`, `BarRosterPreview`

5. [ ] Voeg toe aan `packages/shared/src/schemas/cms.schema.ts`:
   - `createBarDaySlotSchema`, `generateRosterSchema`, `publishRosterSchema`

6. [ ] Maak aan: `apps/web/app/api/cms/bardienst/day-slots/route.ts` (GET + POST)

7. [ ] Maak aan: `apps/web/app/api/cms/bardienst/day-slots/[id]/route.ts` (PUT + DELETE)

8. [ ] Maak aan: `apps/web/app/api/cms/bardienst/genereer/route.ts` (POST — algoritme)

9. [ ] Maak aan: `apps/web/app/api/cms/bardienst/genereer/leden/route.ts` (GET — eligible leden voor omwissel-dropdown)

10. [ ] Maak aan: `apps/web/app/api/cms/bardienst/publiceer/route.ts` (POST — transactioneel)

11. [ ] Maak aan: `apps/web/app/dashboard/bardienst/page.tsx` (server component, tabs)

12. [ ] Maak aan: `apps/web/app/dashboard/bardienst/_components/DaySlotsTab.tsx`

13. [ ] Maak aan: `apps/web/app/dashboard/bardienst/_components/RoosterTab.tsx`

14. [ ] Maak aan: `apps/web/app/dashboard/bardienst/day-slots/nieuw/page.tsx` + `BarDaySlotForm.tsx`

15. [ ] Maak aan: `apps/web/app/dashboard/bardienst/day-slots/[id]/bewerken/page.tsx`

16. [ ] Maak aan: `apps/web/app/dashboard/bardienst/genereren/page.tsx` (client component, 3-stap wizard)

17. [ ] Maak aan: `apps/web/app/dashboard/bardienst/genereren/_components/StapSelectie.tsx`

18. [ ] Maak aan: `apps/web/app/dashboard/bardienst/genereren/_components/StapPreview.tsx`

19. [ ] Maak aan: `apps/web/app/dashboard/bardienst/genereren/_components/StapPubliceren.tsx`

20. [ ] Voeg "Bardienst" toe aan CMS sidebar-navigatie

21. [ ] Schrijf tests: `apps/web/__tests__/bardienst/genereer.test.ts` (algoritme unit tests: eerlijke verdeling, sport-filter, dag-overlap-check, randgevallen)

22. [ ] `pnpm typecheck`

23. [ ] `pnpm test`

24. [ ] `pnpm lint`

---

## Open vragen

_Geen._

---

## SRE Notes

**Datum:** 15-05-2026

### Logging
- Geen console.log of console.error statements in nieuwe API routes — voldoet aan PII-beleid.
- Supabase audit log is het primaire data-access log; applicatie logt niet extra.

### Monitoring
- Indexen aanwezig: `bar_day_slots_date_idx`, `bar_day_slots_season_idx`, `bar_day_slots_deleted_idx` (partial), `activities_bar_day_slot_id_idx`.
- RLS policy `bar_day_slots_admin_all` scant niet de hele tabel: filtert via `is_admin()` functie die per JWT-claim evalueert.
- Geen nieuwe React Query hooks (feature gebruikt directe fetch); geen staleTime check vereist.
- Geen nieuwe Edge Functions geïntroduceerd.

### Foutafhandeling
- 4 `fetch()`-aanroepen hadden geen try/catch voor netwerkfouten — opgelost in:
  - `BarDaySlotForm.handleSubmit`: toont "Geen verbinding — controleer je internetverbinding en probeer opnieuw."
  - `DaySlotsTab.handleDelete`: zelfde melding bij netwerkfout.
  - `GenereerWizard.handleGenereer`: zelfde melding bij netwerkfout.
  - `GenereerWizard.handlePubliceer`: zelfde melding bij netwerkfout.
- Alle foutmeldingen in het Nederlands; geen ruwe Supabase-fouttekst zichtbaar voor gebruiker.
- Submit-knoppen uitgeschakeld during in-flight mutaties (BarDaySlotForm, DaySlotsTab, GenereerWizard).
- Succes-feedback alleen na server-bevestiging.

### Beveiliging
- RLS policy op `bar_day_slots` vereist authenticatie via `public.is_admin()` — geen `USING (true)`.
- `bar_day_slots` bevat geen `member_id`/`profile_id` kolom — geen risico op ownership-injection.
- Alle API routes valideren input met Zod vóór elke DB-schrijfoperatie.
- `SUPABASE_SECRET_KEY` uitsluitend in server-side Next.js API routes; niet in mobile bundle.
- `publiceer` route leest sport uit de DB (niet uit de request body) — geen client-side injection mogelijk.
- FK constraint op `bar_assignments.member_id` garandeert dat alleen bestaande leden worden toegewezen.

### Bundle
- Geen nieuwe packages toegevoegd aan `apps/mobile/` of root `package.json`.

### Openstaande punten
- Geen.
