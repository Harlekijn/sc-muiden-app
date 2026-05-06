# Design: activiteiten-kalender

<!-- generated: 2026-05-06 -->

**Feature:** Activiteiten & Kalender (Phase 2)
**Slug:** `activiteiten-kalender`
**Branch:** `feature/activiteiten-kalender`

---

## 1. Gebruik scases (Use Cases)

| ID | Rol | Actie | Resultaat/waarde |
|---|---|---|---|
| UC-01 | Lid/ouder | kan de Agenda-tab openen en een maandoverzicht zien van activiteiten van het gezin | zij zien in één oogopslag wanneer er activiteiten zijn |
| UC-02 | Lid/ouder | kan een dag selecteren en de activiteiten van die dag bekijken | zij kunnen de dagplanning beoordelen |
| UC-03 | Lid/ouder | kan een activiteit aantikken en de detailpagina bekijken | zij zijn volledig geïnformeerd over locatie, tijd en deelnemers |
| UC-04 | Lid/ouder | kan een bardienst bevestigen voor het toegewezen gezinslid | de club weet dat de bardienst is doorgegeven |
| UC-05 | Lid/ouder | kan de agenda filteren op gezinslid of "Heel gezin" | zij zien alleen de activiteiten van het relevante gezinslid |
| UC-06 | Lid/ouder | opent de agenda zonder internetverbinding | gecachte data wordt getoond met "Geen verbinding"-banner |
| UC-07 | Lid/ouder | heeft geen gezinsleden gekoppeld aan een team | alleen clubbrede activiteiten (zonder team_id) zijn zichtbaar, of lege staat |
| UC-08 | Lid/ouder | selecteert een dag zonder activiteiten | ziet een duidelijke lege staat in het Nederlands |

---

## 2. Gebruikersstromen (User Flows)

### UC-01 — Maandoverzicht bekijken (happy path)
1. Gebruiker tikt op "Agenda" in de bottom tab bar.
2. Scherm opent op de huidige maand; "Heel gezin"-filter actief.
3. Activiteitsdots verschijnen onder de dagcijfers voor alle dagen met ≥1 activiteit.
4. De huidige dag is gemarkeerd met een blauwe cirkel.
5. Gebruiker swipet links/rechts of tikt de pijlen om van maand te wisselen.

### UC-02 — Dagdetail bekijken (happy path)
1. Gebruiker tikt op een dag met activiteiten.
2. De geselecteerde dag krijgt een marine ring.
3. De daglijst onder de kalender scrolt naar de activiteiten van die dag, gesorteerd op starts_at.

### UC-03 — Activiteitdetail bekijken (happy path)
1. Gebruiker tikt op een activiteitcard in de daglijst.
2. Het detailscherm opent via Expo Router push.
3. Scherm toont: type badge, sport badge (indien van toepassing), teamnaam, datum, tijdstip (24h), locatie (tappable map-link), notities.
4. Terug-knop keert terug naar de agenda.

**Foutpad UC-03-E1 — Activiteit niet gevonden:**
1. Gebruiker tikt op activiteit waarvan de data al verwijderd is.
2. Detailscherm toont: "Deze activiteit is niet meer beschikbaar."

### UC-04 — Bardienst bevestigen (happy path)
1. Gebruiker tikt op een bardienst-activiteit.
2. Detailscherm toont de "Bardienst"-sectie met naam van het gezinslid en een "Bevestigen"-knop.
3. Gebruiker tikt "Bevestigen".
4. Knop verandert naar "Bevestigd" met vinkje; confirmed_at wordt opgeslagen in bar_assignments.

**Foutpad UC-04-E1 — Netwerkfout bij bevestigen:**
1. Gebruiker tikt "Bevestigen", maar er is geen verbinding.
2. Knop blijft actief; Dutch foutmelding: "Kon niet bevestigen. Controleer je verbinding."

**Foutpad UC-04-E2 — Bardienst al bevestigd:**
1. Gebruiker opent bardienst die al bevestigd is.
2. "Bevestigen"-knop is vervangen door "Bevestigd" (groen, uitgeschakeld).

### UC-05 — Gezinsfilter (happy path)
1. Gebruiker tikt op een gezinslid-chip in de filterrij.
2. De kalender en daglijst herberekenen: alleen activiteiten van dat gezinslid.
3. Activiteitsdots in de kalender worden bijgewerkt.
4. Gebruiker tikt "Heel gezin" om terug te keren naar het gecombineerde overzicht.

### UC-06 — Geen internetverbinding
1. App detecteert geen netwerk (via NetInfo).
2. Gecachte React Query data wordt getoond (staleTime: 5 min, gcTime: 24h).
3. Bovenaan het scherm: "Geen verbinding" banner (--color-warning achtergrond).
4. Zodra verbinding terugkomt, verdwijnt de banner en worden data opnieuw geladen.

### UC-07 — Geen teamkoppeling
1. Gebruiker heeft geen gezinsleden die via team_members aan een team gekoppeld zijn.
2. Agenda toont alleen activiteiten zonder team_id (clubbrede activiteiten).
3. Indien ook geen clubbrede activiteiten: lege staat "Geen activiteiten gevonden."

### UC-08 — Lege dag
1. Gebruiker tikt op een dag zonder dots.
2. Daglijst toont: "Geen activiteiten op deze dag."

---

## 3. Acceptatiecriteria

| UC | Criterium |
|---|---|
| UC-01 | Gegeven dat de Agenda-tab opent en data geladen is, als het maandoverzicht zichtbaar is, dan zijn er dots zichtbaar op alle dagen met ≥1 activiteit voor het actieve filter. |
| UC-02 | Gegeven dat de gebruiker op een dag met activiteiten tikt, als de selectie verandert, dan toont de daglijst alle activiteiten van die dag gesorteerd op starts_at ASC. |
| UC-03 | Gegeven dat de gebruiker op een activiteitcard tikt, als het detailscherm opent, dan zijn type, sport (indien aanwezig), team, datum (Nederlands formaat), tijdstip (24h), locatie en notities zichtbaar. |
| UC-04 | Gegeven een niet-bevestigde bardienst-toewijzing voor een gezinslid van de gebruiker, als de gebruiker "Bevestigen" tikt, dan wordt confirmed_at opgeslagen en toont de knop "Bevestigd". |
| UC-04-E1 | Gegeven een netwerkfout bij bevestigen, als de mutatie mislukt, dan verschijnt een Nederlandse foutmelding en blijft de knop actief. |
| UC-05 | Gegeven dat de gebruiker een gezinslid-chip selecteert, als het filter actief is, dan tonen kalender én daglijst alleen activiteiten relevant voor dat gezinslid. |
| UC-06 | Gegeven geen internetverbinding, als de agenda opent, dan toont de app gecachte data en een Nederlandse "Geen verbinding"-banner. |
| UC-07 | Gegeven geen teamkoppelingen, als de agenda opent, dan toont de kalender alleen clubbrede activiteiten (team_id IS NULL) of een lege staat. |
| UC-08 | Gegeven dat de gebruiker een dag zonder activiteiten selecteert, dan toont de daglijst "Geen activiteiten op deze dag." |

---

## 4. UI-ontwerp per scherm/component

### Kleurmapping per activiteitstype

| Type | Kleur |
|---|---|
| training | `--color-blue` (`#046bba`) |
| wedstrijd | `--color-navy` (`#011d50`) |
| bardienst | `--color-yellow` (`#f5c518`) |
| clubactiviteit | `--color-success` (`#1a8c5c`) |

---

### Screen 1 — Agenda (Agenda-tab)

**Route:** `/(tabs)/agenda`

**Lay-out (top → bottom):**
1. Statusbar + SafeArea
2. Header: bg `--color-navy`, padding 16px horizontaal, 12px verticaal
   - Titel "Agenda" — ds-h3, `--color-white`
3. Filterrij: horizontaal scrollende pillen, padding 12px horizontaal, 8px verticaal, bg `--color-navy`
4. Maandkalender: bg `--color-white`, radius `--radius-lg` (boven afgerond), shadow `--shadow-card`
5. Dagdetaillijst: scrollende sectie, bg `--color-light`, flex: 1, padding 16px horizontaal
6. Pull-to-refresh op de volledige scroll container

**Componenten:**

**FamilyFilterChip**
- Pill, `--radius-pill`, padding 6px 12px
- Actief: bg `--color-navy`, border 0, tekst `--color-white` ds-label uppercase
- Inactief: bg `--color-white`, border 1px `--color-mid`, tekst `--color-text-2` ds-label
- Overgangsanimatie: `--transition-fast` (150ms)

**MonthCalendar**
- Container: bg `--color-white`, padding 16px, radius 10px (boven), shadow `--shadow-card`
- Header: flex-row space-between
  - Maandnaam + jaar: ds-h4, `--color-navy` (bijv. "mei 2026")
  - `<ChevronLeft />` + `<ChevronRight />` 24px, `--color-blue`
- Weekdagen-header: ma di wo do vr za zo — ds-label uppercase, `--color-text-2`, gap 0, gelijke breedte
- Dagengrid: 7 kolommen, gelijke breedte
  - Lege dag: dagnummer ds-body `--color-text`
  - Dag buiten huidige maand: ds-caption `--color-text-2` opacity 0.4
  - Vandaag: bg `--color-blue`, radius `--radius-full`, dagnummer ds-body `--color-white`
  - Geselecteerde dag: border 2px `--color-navy`, radius `--radius-full`, dagnummer ds-body `--color-navy`
  - Combinatie vandaag+geselecteerd: bg `--color-blue` met extra ring `--color-navy` 1.5px offset
  - Activiteitdots: rij van max 3 dots (6px diameter), gecentreerd onder dagnummer, gap 2px, kleur per type (zie mapping). Meer dan 3 types: toon de 3 meest voorkomende.
- Skeleton: `--color-mid` shimmer op dag-cellen tijdens laden

**ActivityCard** (in dagdetaillijst)
- Container: bg `--color-white`, radius `--radius-lg`, shadow `--shadow-card`, overflow hidden
- Linker kleurstrip: breedte 4px, hoogte 100%, kleur per activiteitstype
- Inhoud: padding 12px 16px
  - Titel: ds-h4, `--color-text`, 1 regel (numberOfLines=1)
  - Tijdregel: `<Clock />` 16px `--color-text-2` + tijdstip ds-caption `--color-text-2`
  - Badgerij: type badge + sport badge (indien aanwezig), gap 6px
    - Type badge: pill, bg per type (20% opacity), tekst in typekleur, ds-label
    - Sport badge: pill, bg `--color-blue`, tekst `--color-white`, ds-label
  - Rechts: `<ChevronRight />` 20px `--color-text-2`
- Lege staat: "Geen activiteiten op deze dag." ds-body `--color-text-2`, margin-top 24px, gecentreerd
- Skeleton: 3 cards van `--color-mid` shimmer

---

### Screen 2 — Activiteitdetail

**Route:** `/activiteit/[id]`

**Lay-out (top → bottom):**
1. Terug-knop: `<ChevronLeft />` 24px `--color-white`, padding 16px, tikt terug naar agenda
2. ActivityHero (bg `--color-navy`)
3. InfoSectie (bg `--color-white`, radius 10px boven, shadow `--shadow-card`)
4. BardienstSectie (alleen bij type `bardienst` én eigen toewijzing)
5. NotitiesCard (alleen indien notes aanwezig)

**ActivityHero**
- Bg `--color-navy`, padding 20px 16px 24px
- Bovenregel: badgerij — type badge + sport badge
  - Type badge: pill, bg `--color-white`, tekst `--color-navy`, ds-label
  - Sport badge: pill, bg `--color-yellow`, tekst `--color-navy`, ds-label
- Teamnaam: ds-h2 Barlow Condensed `--color-white` (of "SC Muiden" indien geen team)
- Datum: ds-body `--color-white` opacity 0.85 — formaat "zaterdag 26 april 2026"
- Tijdstip: ds-body `--color-white` opacity 0.85 — formaat "14:30"

**InfoRow**
- Elke rij: flex-row, padding 12px 16px, align-items center, gap 12px
- `<Icon />` 20px `--color-blue`
- Label: ds-body `--color-text`
- Divider: 1px `--color-mid` tussen rijen
- Locatie-rij: tappable (Linking.openURL met maps-link), label `--color-blue` underline
- Icons: `<MapPin />` locatie, `<Clock />` tijd, `<Users />` team, `<Info />` notes

**BardienstSectie** (Card)
- Bg `--color-white`, radius `--radius-lg`, shadow `--shadow-card`, margin 16px, padding 16px
- Titel "Bardienst" — ds-h4 `--color-text`
- Per toewijzing (eigen gezinsleden): flex-row, naam ds-body links, knop rechts
  - Niet bevestigd: knop "Bevestigen", bg `--color-success`, tekst `--color-white`, radius `--radius-md`
  - Bevestigd: "Bevestigd" met `<CheckCircle />` 16px, bg `--color-mid`, tekst `--color-success`, disabled
- Foutmelding: "Kon niet bevestigen. Controleer je verbinding." ds-caption `--color-error`

**NotitiesCard**
- Bg `--color-light`, radius `--radius-lg`, margin 0 16px 16px, padding 12px 16px
- Tekst: ds-body `--color-text`

**Foutmelding (activiteit niet gevonden)**
- Volledige schermvulling, gecentreerd
- "Deze activiteit is niet meer beschikbaar." ds-body `--color-text-2`
- Terug-knop ds-body `--color-blue`

**Laadindicator:** skeleton voor hero-blok + 3 info-rijen in `--color-mid` shimmer

---

### Screen 3 — Wedstrijddetail

**Route:** `/wedstrijd/[id]` (bestaand placeholder)

Extend van activiteitdetail met:

**WedstrijdHero** (vervangt ActivityHero bij type `wedstrijd`)
- Bg `--color-navy`, padding 20px 16px 24px
- Status badge: "GEPLAND" / "LIVE" / "GESPEELD" / "AFGELAST" — ds-label uppercase, pill
  - LIVE: bg `--color-error`, tekst `--color-white`
  - GEPLAND: bg `--color-navy-40`, tekst `--color-white`
  - GESPEELD: bg `--color-success`, tekst `--color-white`
  - AFGELAST: bg `--color-text-2`, tekst `--color-white`
- Thuisteam vs uitteam: ds-h3 `--color-white`, " – " als separator
- Score (indien gespeeld): ds-score 64px Barlow Condensed `--color-yellow`, formaat "3 – 1"
- Datum + tijdstip: ds-body `--color-white` opacity 0.85

---

## 5. Technisch ontwerp

### Database wijzigingen

#### Nieuwe tabel: `recurring_rules`

Voor terugkerende trainingen (wekelijks patroon) is een configuratietabel nodig. De feitelijke `activities`-rijen worden gegenereerd door de CMS (Phase 5).

```sql
-- Migration: 20260506000010_recurring_rules.sql
create table public.recurring_rules (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 1 and 7), -- 1=maandag, 7=zondag
  start_time   time not null,
  end_time     time,
  location     text,
  notes        text,
  valid_from   date not null,
  valid_until  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index recurring_rules_team_id_idx on public.recurring_rules(team_id);

create trigger recurring_rules_updated_at
  before update on public.recurring_rules
  for each row execute procedure public.handle_updated_at();

-- FK op activities voor groepering van recurring instances
alter table public.activities
  add column recurring_rule_id uuid references public.recurring_rules(id) on delete set null;

create index activities_recurring_rule_id_idx on public.activities(recurring_rule_id);

-- Extra index voor type-filter queries
create index activities_type_idx on public.activities(type);

alter table public.recurring_rules enable row level security;

create policy "authenticated_select_recurring_rules"
  on public.recurring_rules for select
  using (auth.role() = 'authenticated' and deleted_at is null);

create policy "staff_manage_recurring_rules"
  on public.recurring_rules for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid', 'trainer', 'coach', 'teammanager')
    )
  );
```

**RLS bestaande tabellen — controle:** De `users_select_own_activities` policy op `activities` werkt via `team_members → family_members → account_id = auth.uid()`. Dit is correct en dekt alle teamgebonden activiteiten. Clubbrede activiteiten (team_id IS NULL) zijn zichtbaar via de `or team_id is null`-tak.

**Indexen toegevoegd:**
- `activities(type)` — voor type-filter
- `activities(recurring_rule_id)` — voor groepering
- `recurring_rules(team_id)` — FK index

### Gedeelde types (`packages/shared/src/`)

**Toevoegingen aan `app.types.ts`:**

```typescript
export interface RecurringRule {
  id: string;
  team_id: string;
  day_of_week: number; // 1=maandag, 7=zondag
  start_time: string;  // "HH:MM:SS"
  end_time: string | null;
  location: string | null;
  notes: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Verrijkt type voor weergave in de app
export interface ActivityWithDetails extends Activity {
  recurring_rule_id: string | null;
  team: Pick<Team, 'id' | 'name' | 'sport'> | null;
  match: Pick<Match, 'id' | 'home_team' | 'away_team' | 'score_home' | 'score_away' | 'status'> | null;
  bar_assignments: Array<BarAssignment & {
    family_member: Pick<FamilyMember, 'id' | 'first_name' | 'last_name'>;
  }>;
}

export interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  sport: Sport[];
  deleted_at: string | null;
}
```

**Toevoegingen aan `activity.schema.ts`:**

```typescript
export const confirmBarAssignmentSchema = z.object({
  id: z.string().uuid('Ongeldige toewijzing-ID'),
});
export type ConfirmBarAssignmentInput = z.infer<typeof confirmBarAssignmentSchema>;
```

**Nieuw: `utils/activity.ts`:**

```typescript
export function formatActivityType(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    training: 'Training',
    wedstrijd: 'Wedstrijd',
    bardienst: 'Bardienst',
    clubactiviteit: 'Clubactiviteit',
  };
  return labels[type];
}

export function getActivityTypeColor(type: ActivityType): string {
  // Geeft design-token kleurwaarde terug
  const colors: Record<ActivityType, string> = {
    training: '#046bba',     // --color-blue
    wedstrijd: '#011d50',    // --color-navy
    bardienst: '#f5c518',    // --color-yellow
    clubactiviteit: '#1a8c5c', // --color-success
  };
  return colors[type];
}
```

### Mobiele implementatie (`apps/mobile/`)

**Zustand store — `stores/agendaStore.ts`:**

```typescript
interface AgendaStore {
  selectedDate: Date;
  familyFilter: string | 'all'; // 'all' | family_member_id
  setSelectedDate: (date: Date) => void;
  setFamilyFilter: (filter: string | 'all') => void;
}
```

**React Query hooks:**

| Hook | Bestand | Query key | Return type |
|---|---|---|---|
| `useAgendaActivities` | `hooks/useAgendaActivities.ts` | `['agenda', profileId, familyFilter, year, month]` | `ActivityWithDetails[]` |
| `useActivityDetail` | `hooks/useActivityDetail.ts` | `['activity', id]` | `ActivityWithDetails \| null` |
| `useConfirmBarAssignment` | `hooks/useConfirmBarAssignment.ts` | mutation | `void` |

`useAgendaActivities`: haalt activiteiten op voor de hele maand (`starts_at >= maandstart AND starts_at < maandstart + 1 maand`). Filtert op `deleted_at IS NULL`. Bij familyFilter ≠ 'all': inner join op `team_members` voor dat gezinslid, plus altijd clubbrede activiteiten (team_id IS NULL).

**staleTime:** 5 minuten (agenda-data verandert zelden). **gcTime:** 24 uur (offline cache).

**Expo Router routes:**
- `app/(tabs)/agenda.tsx` — vervangt placeholder, bevat `MonthCalendar` + `DagActiviteitenLijst`
- `app/activiteit/[id].tsx` — vervangt placeholder, bevat `ActivityHero` + `InfoRow` + `BardienstSectie`

**Componenten:**

| Component | Bestand |
|---|---|
| `MonthCalendar` | `components/agenda/MonthCalendar.tsx` |
| `ActivityCard` | `components/agenda/ActivityCard.tsx` |
| `FamilyFilterChip` | `components/agenda/FamilyFilterChip.tsx` |
| `ActivityHero` | `components/activity/ActivityHero.tsx` |
| `WedstrijdHero` | `components/activity/WedstrijdHero.tsx` |
| `InfoRow` | `components/activity/InfoRow.tsx` |
| `BardienstSectie` | `components/activity/BardienstSectie.tsx` |
| `NotitiesCard` | `components/activity/NotitiesCard.tsx` |

### Web CMS implementatie (`apps/web/`)

Geen functionele CMS-pagina's in Phase 2. De bestaande placeholderpagina's (`Activiteitenbeheer volgt in fase 5`) blijven ongewijzigd. Activiteitenbeheer in de CMS wordt geïmplementeerd in Phase 5.

### Edge functions (`supabase/functions/`)

Geen nieuwe edge functions in Phase 2. De generatie van `activities`-rijen vanuit `recurring_rules` wordt een CMS-actie in Phase 5.

### Implementatievolgorde

1. Migratie: `supabase/migrations/20260506000010_recurring_rules.sql`
2. `supabase db reset && supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
3. `packages/shared/src/types/app.types.ts` — voeg `RecurringRule`, `ActivityWithDetails`, `FamilyMember` toe
4. `packages/shared/src/schemas/activity.schema.ts` — voeg `confirmBarAssignmentSchema` toe
5. `packages/shared/src/utils/activity.ts` — nieuw: `formatActivityType`, `getActivityTypeColor`
6. `packages/shared/src/__tests__/activity.schema.test.ts` — unit tests
7. `packages/shared/src/__tests__/activity.utils.test.ts` — unit tests voor utils
8. `apps/mobile/stores/agendaStore.ts` — nieuw Zustand store
9. `apps/mobile/hooks/useAgendaActivities.ts` — React Query hook
10. `apps/mobile/hooks/useActivityDetail.ts` — React Query hook
11. `apps/mobile/hooks/useConfirmBarAssignment.ts` — React Query mutation
12. `apps/mobile/components/agenda/MonthCalendar.tsx`
13. `apps/mobile/components/agenda/ActivityCard.tsx`
14. `apps/mobile/components/agenda/FamilyFilterChip.tsx`
15. `apps/mobile/components/activity/ActivityHero.tsx`
16. `apps/mobile/components/activity/WedstrijdHero.tsx`
17. `apps/mobile/components/activity/InfoRow.tsx`
18. `apps/mobile/components/activity/BardienstSectie.tsx`
19. `apps/mobile/components/activity/NotitiesCard.tsx`
20. `apps/mobile/app/(tabs)/agenda.tsx` — implementatie (vervangt placeholder)
21. `apps/mobile/app/activiteit/[id].tsx` — implementatie (vervangt placeholder)
22. Seed uitbreiden: trainingen, wedstrijd, bardienst, clubactiviteit toevoegen
23. Verificatie: `pnpm typecheck && pnpm test && pnpm lint`

---

## 6. GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Minimaal — teamnamen en tijdschema's, geen directe PII | — |
| Wettelijke grondslag | Gerechtvaardigd belang (clubactiviteiten aan leden tonen) | Vastleggen in privacybeleid |
| Data van kinderen (< 16 jaar)? | Indirect — teamkoppelingen kunnen minderjarigen betreffen, maar geen PII getoond | Geen extra RLS vereist |
| Bewaartermijn | Soft-delete via `deleted_at`; historische activiteiten bewaard voor administratie | Beleid: 3 jaar na seizoen |
| Toegang beperkt via RLS? | Ja — `users_select_own_activities` policy aanwezig | Policies valideren in E2E test |
| PII in logs vermeden? | Ja — logs bevatten geen gebruikersdata | — |
| Data binnen EU (Supabase EU-region)? | Ja — conform bestaand project | Controleer regio bij opzetten productie |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete + CMS-export door beheerder | Gedekt door bestaand soft-delete ontwerp |

---

## 7. Scenario-wijzigingen

### Te maken: `docs/scenarios/05-activiteiten-kalender.md`

Dekt UC-01, UC-02, UC-05, UC-06, UC-07, UC-08.

### Te maken: `docs/scenarios/06-activiteitdetail.md`

Dekt UC-03.

### Te maken: `docs/scenarios/07-bardienst-bevestigen.md`

Dekt UC-04.

### Te wijzigen: `docs/scenarios/00-seed-data.md`

Uitbreiden met activiteitenfixtures: 1 training, 1 wedstrijd, 1 bardienst (met bar_assignment voor Test Kindlid), 1 clubactiviteit.

---

## 8. Implementatieplan (checklist)

- [ ] 1. Maak `supabase/migrations/20260506000010_recurring_rules.sql` aan met `recurring_rules` tabel, `recurring_rule_id` kolom op `activities`, indexes en RLS
- [ ] 2. Voer `supabase db reset` uit en genereer types: `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
- [ ] 3. Voeg `RecurringRule`, `ActivityWithDetails`, `FamilyMember` toe aan `packages/shared/src/types/app.types.ts`
- [ ] 4. Voeg `confirmBarAssignmentSchema` toe aan `packages/shared/src/schemas/activity.schema.ts`
- [ ] 5. Maak `packages/shared/src/utils/activity.ts` aan met `formatActivityType` en `getActivityTypeColor`
- [ ] 6. Maak `packages/shared/src/__tests__/activity.schema.test.ts` aan (confirmBarAssignmentSchema tests)
- [ ] 7. Maak `packages/shared/src/__tests__/activity.utils.test.ts` aan (formatActivityType + getActivityTypeColor tests)
- [ ] 8. Maak `apps/mobile/stores/agendaStore.ts` aan (Zustand: selectedDate, familyFilter)
- [ ] 9. Maak `apps/mobile/hooks/useAgendaActivities.ts` aan (React Query, staleTime 5min)
- [ ] 10. Maak `apps/mobile/hooks/useActivityDetail.ts` aan (React Query)
- [ ] 11. Maak `apps/mobile/hooks/useConfirmBarAssignment.ts` aan (React Query mutation)
- [ ] 12. Maak `apps/mobile/components/agenda/MonthCalendar.tsx` aan
- [ ] 13. Maak `apps/mobile/components/agenda/ActivityCard.tsx` aan
- [ ] 14. Maak `apps/mobile/components/agenda/FamilyFilterChip.tsx` aan
- [ ] 15. Maak `apps/mobile/components/activity/ActivityHero.tsx` aan
- [ ] 16. Maak `apps/mobile/components/activity/WedstrijdHero.tsx` aan
- [ ] 17. Maak `apps/mobile/components/activity/InfoRow.tsx` aan
- [ ] 18. Maak `apps/mobile/components/activity/BardienstSectie.tsx` aan
- [ ] 19. Maak `apps/mobile/components/activity/NotitiesCard.tsx` aan
- [ ] 20. Implementeer `apps/mobile/app/(tabs)/agenda.tsx` (vervangt placeholder)
- [ ] 21. Implementeer `apps/mobile/app/activiteit/[id].tsx` (vervangt placeholder)
- [ ] 22. Breid seed uit: voeg 1 training, 1 wedstrijd, 1 bardienst, 1 clubactiviteit toe in `supabase/seed.ts`
- [ ] 23. Voer `pnpm typecheck` uit — verwacht: 0 errors
- [ ] 24. Voer `pnpm test` uit — verwacht: alle tests geslaagd
- [ ] 25. Voer `pnpm lint` uit — verwacht: 0 warnings/errors

---

## 9. Open vragen

- **Terugkerende trainingen in Phase 2:** De `recurring_rules` tabel wordt aangemaakt, maar de CMS-UI voor het aanmaken van terugkerende trainingen valt in Phase 5. Trainingen in Phase 2 worden handmatig als losse `activities` ingevoerd via de seed/Supabase Studio.
- **Wedstrijddetail-scherm:** Het `/wedstrijd/[id]`-scherm gebruikt dezelfde route als in de bestaande placeholder. Beslissing: activiteiten van type `wedstrijd` navigeren naar `/activiteit/[id]` (met wedstrijdspecifieke hero), niet naar een apart `/wedstrijd/[id]`-scherm. Dit vereenvoudigt de routing.
- **`family_members` vs `members`:** De `team_members`-tabel gebruikt `family_member_id` (verwijzend naar de `family_members`-tabel), maar `app.types.ts` heeft `TeamMember.member_id`. Dit is een inconsistentie die gerepareerd moet worden bij stap 3.

---

## SRE Notes

**Datum:** 06-05-2026

### Logging
- Geen edge functions geïntroduceerd in Phase 2 — geen logging-aanpassingen nodig.
- Geen console.log/console.error gevonden in implementatiebestanden — geslaagd.

### Monitoring
- Index `recurring_rules_team_id_idx` op FK-kolom `team_id` aanwezig ✅
- Index `activities_recurring_rule_id_idx` en `activities_type_idx` toegevoegd in migratie ✅
- Partial index `recurring_rules_active_idx` toegevoegd via `20260506120000_add_activiteiten_kalender_indexes.sql` voor RLS-filter op `deleted_at IS NULL`.
- `useAgendaActivities`: staleTime 5 min, gcTime 24h ✅
- `useActivityDetail`: staleTime 5 min ✅
- Opmerking: `bar_assignments(member_id)` mist een index — pre-existing gap uit migration 4/8, niet geïntroduceerd in Phase 2. Aanbeveling: separaat patchen vóór productie.

### Foutafhandeling
- `activiteit/[id].tsx`: Dutch `isError`-staat ✅, CTA "Ga terug" ✅
- `BardienstSectie`: "Kon niet bevestigen. Controleer je verbinding." ✅, knop uitgeschakeld tijdens in-flight ✅
- `agenda.tsx`: `isError`-staat toegevoegd met bericht "Geen verbinding — controleer je internetverbinding en probeer opnieuw." (was ontbrekend).
- Offline NetInfo-banner (UC-06 acceptatiecriterium) nog niet geïmplementeerd — openstaand punt.

### Beveiliging
- `recurring_rules` RLS: `authenticated_select_recurring_rules` vereist `auth.role() = 'authenticated'` ✅, geen PII in tabel ✅
- `staff_manage_recurring_rules` filtert via `auth.uid()` ✅
- Geen `USING (true)` op tabellen met persoonsgegevens ✅
- `useConfirmBarAssignment.ts`: Zod-validatie (`confirmBarAssignmentSchema`) toegevoegd vóór de DB-write (was ontbrekend).
- Geen secrets in `EXPO_PUBLIC_`-variabelen ✅

### Bundle
- Geen nieuwe packages toegevoegd in Phase 2 — alle dependencies waren pre-existing.

### Openstaande punten
- **Offline NetInfo-banner**: UC-06 vereist een "Geen verbinding"-banner bovenaan het scherm via NetInfo. Nog niet geïmplementeerd — plannen voor Phase 3 of apart ticket.
- **`bar_assignments(member_id)` index ontbreekt**: Pre-existing gap — index toevoegen vóór productie om RLS-scan te optimaliseren.
