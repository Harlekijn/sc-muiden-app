# /design — Feature Design

Perform a deep design for a SC Muiden feature: functional, UI/graphical, and technical. Produces a design artifact at `docs/designs/<feature-slug>.md` and creates or updates scenario files in `docs/scenarios/`.

## Usage

```
/design <feature-slug>
/design wedstrijd-herinnering
/design bardienst-bevestiging
```

---

## Instructions

The feature slug is: **$ARGUMENTS**

If $ARGUMENTS is empty, ask: "Welke feature wil je ontwerpen? Geef een kebab-case slug (bijv. `push-notificaties`)." Wait for the answer before continuing.

---

### Step 1 — Context load (silent, no output to user)

Read these files silently before asking any questions. Do not output anything while reading.

- `CLAUDE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/TESTING_STRATEGY.md`
- `docs/ROADMAP_V1.md`
- All files in `docs/scenarios/` (list the directory first to see all files)
- `docs/designs/<feature-slug>.md` if it exists (indicates a revision)
- `supabase/migrations/` directory listing to understand current schema
- `packages/shared/src/types/db.types.ts` to understand existing DB types

After reading, determine the next available scenario number by finding all files in `docs/scenarios/` that start with a two-digit number (e.g. `01-`, `04-`) and identifying the highest number. New scenarios for this feature will be numbered from `NN+1`.

---

### Step 2 — Functional requirements interview

**Critical rule: Ask exactly ONE question at a time. Wait for the user's answer. Do not proceed to the next question until you have received the answer. Do not show all questions at once.**

For each question, present the options clearly and allow a free-text answer if none of the options fit.

---

**Question 1 — Primary user**

Ask this question and wait for the answer:

"**Vraag 1/7 — Primaire gebruiker**

Wie is de primaire gebruiker van `<feature-slug>`?

**A)** Lid / ouder — mobiele app
**B)** Beheerder / commissielid — web CMS
**C)** Beide (mobiel + CMS)"

Wait for answer. Then ask Question 2.

---

**Question 2 — Core action**

"**Vraag 2/7 — Kern-actie**

Wat is de kern-actie die de gebruiker uitvoert? Beschrijf in één zin wat de gebruiker wil bereiken met deze feature."

Wait for answer. Then ask Question 3.

---

**Question 3 — Trigger**

"**Vraag 3/7 — Activering**

Hoe wordt de feature geactiveerd?

**A)** Gebruiker initieert — tikt op knop, vult formulier in
**B)** Systeem initieert — push notificatie, achtergrondtaak, cron-job
**C)** Admin initieert vanuit web CMS"

Wait for answer. Then ask Question 4.

---

**Question 4 — Data scope**

"**Vraag 4/7 — Betrokken data**

Welke bestaande tabellen zijn betrokken? Noem de namen, of zeg 'nieuw' als er nieuwe tabellen nodig zijn.

Bestaande tabellen: `profiles`, `members`, `user_family_members`, `family_link_requests`, `teams`, `team_members`, `activities`, `matches`, `bar_assignments`, `announcements`, `notifications`, `push_tokens`"

Wait for answer. Then ask Question 5.

---

**Question 5 — Sport scope**

"**Vraag 5/7 — Sport**

Is deze feature sport-specifiek?

**A)** Voetbal én hockey (beide sporten)
**B)** Alleen voetbal
**C)** Alleen hockey
**D)** Sport-onafhankelijk"

Wait for answer. Then ask Question 6.

---

**Question 6 — Personal data**

"**Vraag 6/7 — Persoonsgegevens**

Verwerkt deze feature bijzondere of gevoelige persoonsgegevens?

**A)** Ja — data van kinderen (leeftijd < 16 jaar)
**B)** Ja — locatiedata of aanwezigheidsregistratie
**C)** Ja — andere gevoelige data (beschrijf welke in je antwoord)
**D)** Nee — geen bijzondere persoonsgegevens"

Wait for answer. Then ask Question 7.

---

**Question 7 — Edge cases**

"**Vraag 7/7 — Foutgevallen en edge cases**

Wat zijn de 2–3 belangrijkste foutgevallen of randgevallen voor deze feature? Voorbeelden: 'geen internetverbinding', 'admin keurt af', 'dubbele inzending', 'lege lijst'.

Beschrijf ze kort."

Wait for answer. Once you have all 7 answers, proceed to Step 3.

---

### Step 3 — Functional design

Produce a structured functional design:

**Gebruiksscenario's (Use Cases)**

List every use case in this format:
`UC-01 — [Rol] kan [actie uitvoeren] zodat [resultaat/waarde]`

Number from UC-01. Include the happy path and error paths derived from Q7.

**Gebruikersstromen (User Flows)**

For each use case: numbered step-by-step flow in Dutch. Show the happy path and 2–3 error paths from Q7.

**Acceptatiecriteria**

For each use case: measurable, testable criteria in Dutch using this format:
`Gegeven [context], als [actie], dan [verwacht resultaat].`

---

### Step 4 — UI / Graphical design

Describe every screen and component needed. For each screen or component, provide:

- **Naam** — Dutch, matches what the user sees
- **Route** — Expo Router path for mobile; Next.js route for web CMS; "geen eigen route" for modal/sheet
- **Lay-out** — describe sections, order, and visual hierarchy in detail
- **Componenten** — list each UI component with explicit design token usage:
  - Colors: token names only from `docs/DESIGN_SYSTEM.md` (e.g. `--color-navy`, `--color-blue`, `--color-yellow`)
  - Typography: semantic roles (ds-h1 through ds-h4, ds-body, ds-label, ds-caption)
  - Spacing: always multiples of 4px base unit
  - Icons: Lucide outline stroke only — never filled. Name the specific icon (e.g. `<Calendar />`, `<ChevronRight />`)
  - Radius: card = 10px, button = 8px
  - Shadows: `rgba(1, 29, 80, 0.08)` — navy-tinted, never pure black
- **Lege staat** — Dutch empty state text and sub-text
- **Foutmelding** — Dutch error text. Never show raw Supabase errors or English error codes.
- **Laadindicator** — describe skeleton type or spinner

Enforce strictly:
- No hardcoded hex colors anywhere in the design
- No emoji in UI
- No gradients in components (only permitted in hero/banner overlay)
- No filled icons

---

### Step 5 — Technical design

**Database wijzigingen**

For each new or modified table:
- Table name, all columns with types and constraints
- `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
- `deleted_at timestamptz` if records must be preserved (member/activity data)
- RLS policies per operation and per role: SELECT, INSERT, UPDATE, DELETE
- Every policy must reference `auth.uid()` — no policy without it on personal data tables
- No `USING (true)` on tables with personal data
- Indexes: every FK column, every RLS WHERE clause column, `created_at` if queried by date range
- Migration filename format: `YYYYMMDDHHMMSS_<description>.sql`

**Gedeelde types** (`packages/shared/src/`)

- New Zod schemas to add to `packages/shared/src/schemas/`
- All Zod `.message()` strings in Dutch
- New or extended TypeScript types in `packages/shared/src/types/app.types.ts`
- Note that `supabase gen types typescript --local` must be re-run after migrations

**Mobiele implementatie** (`apps/mobile/`)

- React Query hooks to create/modify (filename, query key, return type)
- Expo Router routes and screen files (PascalCase.tsx)
- Zustand store changes if needed (`apps/mobile/stores/`)
- Supabase client usage: `apps/mobile/lib/supabase.ts`

**Web CMS implementatie** (`apps/web/`)

- Server components vs client components — state the decision and reason
- Next.js routes in `apps/web/app/`
- API routes in `apps/web/app/api/` if needed
- Role guard: reject users without `beheerder` or `commissielid` role

**Edge functions** (`supabase/functions/`)

- Function name, trigger type (webhook on DB insert / cron / manual HTTP)
- Secrets required (added to Supabase secrets, accessed via `Deno.env.get()`)
- Never log PII — log event type, timestamp, outcome only

**Implementatievolgorde** — numbered sequence:
1. DB migration
2. `supabase db reset` + `supabase gen types typescript --local`
3. Shared schemas/types
4. Mobile implementation
5. Web CMS implementation (if applicable)
6. Edge functions (if applicable)
7. Tests

---

### Step 6 — GDPR compliance

Produce this table. Fill in every cell based on the design and the answer to Q6:

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | ja — welke / nee | — |
| Wettelijke grondslag | toestemming / gerechtvaardigd belang / overeenkomst / wettelijke plicht | Vastleggen in design doc |
| Data van kinderen (< 16 jaar)? | ja / nee | Extra RLS; geen tracking; ouderlijk toestemming |
| Bewaartermijn | X maanden / onbeperkt / soft-delete | Beleid vastleggen |
| Toegang beperkt via RLS? | ja / nee | Policies schrijven |
| PII in logs vermeden? | ja / risico gevonden | Logregels aanpassen |
| Data binnen EU (Supabase EU-region)? | ja / nee | Controleer Supabase project regio |
| Bewerkingsverzoek (DSAR) mogelijk? | ja — hoe / nee | Soft-delete + export ondersteunen |

If any "Actie vereist" cell is non-empty, add the action to the implementation plan in Step 5.

---

### Step 7 — Scenario updates

Compare the use cases from Step 3 against all existing files in `docs/scenarios/`.

Determine:
- Which existing scenario files need new steps or updated expected results due to this feature
- Which new scenario files must be created for new flows

**Scenario numbering:**
- New scenario files must be numbered sequentially after the highest existing number found in Step 1
- Format: `NN-<feature-slug>.md`

For each new or updated scenario file, write the full content in the same format as existing scenario files:
- Dutch language throughout
- Numbered steps
- "Verwacht resultaat" section
- "Verificatie via Supabase Studio" section where DB state must be confirmed
- Scenario ID format: `SNN-X` (e.g. `S05-A`, `S05-B`)

State clearly which files to create and which to update.

---

### Step 8 — Implementation plan

Produce a numbered, sequenced implementation checklist. Each item must be:
- Specific enough that Claude Code can execute it without further clarification
- Includes the exact file path
- Includes migration filename with timestamp placeholder: `YYYYMMDDHHMMSS_<name>.sql`
- Includes test files to create
- Includes verification commands: `supabase db reset`, `supabase gen types typescript --local`, `pnpm typecheck`, `pnpm test`

---

### Step 9 — Save design artifact

Save the complete design to `docs/designs/<feature-slug>.md`.

The file must contain all sections produced in Steps 3–8:
1. Feature slug, date (`<!-- generated: YYYY-MM-DD -->`)
2. Use cases
3. User flows
4. Acceptance criteria
5. UI design per screen/component
6. Technical design (DB, types, mobile, web, edge functions, implementation order)
7. GDPR compliance table
8. Scenario changes (which files to create/update, with full content)
9. Implementation plan (numbered checklist)
10. Open questions (if any)

Also write or update each scenario file identified in Step 7 in `docs/scenarios/`.

After saving, output:

"Design voor `<feature-slug>` opgeslagen in `docs/designs/<feature-slug>.md`.

Scenario's bijgewerkt in `docs/scenarios/`.

Klaar voor Phase 2 — voer uit: `/implement <feature-slug>`"
