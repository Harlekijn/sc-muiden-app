# federatie-integratie
<!-- generated: 2026-05-11 -->

## Gebruiksscenario's (Use Cases)

- `UC-01` — Systeem kan wedstrijdschema's en uitslagen synchroniseren vanuit KNVB en KNHB zodat leden actuele wedstrijddata zien zonder handmatige invoer.
- `UC-02` — Lid kan wedstrijddetails bekijken (datum, tijd, locatie, thuis/uit teams, score, status) zodat hij/zij weet wanneer en waar de volgende wedstrijd is en wat de uitslag was.
- `UC-03` — Beheerder kan handmatig een federatiesync triggeren per sport zodat hij/zij direct bijgewerkte data kan ophalen buiten de dagelijkse cron om.
- `UC-04` — Beheerder kan de synchistorie inzien (laatste 10 runs per sport) inclusief foutmeldingen zodat hij/zij kan controleren of de sync correct werkt.
- `UC-05` — Lid ziet de eerstvolgende wedstrijd als hero card op het thuisscherm zodat hij/zij in één oogopslag ziet wanneer de volgende wedstrijd is.

---

## Gebruikersstromen (User Flows)

### UC-01 — Automatische dagelijkse sync (cron)

**Happy path:**
1. Dagelijkse cron op 03:00 triggert `federation-sync` edge function met `{ sport: "all" }`.
2. Edge function haalt alle teams op met een `federation_team_id IS NOT NULL`.
3. Per team: ophalen wedstrijden via de juiste client (KNVB voor voetbal, KNHB voor hockey).
4. Zod-validatie van de API-respons.
5. Upsert wedstrijden in `matches` tabel op `federation_match_id` (ON CONFLICT DO UPDATE).
6. Upsert overeenkomstige `activities` records (type: `wedstrijd`, ON CONFLICT op `matches.federation_match_id` → bijwerken).
7. Schrijf `sync_log` record (sport, triggered_by: `cron`, records_updated, started_at, finished_at).
8. Leden zien bijgewerkte data bij eerstvolgende app-open.

**Error path A — API onbereikbaar:**
1–2. Zelfde als happy path.
3. KNVB of KNHB API retourneert HTTP-fout of timeout.
4. Per-team try/catch vangt de fout af; fout gelogd in `sync_log` (error kolom gevuld).
5. Overige teams worden nog steeds geprobeerd — geen crash van de hele sync.
6. Bestaande `matches` en `activities` data in de app ongewijzigd.

**Error path B — ongeldig dataformaat van federatie:**
1–3. Zelfde als happy path.
4. Zod-validatie faalt op de API-respons.
5. Team-sync wordt overgeslagen, Zod-fout gelogd als string in `sync_log.error`.
6. Overige teams gaan door.

### UC-02 — Wedstrijddetail bekijken (mobiel)

**Happy path:**
1. Lid opent thuisscherm of kalender.
2. Tikt op een activiteitskaart van type `wedstrijd`.
3. App navigeert naar `/wedstrijd/[id]` (Expo Router; `id` = `activity_id`).
4. React Query haalt `matches JOIN activities` op voor dit `activity_id`.
5. Scherm toont: thuis vs uitclub (en-dash), datum, tijd (24h), locatie met "Open in Kaarten"-link, statusbadge (`GEPLAND` of `GESPEELD`).
6. Als status `gespeeld`: scorebord in ds-score formaat (`3 – 1`, en-dash met spaties).
7. Lid tikt back-pijl → terug naar vorige scherm.

**Error path — wedstrijd niet gevonden:**
1–3. Zelfde als happy path.
4. Query retourneert geen resultaat (id ongeldig of verwijderd).
5. Scherm toont: "Wedstrijd niet gevonden." met sub-tekst "Ga terug naar de kalender."

### UC-03 — Handmatige sync triggeren (CMS)

**Happy path:**
1. Beheerder navigeert naar `/dashboard/instellingen/synchronisatie`.
2. Ziet twee secties (Voetbal en Hockey) met last-sync timestamp.
3. Klikt "Synchroniseer nu" voor voetbal.
4. Knop toont laadspinner; is disabled; tekst "Synchroniseren...".
5. CMS-pagina POST `api/sync/voetbal` → API-route verifieert beheerdersrol → roept edge function aan.
6. Edge function voert sync uit voor sport `voetbal`.
7. Na succesvolle sync: knop actief, timestamp bijgewerkt (client herlaadt sync_log).
8. Logpaneel toont nieuwe run bovenaan met groen vinkje en record count.

**Error path — sync mislukt:**
1–4. Zelfde als happy path.
5. Edge function retourneert HTTP-fout of foutobject.
6. API-route retourneert 500 met Nederlandse foutmelding.
7. UI toont foutbanner: "Synchronisatie mislukt. Probeer het opnieuw."
8. Foutrun verschijnt in logpaneel met rood kruis en foutmelding.

### UC-04 — Synchistorie bekijken (CMS)

**Happy path:**
1. Beheerder klikt op uitklappijl "Laatste 10 syncs ▾" naast een sport-sectie.
2. Paneel opent; toont tabel met tot 10 runs gesorteerd op `started_at DESC`.
3. Kolommen: Tijdstip | Records bijgewerkt | Status.
4. Succesvolle run: groen `<Check />` 16px.
5. Mislukte run: rood `<X />` 16px + foutmelding zichtbaar in de rij (ds-caption, `--color-error`).

### UC-05 — Volgende wedstrijd hero card (thuisscherm)

**Happy path:**
1. Lid opent thuisscherm.
2. `useNextMatch` hook haalt de eerstvolgende wedstrijd op (sport gebaseerd op profiel).
3. Sectie "VOLGENDE WEDSTRIJD" verschijnt met navy hero card.
4. Kaart toont: thuis vs uitclub, datum + tijd, statusbadge `GEPLAND`.
5. Lid tikt op kaart → navigeert naar `/wedstrijd/[id]`.

**Error path — geen komende wedstrijden:**
1–2. Zelfde als happy path.
3. Query retourneert geen resultaten.
4. Sectie "VOLGENDE WEDSTRIJD" is volledig verborgen (geen lege staat, geen placeholder).

---

## Acceptatiecriteria

### UC-01
- Gegeven een team met `federation_team_id`, als de sync draait, dan zijn wedstrijden geüpsert in `matches` met de juiste `federation_match_id` en `team_id`.
- Gegeven een KNVB API-fout, als de cron draait, dan is er een `sync_log` record met `error` gevuld en zijn bestaande `matches` ongewijzigd.
- Gegeven 2 teams (1 voetbal, 1 hockey), als de sync draait met `sport: "all"`, dan heeft elk team een aparte succesvolle `sync_log` entry.
- Gegeven een Zod-validatiefout op een API-respons, dan wordt de fout per team gelogd en gaan overige teams door.

### UC-02
- Gegeven een gesynchroniseerde wedstrijd, als een lid tikt op de activiteitskaart van type `wedstrijd`, dan navigeert de app naar `/wedstrijd/[id]`.
- Gegeven een wedstrijd met status `gespeeld`, dan toont het scherm het scorebord in formaat `3 – 1` (en-dash, spaties).
- Gegeven een wedstrijd met status `gepland`, dan is het scorebord niet zichtbaar en toont de statusbadge `GEPLAND` in ALL CAPS.
- Gegeven een ongeldig `activity_id`, dan toont het scherm "Wedstrijd niet gevonden." zonder technische foutmeldingen.

### UC-03
- Gegeven een beheerder op de sync-pagina, als hij "Synchroniseer nu" klikt, dan voert de edge function direct een sync uit voor die sport.
- Gegeven een succesvolle handmatige sync, dan wordt de last-sync timestamp bijgewerkt en verschijnt de run in het logpaneel.
- Gegeven een mislukte handmatige sync, dan toont de UI een Nederlandse foutbanner en verschijnt de foutrun rood in het logpaneel.
- Gegeven een `lid`-rol gebruiker die direct `POST /api/sync/voetbal` aanroept, dan retourneert de route HTTP 403.

### UC-04
- Gegeven geslaagde en mislukte syncruns, als de beheerder het logpaneel opent, dan ziet hij maximaal 10 runs gesorteerd op `started_at DESC`.
- Gegeven een mislukte run met foutmelding, dan is de foutmelding zichtbaar in de rij (ds-caption, `--color-error`).

### UC-05
- Gegeven een komende wedstrijd voor de sport van het lid, als hij het thuisscherm opent, dan is de hero card zichtbaar.
- Gegeven geen komende wedstrijden, dan is de sectie "VOLGENDE WEDSTRIJD" volledig verborgen.
- Gegeven het tikken op de hero card, dan navigeert de app naar `/wedstrijd/[id]`.

---

## UI / Grafisch Design

### 1. WedstrijdDetailScherm (mobiel)

- **Naam:** Wedstrijd
- **Route:** `/wedstrijd/[id]` (Expo Router; `id` = `activity_id`)
- **Lay-out:**
  - Navy header-balk (backgroundColor: `--color-navy`): terug-pijl `<ChevronLeft />` 24px (`--color-white`) links, teamnaam in ds-h4 (`--color-white`) gecentreerd.
  - Scorebord-sectie (alleen bij status `gespeeld`): achtergrond `--color-navy`, horizontale padding `--space-8`, verticale padding `--space-6`. Twee teamnamen (ds-body, `--color-white`) boven de cijfers. Score cijfers naast elkaar in ds-score (`--text-5xl`, `--fw-extrabold`, `--font-display`, tabular-nums, `--color-white`), gescheiden door `–` in `--color-yellow`.
  - Statusbadge (pill, ALL CAPS, ds-label): `GEPLAND` → backgroundColor `--color-navy-12`, color `--color-navy`; `GESPEELD` → backgroundColor `rgba(26,140,92,0.12)`, color `--color-success`. Gecentreerd, margin `--space-4` verticaal.
  - Info-kaart: backgroundColor `--color-white`, borderRadius `--radius-lg`, boxShadow `--shadow-card`, padding `--space-4`, margin horizontaal `--space-4`:
    - Rij datum/tijd: `<Clock />` 20px `--color-blue` | dag (bijv. "zaterdag 16 mei") ds-body `--color-text` | tijd 24h ds-body `--color-text`
    - Rij locatie: `<MapPin />` 20px `--color-blue` | locatienaam ds-body `--color-text` | "Open in Kaarten" ds-label `--color-blue` rechts uitlijnen
    - Rij team: `<Users />` 20px `--color-blue` | teamnaam ds-body `--color-text`
    - Rijen gescheiden door `1px solid --color-mid`, padding `--space-3` verticaal

- **Laadindicator:** twee rechthoekige skeletons (`--color-mid`, borderRadius `--radius-md`) voor score-sectie en info-kaart.
- **Lege staat:** "Wedstrijd niet gevonden." (ds-body, `--color-text-2`) gecentreerd, sub-tekst "Ga terug naar de kalender." (ds-caption, `--color-text-2`).
- **Foutmelding:** "Er is iets misgegaan. Probeer het opnieuw." — geen Supabase-fouten of Engelse codes.

### 2. Synchronisatie-pagina (CMS web)

- **Naam:** Synchronisatie
- **Route:** `/dashboard/instellingen/synchronisatie` (Next.js App Router)
- **Lay-out:**
  - Paginatitel "Synchronisatie" (ds-h2, `--color-navy`), sub-tekst "Beheer de koppeling met KNVB (voetbal) en KNHB (hockey)." (ds-body, `--color-text-2`).
  - Grid: twee gelijke kolommen op desktop (≥768px), gestapeld op mobiel.
  - Per sport-sectie: kaart (backgroundColor `--color-white`, borderRadius `--radius-lg`, boxShadow `--shadow-card`, padding `--space-6`):
    - Sectietitel "Voetbal" of "Hockey" (ds-h4, `--color-navy`), sportbadge (pill, `--color-blue`, `--color-white`, ds-label) rechts uitlijnen.
    - Last-sync regel: "Laatste sync: maandag 11 mei om 03:14" of "Nog nooit gesynchroniseerd." (ds-caption, `--color-text-2`). Datetime Dutch format.
    - Knop "Synchroniseer nu": primary, backgroundColor `--color-blue`, color `--color-white`, borderRadius `--radius-md`, padding `--space-2 --space-4`, `<RefreshCw />` 16px links. Loading state: `<Loader />` 16px spinner animatie, disabled, opacity 0.7, tekst "Synchroniseren...".
    - Uitklapper label "Laatste 10 syncs" met `<ChevronDown />` 16px (of `<ChevronUp />` als open), ds-label `--color-text-2`, klikbaar.
    - Uitklapbare logtabel (border `1px solid --color-mid`, borderRadius `--radius-md`):
      - Kolommen: Tijdstip | Records | Status
      - Even rijen: backgroundColor `--color-light`; oneven: `--color-white`
      - Succesrij: `<Check />` 16px `--color-success` + "Gelukt" ds-label
      - Foutrij: `<X />` 16px `--color-error` + foutmelding ds-caption `--color-error`
      - Lege staat tabel: "Nog geen syncruns." (ds-caption, `--color-text-2`)

- **Foutbanner (inline bij knop na mislukte handmatige sync):** backgroundColor `--color-error-bg`, color `--color-error`, borderRadius `--radius-md`, padding `--space-3`, `<AlertCircle />` 16px links, tekst "Synchronisatie mislukt. Probeer het opnieuw." (ds-body).
- **Laadindicator pagina:** skeletons voor de twee sport-kaarten.

### 3. ActivityCard — update voor wedstrijdtype (mobiel, bestaand component)

Bestand: `apps/mobile/components/activity/ActivityCard.tsx`

- Wedstrijd activity cards (type: `wedstrijd`) tonen `<ChevronRight />` 20px rechts (`--color-text-2`) om tik-navigatie aan te geven.
- Tikken op een wedstrijd-card navigeert naar `/wedstrijd/[activity_id]`.
- Als de bijbehorende match `status === 'gespeeld'` heeft: toon score rechts van de teamnaam in ds-label formaat `3 – 1` (`--color-text-2`).
- Andere activity types (training, bardienst, clubactiviteit) zijn ongewijzigd.

### 4. Volgende wedstrijd hero card (thuisscherm — update bestaand scherm)

Bestand: `apps/mobile/app/(tabs)/index.tsx`

- Sectielabel "VOLGENDE WEDSTRIJD" (ds-label, ALL CAPS, `--color-text-2`, marginBottom `--space-2`). Sectie verborgen als `useNextMatch` geen resultaat retourneert.
- Hero card: backgroundColor `--color-navy`, borderRadius `--radius-lg`, boxShadow `--shadow-elevated`, padding `--space-4`, volledig breedte:
  - Bovenste rij: sportbadge pill (backgroundColor `--color-yellow`, color `--color-navy`, ds-label) links + statusbadge `GEPLAND` pill (backgroundColor `rgba(255,255,255,0.15)`, color `--color-white`, ds-label) rechts.
  - Thuisteam vs uitteam: twee teamnamen (ds-h4, `--color-white`) met `–` (`--color-yellow`, ds-h4) ertussen, marginTop `--space-3`.
  - Datum + tijd: `<Calendar />` 16px `rgba(255,255,255,0.6)` | tekst ds-body `rgba(255,255,255,0.7)`, marginTop `--space-2`.
  - Laadindicator: skeleton (backgroundColor `--color-navy-70`, borderRadius `--radius-md`).

---

## Technisch Design

### Database wijzigingen

**Migratie 1: `YYYYMMDDHHMMSS_add_team_id_to_matches.sql`**

```sql
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_team_id       ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_fed_match_id  ON matches(federation_match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status        ON matches(status);

-- RLS: elke ingelogde gebruiker kan wedstrijden lezen (publieke clubdata)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_authenticated"
  ON matches FOR SELECT
  USING (auth.role() = 'authenticated');
-- INSERT/UPDATE: alleen via service_role (edge function) — geen RLS-policy nodig voor INSERT
```

**Migratie 2: `YYYYMMDDHHMMSS_sync_log_triggered_by.sql`**

```sql
ALTER TABLE sync_log
  ADD COLUMN IF NOT EXISTS triggered_by text NOT NULL DEFAULT 'cron';

CREATE INDEX IF NOT EXISTS idx_sync_log_sport_started
  ON sync_log(sport, started_at DESC);

-- RLS: alleen beheerder/commissielid kan sync_log lezen
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_log_select_admin"
  ON sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('beheerder', 'commissielid')
    )
  );
-- INSERT: alleen via service_role (edge function)
```

Kolommen na migraties:

| Tabel | Nieuwe kolom | Type | Constraint |
|---|---|---|---|
| `matches` | `team_id` | `uuid` | FK → `teams(id)`, ON DELETE SET NULL |
| `sync_log` | `triggered_by` | `text` | NOT NULL, DEFAULT `'cron'` |

### Gedeelde types (`packages/shared/src/`)

**Nieuw: `packages/shared/src/schemas/federation.schema.ts`**

Zod-schemas voor KNVB en KNHB API-responses. Alle `.message()` strings in het Nederlands. Bevat ook een genormaliseerd `NormalizedMatchSchema` dat beide federaties naar één intern formaat converteert.

```typescript
// KNVB API response schema
export const KnvbMatchSchema = z.object({
  id: z.string({ message: "Wedstrijd-ID is verplicht" }),
  thuisclub: z.string({ message: "Thuisclub is verplicht" }),
  uitclub: z.string({ message: "Uitclub is verplicht" }),
  datum: z.string({ message: "Datum is verplicht" }),
  aanvangstijd: z.string({ message: "Aanvangstijd is verplicht" }),
  locatie: z.string().optional(),
  thuisstand: z.number().optional(),
  uitstand: z.number().optional(),
  status: z.enum(['gepland', 'gespeeld', 'afgelast'], { message: "Ongeldige status" }),
})

// KNHB API response schema
export const KnhbMatchSchema = z.object({
  matchId: z.string({ message: "Match-ID is verplicht" }),
  homeTeam: z.string({ message: "Thuisclub is verplicht" }),
  awayTeam: z.string({ message: "Uitclub is verplicht" }),
  dateTime: z.string({ message: "Datum/tijd is verplicht" }),
  venue: z.string().optional(),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  status: z.string(),
})

export type KnvbMatch = z.infer<typeof KnvbMatchSchema>
export type KnhbMatch = z.infer<typeof KnhbMatchSchema>
```

**Update: `packages/shared/src/types/app.types.ts`**

Toevoegen:

```typescript
export type MatchStatus = 'gepland' | 'gespeeld' | 'afgelast'

export type MatchWithActivity = {
  id: string
  activityId: string
  teamId: string | null
  homeTeam: string
  awayTeam: string
  scoreHome: number | null
  scoreAway: number | null
  status: MatchStatus
  federationMatchId: string | null
  federationSource: 'knvb' | 'knhb' | null
  // Uit activities JOIN:
  startsAt: string
  endsAt: string | null
  location: string | null
  sport: string | null
  teamName: string | null
}
```

**Update: `packages/shared/src/index.ts`** — exporteer `federation.schema.ts` en de nieuwe types.

### Mobiele implementatie (`apps/mobile/`)

**Nieuwe hooks:**

- `apps/mobile/hooks/useMatch.ts`
  - Query key: `['match', activityId]`
  - Query: `supabase.from('matches').select('*, activities(*), teams(name)').eq('activity_id', activityId).single()`
  - Return type: `MatchWithActivity | null`

- `apps/mobile/hooks/useNextMatch.ts`
  - Query key: `['nextMatch', sport]`
  - Query: matches met `status = 'gepland'` + `activities.starts_at > now()` + sport filter + ORDER BY `starts_at ASC` + LIMIT 1
  - Return type: `MatchWithActivity | null`

**Nieuwe schermen:**

- `apps/mobile/app/wedstrijd/[id].tsx` — WedstrijdDetailScherm
  - Leest `id` uit Expo Router params (= `activity_id`)
  - Gebruikt `useMatch(id)`
  - Client component (geen server component op mobile)

**Updates:**

- `apps/mobile/components/activity/ActivityCard.tsx` — voeg wedstrijd-tap-navigatie en score-display toe
- `apps/mobile/app/(tabs)/index.tsx` — voeg "VOLGENDE WEDSTRIJD" sectie toe met hero card

### Web CMS implementatie (`apps/web/`)

**Server component** (geen client state voor initieel laden):

- `apps/web/app/dashboard/instellingen/synchronisatie/page.tsx`
  - Leest `sync_log` (laatste 10 per sport) via Supabase server client
  - Rendert twee `SyncSportSectie` composities
  - Bevat `SyncTriggerButton` (client component) per sport

**Client component:**

- `apps/web/app/dashboard/instellingen/synchronisatie/SyncTriggerButton.tsx`
  - `useState` voor `loading`, `error`, `lastSyncAt`
  - `fetch('POST /api/sync/[sport]')` op klikactie
  - Na succes: timestamp bijwerken, logpaneel refresh via React Query of router.refresh()

**API route (server-side, POST only):**

- `apps/web/app/api/sync/[sport]/route.ts`
  - Verifieert Supabase sessie + rol (`beheerder` | `commissielid`) → anders HTTP 403
  - Roept `federation-sync` edge function aan via `supabaseAdmin.functions.invoke('federation-sync', { body: { sport } })`
  - Bij succes: HTTP 200 + `{ ok: true, lastSyncAt }`
  - Bij fout: HTTP 500 + `{ ok: false, message: "..." }` (Nederlandse foutmelding)

**Role guard:** valt onder de bestaande dashboard middleware/layout; geen extra guard nodig.

### Edge functions (`supabase/functions/`)

**`supabase/functions/federation-sync/index.ts`**

- Trigger type: HTTP POST (cron via Supabase scheduler + handmatig via CMS API route)
- Secrets: `KNVB_API_KEY`, `KNHB_API_KEY` (via `Deno.env.get()`)
- Request body: `{ sport: 'voetbal' | 'hockey' | 'all', triggered_by?: 'cron' | 'manual' }`
- `verify_jwt: false` (aanroep via service key vanuit CMS backend, geen user JWT)

**Logica (per team):**
1. Haal teams op met `federation_team_id IS NOT NULL` + sport-filter
2. Per team: try/catch omheen
   - Roep KNVB of KNHB client aan (importeer uit `supabase/functions/_shared/`)
   - Valideer respons met Zod
   - Upsert in `matches` (`ON CONFLICT (federation_match_id) DO UPDATE SET ...`)
   - Upsert in `activities` (type: `wedstrijd`, koppel via `activity_id` op `matches`)
3. Schrijf `sync_log` per sport (started_at, finished_at, records_updated, triggered_by, error)
4. Log alleen: sport naam, team_id (UUID), record count, fout type — nooit PII

**`supabase/functions/_shared/knvb-client.ts`** (Deno-compatibel)

- `KnvbClient` klasse met `fetchTeamSchedule(teamId: string): Promise<KnvbMatch[]>`
- Mock-implementatie actief als `KNVB_API_KEY` ontbreekt (retourneert test-wedstrijden)

**`supabase/functions/_shared/knhb-client.ts`** (Deno-compatibel)

- `KnhbClient` klasse met `fetchTeamSchedule(teamId: string): Promise<KnhbMatch[]>`
- Mock-implementatie actief als `KNHB_API_KEY` ontbreekt

**`packages/api-clients/src/knvb.ts`** en **`packages/api-clients/src/knhb.ts`** (bestaande stubs):

- Bijwerken met de definitieve TypeScript-types en mock-implementatie (Node.js variant)
- Deze zijn documentatie/integratie voor toekomstige Node.js gebruik; de edge function gebruikt de `_shared/` versies

**Cron configuratie (`supabase/config.toml`):**

```toml
[functions.federation-sync]
verify_jwt = false

# Cron via Supabase dashboard voor productie:
# dagelijks om 03:00 UTC → POST federation-sync met { sport: "all", triggered_by: "cron" }
```

### Implementatievolgorde

1. DB migratie `add_team_id_to_matches` (team_id kolom, indexes, RLS)
2. DB migratie `sync_log_triggered_by` (triggered_by kolom, index, RLS)
3. `supabase db reset`
4. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
5. `packages/shared/src/schemas/federation.schema.ts` + update `app.types.ts` + update `index.ts`
6. Update `packages/api-clients/src/knvb.ts` + `packages/api-clients/src/knhb.ts`
7. `supabase/functions/_shared/knvb-client.ts` + `supabase/functions/_shared/knhb-client.ts`
8. `supabase/functions/federation-sync/index.ts`
9. `apps/mobile/hooks/useMatch.ts` + `apps/mobile/hooks/useNextMatch.ts`
10. `apps/mobile/app/wedstrijd/[id].tsx` (WedstrijdDetailScherm)
11. Update `apps/mobile/components/activity/ActivityCard.tsx` (wedstrijd tap + score)
12. Update `apps/mobile/app/(tabs)/index.tsx` (hero card sectie)
13. `apps/web/app/dashboard/instellingen/synchronisatie/page.tsx` + `SyncTriggerButton.tsx`
14. `apps/web/app/api/sync/[sport]/route.ts`
15. Tests (zie implementatieplan checklist)
16. `pnpm typecheck`
17. `pnpm test`

---

## GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | nee — wedstrijddata is publieke sportdata; teamnamen zijn organisatienamen, geen individuen | — |
| Wettelijke grondslag | n.v.t. — geen persoonsgegevens | — |
| Data van kinderen (< 16 jaar)? | nee — wedstrijddata bevat geen kindgegevens | — |
| Bewaartermijn | `sync_log`: behouden voor beheerdoeleinden; `matches`: onbeperkt (historische uitslagen) | Geen actie vereist |
| Toegang beperkt via RLS? | ja — `matches` leesbaar voor alle authenticated users; `sync_log` alleen voor beheerder/commissielid | RLS policies in migraties opgenomen |
| PII in logs vermeden? | ja — edge function logt sport, team_id (UUID), record counts, foutmeldingen (geen namen, e-mails, geboortedata) | — |
| Data binnen EU (Supabase EU-region)? | ja — Supabase project EU-region | Bevestigen bij productie-setup |
| Bewerkingsverzoek (DSAR) mogelijk? | n.v.t. — geen persoonsgegevens in federation data | — |

---

## Scenario-wijzigingen

### Nieuw: `docs/scenarios/11-federatie-integratie.md`

Nieuwe scenarios S11-A t/m S11-E voor de volledige federation integration flow (zie apart scenario-bestand).

### Update: `docs/scenarios/05-activiteiten-kalender.md`

Voeg toe aan de prerequisites-sectie: wedstrijd-activiteiten in de kalender worden gevuld door de federatiesync. Voor testigngsdoeleinden bevat het seed-script een wedstrijd-activiteit + bijbehorend `matches` record met `status: 'gepland'`.

### Update: `docs/scenarios/10-home-feed.md`

Voeg toe: S10-E — "Volgende wedstrijd hero card zichtbaar op thuisscherm" (vereist gesynchroniseerde wedstrijd in de seed).

---

## Implementatieplan (genummerde checklist)

1. [ ] Maak `supabase/migrations/YYYYMMDDHHMMSS_add_team_id_to_matches.sql` — voeg `team_id uuid references teams(id) on delete set null` toe; voeg indexes toe op `matches(team_id)`, `matches(federation_match_id)`, `matches(status)`; schrijf RLS SELECT policy voor authenticated users
2. [ ] Maak `supabase/migrations/YYYYMMDDHHMMSS_sync_log_triggered_by.sql` — voeg `triggered_by text not null default 'cron'` toe; index op `sync_log(sport, started_at DESC)`; schrijf RLS SELECT policy voor beheerder/commissielid
3. [ ] Voer `supabase db reset` uit
4. [ ] Voer `supabase gen types typescript --local > packages/shared/src/types/db.types.ts` uit
5. [ ] Maak `packages/shared/src/schemas/federation.schema.ts` — `KnvbMatchSchema`, `KnhbMatchSchema`, alle `.message()` strings in het Nederlands
6. [ ] Update `packages/shared/src/types/app.types.ts` — voeg `MatchStatus` en `MatchWithActivity` types toe
7. [ ] Update `packages/shared/src/index.ts` — exporteer federation schema's en nieuwe types
8. [ ] Update `packages/api-clients/src/knvb.ts` — `KnvbClient` klasse met `fetchTeamSchedule`, mock-implementatie als `KNVB_API_KEY` ontbreekt
9. [ ] Update `packages/api-clients/src/knhb.ts` — `KnhbClient` klasse met `fetchTeamSchedule`, mock-implementatie als `KNHB_API_KEY` ontbreekt
10. [ ] Maak `supabase/functions/_shared/knvb-client.ts` — Deno-variant van KNVB client
11. [ ] Maak `supabase/functions/_shared/knhb-client.ts` — Deno-variant van KNHB client
12. [ ] Maak `supabase/functions/federation-sync/index.ts` — sync logic, per-team try/catch, sync_log schrijven, `verify_jwt = false`
13. [ ] Maak `apps/mobile/hooks/useMatch.ts` — React Query hook, join `matches + activities + teams`
14. [ ] Maak `apps/mobile/hooks/useNextMatch.ts` — React Query hook, eerstvolgende wedstrijd per sport
15. [ ] Maak `apps/mobile/app/wedstrijd/[id].tsx` — WedstrijdDetailScherm, client component
16. [ ] Update `apps/mobile/components/activity/ActivityCard.tsx` — voeg navigatie toe voor wedstrijdtype, toon score als gespeeld
17. [ ] Update `apps/mobile/app/(tabs)/index.tsx` — voeg "VOLGENDE WEDSTRIJD" sectie toe met hero card
18. [ ] Maak `apps/web/app/dashboard/instellingen/synchronisatie/page.tsx` — server component, laadt sync_log
19. [ ] Maak `apps/web/app/dashboard/instellingen/synchronisatie/SyncTriggerButton.tsx` — client component met loading/error state
20. [ ] Maak `apps/web/app/api/sync/[sport]/route.ts` — POST handler, rol-check, roept edge function aan
21. [ ] Maak `packages/shared/src/__tests__/federation.schema.test.ts` — unit tests voor `KnvbMatchSchema` en `KnhbMatchSchema` (geldige input, ongeldige input, Nederlandse foutmeldingen)
22. [ ] Maak `apps/mobile/app/wedstrijd/__tests__/[id].test.tsx` — component test: rendert score bij status gespeeld, rendert lege staat bij missend ID
23. [ ] Maak `apps/web/app/dashboard/instellingen/synchronisatie/__tests__/page.test.tsx` — component test: rol-check 403, sync button loading state
24. [ ] Voer `pnpm typecheck` uit — verwacht 0 fouten
25. [ ] Voer `pnpm test` uit — verwacht alle tests geslaagd

---

## Open vragen

1. **KNVB/KNHB API-authenticatie:** API-sleutels zijn nog niet aangevraagd. Mock-clients worden gebouwd zodat de rest van het systeem volledig functioneert. Zodra sleutels beschikbaar zijn, worden `KNVB_API_KEY` en `KNHB_API_KEY` als Supabase secrets toegevoegd en worden de mock-guards in de clients verwijderd.
2. **KNVB/KNHB werkelijke API-structuur:** De Zod-schemas zijn gebaseerd op aannames over de API-structuur. Bij ontvangst van API-documentatie moeten de schemas en clients worden gevalideerd en bijgesteld.
3. **Cron in productie:** Voor local dev wordt de cron handmatig getriggerd. Voor productie wordt de cron geconfigureerd via het Supabase dashboard (pg_cron of Supabase Scheduled Functions). Dit is een post-deploy configuratiestap.

---

## SRE Notes

**Datum:** 11-05-2026

### Logging
- Edge function `federation-sync` logt uitsluitend: sport, team_id (UUID), fouttype, record counts. Geen PII. ✓
- Supabase ingebouwde audit log is de primaire data-access log. ✓
- Start- en eindtijd per sync worden opgeslagen in `sync_log` (started_at, finished_at). ✓

### Monitoring
- Indexes geverifieerd: `idx_matches_team_id`, `idx_matches_fed_match_id`, `idx_matches_status` (migratie 1). ✓
- Index geverifieerd: `idx_sync_log_sport_started` op `(sport, started_at DESC)` (migratie 2). ✓
- `useMatch` en `useNextMatch`: `staleTime: 5 * 60 * 1000` ingesteld. ✓
- RLS `matches_select_authenticated` gebruikt `auth.role() = 'authenticated'` (geen volledige tabelscan; intentioneel voor publieke clubdata). ✓
- RLS `sync_log_select_admin` gebruikt `auth.uid()` subquery. ✓

### Foutafhandeling
- Alle foutmeldingen in het Nederlands geverifieerd. ✓
- Netwerk catch-fout in `SyncTriggerButton` aangepast naar standaard: "Geen verbinding — controleer je internetverbinding en probeer opnieuw." (was: "Synchronisatie mislukt. Controleer de verbinding..."). 1 probleem opgelost.
- Knop `disabled={loading}` tijdens in-flight request. ✓
- Succesfeedback pas na serverbevestiging (`res.ok && json.ok`). ✓

### Beveiliging
- RLS: geen `USING (true)` op tabellen met persoonsgegevens. ✓
- `SUPABASE_SECRET_KEY` uitsluitend in `apps/web/lib/supabase-admin.ts` (server-side). ✓
- KNVB/KNHB API-sleutels uitsluitend via `Deno.env.get()` in edge function. ✓
- API route: sport-parameter gevalideerd tegen `ALLOWED_SPORTS` whitelist vóór DB-toegang. ✓
- Edge function: runtime sport-validatie toegevoegd (retourneert 400 bij ongeldige sport). 1 probleem opgelost.

### Bundle
Geen nieuwe packages toegevoegd aan `apps/mobile/package.json`.

### Openstaande punten
- KNVB/KNHB API-sleutels nog niet aangevraagd; mock-implementaties actief. Actie vereist voor productie.
- Cron-configuratie in Supabase dashboard moet nog worden ingesteld voor productie (post-deploy stap).
- Zod-schemas valideren op aangenomen API-structuur; moeten worden geverifieerd zodra officiële API-documentatie beschikbaar is.
