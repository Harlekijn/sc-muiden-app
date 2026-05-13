# Design: leden-rollen
<!-- generated: 2026-05-13 -->

## Kernprobleem

De admin mist ledentype-informatie bij het inplannen van bardiensten. De club onderscheidt vijf soorten leden (jeugdlid, niet-spelend lid, trainingslid, spelend lid, relatie), maar dit is nergens vastgelegd in de database. Tegelijkertijd worden de app-toegangsrollen vereenvoudigd van zeven naar twee: `lid` (alleen app) en `beheerder` (app + CMS).

---

## Use Cases

`UC-01 — Beheerder kan ledentype instellen per lid zodat bardienst-indeling op type gefilterd kan worden`

`UC-02 — Beheerder kan vrijwilligers- en barcommissie-status per lid markeren zodat deze groepen apart zichtbaar zijn bij inroosteren`

`UC-03 — Beheerder kan ledentype bulksgewijs bijwerken vanuit de ledenlijst zodat een eerste categorisering snel verloopt`

`UC-04 — Beheerder kan app-toegangsrol van gebruikers wijzigen (lid ↔ beheerder) zodat CMS-toegang correct is geregeld`

`UC-05 — Systeem weigert CMS-toegang aan gebruikers met rol 'lid' zodat onbevoegden het beheerpaneel niet kunnen bereiken`

---

## Gebruikersstromen

### UC-01 — Ledentype instellen via detailscherm

**Happy path:**
1. Beheerder navigeert naar `/dashboard/leden`.
2. Beheerder klikt op een lid in de lijst.
3. Pagina `/dashboard/leden/[id]` laadt; sectie "Lidmaatschap" toont huidig ledentype (of "Niet ingesteld").
4. Beheerder klikt "Bewerken" in de sectie "Lidmaatschap".
5. Dropdown voor ledentype en twee checkboxes (vrijwilliger, barcommissie) worden bewerkbaar.
6. Beheerder kiest ledentype en slaat op.
7. Succesbanner verschijnt; weergave keert terug naar read-only met het nieuwe type.

**Foutpad — opslaan mislukt:**
1. Stap 6: netwerk- of autorisatiefout.
2. Foutbanner: "Opslaan mislukt. Probeer het opnieuw."
3. Formulier blijft open.

### UC-02 — Vrijwilliger/barcommissie markeren (zelfde flow als UC-01, stap 5)

### UC-03 — Ledentype bulksgewijs bijwerken vanuit ledenlijst

**Happy path:**
1. Beheerder navigeert naar `/dashboard/leden`.
2. De tabel toont een inline dropdown voor ledentype per rij (kolom "Ledentype").
3. Beheerder selecteert type direct in de dropdown van een rij.
4. Wijziging wordt direct opgeslagen via Supabase (optimistic update).
5. Dropdown toont nieuwe waarde.

**Foutpad — opslaan inline mislukt:**
1. Wijziging mislukt; dropdown keert terug naar vorige waarde.
2. Inline foutmelding naast de rij: "Niet opgeslagen".

### UC-04 — Toegangsrol wijzigen (bestaande rollenflow, vereenvoudigd)

**Happy path:**
1. Beheerder navigeert naar `/dashboard/rollen`.
2. Lijst toont alle gebruikers met hun huidige rol (`Lid` of `Beheerder`).
3. Beheerder kiest nieuwe rol via dropdown.
4. Bevestigingsdialoog: "Rol van [naam] wijzigen naar [Beheerder/Lid]?"
5. Beheerder bevestigt. Rol wordt opgeslagen.

**Foutpad — eigen rol wijzigen:**
- Eigen rij is geblokkeerd (disabled dropdown + tooltip).

**Foutpad — opslaan mislukt:**
- Foutbanner: "Rol wijzigen mislukt. Probeer het opnieuw."

### UC-05 — CMS-toegangsweigering (ongewijzigd)

Werkt via bestaande middleware + `is_admin()` RLS-functie (aangepast naar `role = 'beheerder'`).

---

## Acceptatiecriteria

### UC-01
- Gegeven een lid zonder ledentype, als beheerder het ledentype instelt op "Spelend lid" en opslaat, dan toont het detailscherm "Spelend lid" en is `members.lid_type = 'spelend-lid'` in de database.
- Gegeven een opgeslagen ledentype, als beheerder het type wijzigt en opslaat, dan reflecteert het scherm de nieuwe waarde.

### UC-02
- Gegeven een lid, als beheerder "Vrijwilliger" aanvinkt en opslaat, dan is `members.is_vrijwilliger = true` en toont het scherm het vinkje.
- Zelfde voor "Lid barcommissie" / `is_barcommissie`.

### UC-03
- Gegeven de ledenlijst, als beheerder de inline dropdown van een rij wijzigt, dan is de wijziging binnen 2 seconden opgeslagen zonder paginaherlaad.
- Gegeven een mislukte inline opslag, dan keert de dropdown terug naar de vorige waarde en toont een inline foutindicator.

### UC-04
- Gegeven een gebruiker met rol `lid`, als beheerder de rol wijzigt naar `beheerder` en bevestigt, dan heeft het profiel `role = 'beheerder'` en kan de gebruiker het CMS bereiken.
- Gegeven de rollenlijst, dan toont de dropdown alleen "Lid" en "Beheerder" (niet: ouder, trainer, coach, etc.).

### UC-05
- Gegeven een gebruiker met `role = 'lid'`, als diegene `/dashboard` bezoekt, dan toont het systeem "Geen toegang" en is geen dashboarddata zichtbaar.
- Gegeven een gebruiker met `role = 'beheerder'`, dan heeft diegene volledige toegang tot alle CMS-pagina's.

---

## UI Design

### Scherm: Ledendetail — nieuwe sectie "Lidmaatschap"

**Naam:** Lidmaatschapssectie  
**Route:** `/dashboard/leden/[id]` (bestaand scherm, nieuwe sectie onder "Persoonsgegevens")  
**Lay-out:** Sectiekop "Lidmaatschap" met "Bewerken"-knop rechtsboven. Read-only: drie datarijen (Ledentype, Vrijwilliger, Lid barcommissie). Edit-mode: dropdown + twee toggle-checkboxes + opslaan/annuleren.

**Componenten:**
- Sectiekop: `ds-h3`, `--color-navy`, `font-family: var(--font-display)`
- "Bewerken"-knop: `border: 1.5px solid var(--color-navy)`, `border-radius: var(--radius-md)`, `ds-label`
- Ledentype dropdown:
  - `border: 1.5px solid var(--color-mid)`, `border-radius: var(--radius-md)`, `padding: var(--space-2) var(--space-3)`
  - Opties: "(Niet ingesteld)", "Jeugdlid", "Niet-spelend lid", "Trainingslid", "Spelend lid", "Relatie"
- Vrijwilliger checkbox: `<input type="checkbox">` + `<label>` "Vrijwilliger", `ds-label`
- Barcommissie checkbox: idem, label "Lid barcommissie"
- Opslaan-knop: `background: var(--color-navy)`, `color: var(--color-white)`, `border-radius: var(--radius-md)`, `min-height: 44px`
- Annuleren-knop: `border: 1.5px solid var(--color-mid)`, `background: none`, `min-height: 44px`
- Succesbanner: `color: var(--color-success)`, `background: rgba(26,140,92,0.08)`, `border-radius: var(--radius-md)`
- Foutbanner: `color: var(--color-error)`, `background: rgba(214,60,60,0.06)`, `border-radius: var(--radius-md)`

**Read-only weergave ledentype:**
- Badge-stijl per type:
  - jeugdlid: `background: rgba(245,197,24,0.15)`, `color: #8a6c00` (geel-tint)
  - niet-spelend-lid: `background: var(--color-light)`, `color: var(--color-text)`
  - trainingslid: `background: rgba(4,107,186,0.08)`, `color: var(--color-blue)`
  - spelend-lid: `background: rgba(1,29,80,0.08)`, `color: var(--color-navy)`
  - relatie: `background: var(--color-light)`, `color: var(--color-text-2)`
  - niet ingesteld: `color: var(--color-text-2)`, italic, "—"

**Lege staat:** n.v.t. (de sectie is altijd zichtbaar)  
**Laadindicator:** n.v.t. (save state via `isSubmitting`)

---

### Scherm: Ledenlijst — inline ledentype kolom

**Naam:** Ledenlijst  
**Route:** `/dashboard/leden` (bestaand scherm, aangepaste kolom)  
**Lay-out:** De kolom "Rol" in de tabel wordt vervangen door kolom "Ledentype". Per rij: een `<select>` dropdown voor inline bewerking.

**Componenten:**
- Kolomkop "Ledentype": `ds-caption`, `--color-text-2`, uppercase
- Inline select per rij:
  - `border: 1.5px solid var(--color-mid)`, `border-radius: var(--radius-md)`, `ds-caption`, `padding: var(--space-1) var(--space-2)`
  - Opties: "(—)" + de 5 ledentypen
  - Bij opslaan: korte visuele feedback (border blauw, fade terug)
  - Bij fout: border rood + inline tekst "Niet opgeslagen"

**Lege staat:** Ongewijzigd ("Geen leden gevonden voor deze zoekopdracht.")  
**Laadindicator:** Spinner/opacity op de gewijzigde dropdown-rij

---

### Scherm: Rollen — vereenvoudigd

**Naam:** Rolbeheer  
**Route:** `/dashboard/rollen` (bestaand scherm)  
**Wijziging:** Dropdown bevat alleen "Lid" en "Beheerder". Badge-stijlen voor overige rollen verdwijnen.

**Componenten (gewijzigd):**
- Dropdown opties: `[{ value: 'lid', label: 'Lid' }, { value: 'beheerder', label: 'Beheerder' }]`
- Badge beheerder: `background: rgba(1,29,80,0.1)`, `color: var(--color-navy)`
- Badge lid: `background: var(--color-light)`, `color: var(--color-text)`

---

## Technisch Design

### Database wijzigingen

**Migratie:** `20260514000000_leden_rollen.sql`

#### 1. Nieuwe kolommen op `members`

```sql
alter table public.members
  add column lid_type text
    check (lid_type in ('jeugdlid','niet-spelend-lid','trainingslid','spelend-lid','relatie'))
    default null,
  add column is_vrijwilliger boolean not null default false,
  add column is_barcommissie boolean not null default false;
```

#### 2. Verwijder `members.role` kolom

```sql
-- Migreer eerst bestaande waarden (data-preserverend)
-- members.role had waarden: lid, ouder, trainer, coach, teammanager, commissielid, beheerder
-- Deze informatie zat ook deels in team_members.role; members.role is redundant geworden.
-- Geen migratie naar lid_type nodig: mapping is niet 1-op-1 en bestaande data is onbetrouwbaar.

alter table public.members drop column role;
```

#### 3. Vereenvoudig `profiles.role` check constraint

```sql
-- Migreer: commissielid → beheerder; alle andere niet-beheerder rollen → lid
update public.profiles
  set role = 'beheerder'
  where role = 'commissielid' and deleted_at is null;

update public.profiles
  set role = 'lid'
  where role not in ('lid', 'beheerder') and deleted_at is null;

-- Vervang check constraint
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('lid', 'beheerder'));
```

#### 4. Update `is_admin()` functie

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'beheerder'
      and deleted_at is null
  );
$$;
```

#### 5. Update `sync_log` RLS (inline check buiten is_admin)

```sql
drop policy if exists "admins_read_sync_log" on public.sync_log;
create policy "admins_read_sync_log"
  on public.sync_log for select
  to authenticated
  using (public.is_admin());
```

#### 6. Indexes

```sql
create index if not exists members_lid_type_idx on public.members (lid_type);
create index if not exists members_is_barcommissie_idx on public.members (is_barcommissie) where is_barcommissie = true;
create index if not exists members_is_vrijwilliger_idx on public.members (is_vrijwilliger) where is_vrijwilliger = true;
```

#### RLS policies — bestaande policies blijven intact via `is_admin()`

De `members_admin_all` policy gebruikt al `is_admin()`. Na het updaten van `is_admin()` werkt alles correct.

---

### Gedeelde types (`packages/shared/src/`)

**`packages/shared/src/types/app.types.ts`**

```typescript
// Vereenvoudigd van 7 naar 2 waarden
export type UserRole = 'lid' | 'beheerder';

// Nieuw
export type LidType =
  | 'jeugdlid'
  | 'niet-spelend-lid'
  | 'trainingslid'
  | 'spelend-lid'
  | 'relatie';

// Member interface: role verwijderd, lid_type/flags toegevoegd
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  sport: Sport[];
  lid_type: LidType | null;        // nieuw
  is_vrijwilliger: boolean;        // nieuw
  is_barcommissie: boolean;        // nieuw
  clubbase_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

**`packages/shared/src/schemas/member.schema.ts`**

```typescript
// userRoleSchema: vereenvoudigd
const userRoleSchema = z.enum(['lid', 'beheerder']);

// lidTypeSchema: nieuw
const lidTypeSchema = z.enum([
  'jeugdlid', 'niet-spelend-lid', 'trainingslid', 'spelend-lid', 'relatie'
]);

// memberSchema: role verwijderd, lid_type/flags toegevoegd
export const memberSchema = z.object({
  // ...bestaande velden minus role...
  lid_type: lidTypeSchema.nullable(),
  is_vrijwilliger: z.boolean(),
  is_barcommissie: z.boolean(),
});
```

**`packages/shared/src/schemas/cms.schema.ts`**

```typescript
// userRoleSchema: vereenvoudigd naar 2 waarden
// updateMemberSchema: voeg lid_type, is_vrijwilliger, is_barcommissie toe
// updateRoleSchema: new_role beperkt tot ['lid', 'beheerder']
// csvImportRowDataSchema: role veld verwijderen (members.role bestaat niet meer)
```

---

### Web CMS implementatie (`apps/web/`)

Alle wijzigingen zijn server component → client component patroon, conform bestaande architectuur.

**`apps/web/app/dashboard/leden/page.tsx`**
- Query uitbreiden met `lid_type, is_vrijwilliger, is_barcommissie`
- `role` verwijderen uit SELECT

**`apps/web/app/dashboard/leden/_components/LedenClient.tsx`**
- Kolom "Rol" vervangen door "Ledentype"
- Per rij: inline `<select>` voor `lid_type` met optimistic update via Supabase browser client
- `ROLE_LABELS` en `ROLE_BADGE_STYLES` verwijderen
- `LID_TYPE_LABELS` toevoegen

**`apps/web/app/dashboard/leden/[id]/_components/LidEditForm.tsx`**
- Nieuwe sectie "Lidmaatschap" toevoegen onder "Persoonsgegevens"
- Aparte form state voor lidmaatschapsvelden (apart `useForm` of uitbreiding bestaande)
- `updateMemberSchema` uitbreiden met `lid_type`, `is_vrijwilliger`, `is_barcommissie`
- `DataRow` voor `role` verwijderen

**`apps/web/app/dashboard/rollen/_components/RollenClient.tsx`**
- `ROLE_LABELS` beperken tot `{ lid: 'Lid', beheerder: 'Beheerder' }`
- `ROLE_OPTIONS` beperken tot `['lid', 'beheerder']`
- `badgeCommissie` stijl verwijderen

**`apps/web/app/dashboard/leden/importeren/_components/CsvImportWizard.tsx`** (controleren)
- CSV-import mapping voor `rol` kolom verwijderen of markeren als deprecated

---

### Implementatievolgorde

1. DB migratie schrijven (`supabase/migrations/20260514000000_leden_rollen.sql`)
2. `supabase db reset` + `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
3. `packages/shared/src/types/app.types.ts` — `UserRole`, `LidType`, `Member` bijwerken
4. `packages/shared/src/schemas/member.schema.ts` — schemas bijwerken
5. `packages/shared/src/schemas/cms.schema.ts` — schemas bijwerken
6. `packages/shared/src/index.ts` — exports controleren
7. `apps/web/app/dashboard/leden/page.tsx` — query bijwerken
8. `apps/web/app/dashboard/leden/_components/LedenClient.tsx` — kolom + inline edit
9. `apps/web/app/dashboard/leden/[id]/_components/LidEditForm.tsx` — nieuwe sectie
10. `apps/web/app/dashboard/rollen/_components/RollenClient.tsx` — vereenvoudigen
11. `apps/web/app/dashboard/leden/importeren/_components/CsvImportWizard.tsx` — role mapping verwijderen
12. Tests schrijven / aanpassen
13. `pnpm typecheck` + `pnpm test` + `pnpm lint`

---

## GDPR Compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | ja — ledentype, vrijwilligersstatus, barcommissie-status zijn clubadministratieve attributen | Vastleggen als gerechtvaardigd belang (clubbeheer) |
| Wettelijke grondslag | gerechtvaardigd belang (clubadministratie, bardienst-indeling) | Vastleggen in design doc |
| Data van kinderen (< 16 jaar)? | ja — jeugdleden (lid_type = 'jeugdlid') | Extra RLS: jeugdlid-data alleen voor beheerder; geen tracking |
| Bewaartermijn | soft-delete via `deleted_at`; data bewaard zolang lidmaatschap actief | Bestaand beleid van toepassing |
| Toegang beperkt via RLS? | ja — `members_admin_all` policy via `is_admin()` | Policy werkt na update van `is_admin()` |
| PII in logs vermeden? | ja — lid_type/flags zijn geen PII | Geen actie |
| Data binnen EU (Supabase EU-region)? | ja — bestaand Supabase project | Controleer regio-instelling Supabase project |
| Bewerkingsverzoek (DSAR) mogelijk? | ja — via soft-delete + admin export | Bestaand patroon van toepassing |

---

## Scenario wijzigingen

### Bestaande bestanden bijwerken

**`docs/scenarios/04-cms-toegang.md`**
- S04-H verwijderen: commissielid bestaat niet meer als rol. Vervangen door S04-H nieuw: "Gebruiker met rol 'lid' heeft geen CMS-toegang".

**`docs/scenarios/12-web-cms.md`**
- Seed data: `e2e-commissielid@e2e.scmuiden.test` account rol wijzigen naar `beheerder`
- S12-? (rollen): ROLE_OPTIONS dropdown toont nu alleen "Lid" en "Beheerder"
- Alle verwijzingen naar commissielid-badge/stijl aanpassen

### Nieuwe bestanden

**`docs/scenarios/15-leden-rollen.md`** — volledig nieuw scenario bestand

---

## Implementatieplan

- [ ] 1. Schrijf `supabase/migrations/20260514000000_leden_rollen.sql`
- [ ] 2. `supabase db reset && supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
- [ ] 3. Pas `packages/shared/src/types/app.types.ts` aan: `UserRole`, `LidType`, `Member`
- [ ] 4. Pas `packages/shared/src/schemas/member.schema.ts` aan
- [ ] 5. Pas `packages/shared/src/schemas/cms.schema.ts` aan
- [ ] 6. Controleer exports in `packages/shared/src/index.ts`
- [ ] 7. Pas `apps/web/app/dashboard/leden/page.tsx` aan (query)
- [ ] 8. Pas `apps/web/app/dashboard/leden/_components/LedenClient.tsx` aan (kolom + inline edit)
- [ ] 9. Pas `apps/web/app/dashboard/leden/[id]/_components/LidEditForm.tsx` aan (nieuwe sectie)
- [ ] 10. Pas `apps/web/app/dashboard/rollen/_components/RollenClient.tsx` aan (2 rollen)
- [ ] 11. Pas `apps/web/app/dashboard/leden/importeren/_components/CsvImportWizard.tsx` aan
- [ ] 12. Schrijf/pas tests aan: `apps/web/app/dashboard/leden/__tests__/`, `apps/web/app/dashboard/leden/[id]/__tests__/`, `apps/web/app/dashboard/rollen/__tests__/`
- [ ] 13. `pnpm typecheck`
- [ ] 14. `pnpm test`
- [ ] 15. `pnpm lint`

---

## Open vragen

Geen.

---

## SRE Notes

**Datum:** 13-05-2026

### Logging
- Alle console-statements in gewijzigde API routes loggen alleen event type en outcome — geen PII.
- Geen nieuwe edge functions geïntroduceerd.

### Monitoring
- Index `members_lid_type_idx` toegevoegd voor filterqueries op lid_type.
- Partial index `members_is_barcommissie_idx` (where is_barcommissie = true) voor bardienst-indeling.
- Partial index `members_is_vrijwilliger_idx` (where is_vrijwilliger = true).
- `is_admin()` queryt profiles via PK-index (auth.uid() = id) — geen full table scan.
- `sync_log` RLS-policy gebruikt `is_admin()` — alle policies filteren via auth.uid().

### Foutafhandeling
- LidEditForm: foutberichten in Dutch, geen Supabase-stacktraces, submit-knop disabled via isSubmitting.
- LedenClient: inline rollback bij mislukte save; dropdown disabled tijdens opslaan (savingId).
- RollenClient: Bevestigen-knop nu disabled tijdens in-flight mutatie (was ontbrekend) — opgelost.

### Beveiliging
- Geen nieuwe RLS-policies — bestaande `members_admin_all` via `is_admin()` dekt de nieuwe kolommen.
- `is_admin()` herschreven naar `role = 'beheerder'` only; alle CMS-routes en sync-route geüpdated.
- Browser-components gebruiken `createSupabaseBrowserClient` — admin client niet blootgesteld.
- `SUPABASE_SECRET_KEY` alleen in server-side API routes; nooit in NEXT_PUBLIC_ of mobile.
- LidEditForm-mutaties gevalideerd via `updateMemberSchema` (Zod + zodResolver).
- Geen bestandsuploads in deze feature.

### Bundle
- Geen nieuwe packages toegevoegd aan apps/mobile of root.

### Openstaande punten
- Geen.
