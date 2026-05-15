# DRAFT: Bardienst Rooster Generator

> Status: concept — klaar voor implementatie. Het member/user datamodel is afgerond (migration 20260513172517_leden_rollen.sql).

## Context
SC Muiden heeft voor thuiswedstrijden en clubdagen medewerkers nodig achter de bar. Momenteel worden bardienst-activiteiten handmatig aangemaakt in de CMS, waarbij de admin zelf leden opzoekt en toewijst. Dit is tijdrovend en foutgevoelig bij grote aantallen leden. De nieuwe feature automatiseert dit: de admin configureert welke dagen bardienst nodig is, en het systeem genereert eerlijk een volledig rooster.

---

## Kernregels (vastgesteld met gebruiker)

| Regel | Waarde |
|---|---|
| Dienstduur | 2,5 uur per dienst |
| Bezetting per dienst | 3 personen |
| Waarvan verplicht | 1 barcommissielid |
| Eerlijke verdeling | Per seizoen — leden met minste diensten krijgen voorrang |
| Admin aanpassen | Ja, vóór publicatie |
| Leden ruilen | Nee — alleen bevestigen |

### Eligibiliteitsregels

Het datamodel gebruikt geen role-enum op `members` meer. Eligibiliteit wordt bepaald door combinaties van `lid_type` en boolean vlaggen op de `members` tabel.

**Welk leden MOGEN ingepland worden (regulier slot):**
- `lid_type IN ('spelend-lid', 'jeugdlid', 'relatie')`
- `is_vrijwilliger = false`
- `is_barcommissie = false`
- `deleted_at IS NULL`

**Verplicht slot (barcommissie):**
- `is_barcommissie = true`
- `deleted_at IS NULL`

**Uitgesloten:**
- `is_vrijwilliger = true` — trainers, coaches, teammanagers, commissieleden
- `lid_type IN ('niet-spelend-lid', 'trainingslid')` — niet-actieve leden

---

## Datamodel wijzigingen

### 1. Member tabel — geen wijzigingen nodig
De benodigde velden zijn al aanwezig na migration `20260513172517_leden_rollen.sql`:
- `lid_type text CHECK ('jeugdlid', 'niet-spelend-lid', 'trainingslid', 'spelend-lid', 'relatie')` — bepaalt of een lid regulier ingepland mag worden
- `is_barcommissie boolean` — markeert barcommissieleden (verplicht slot per dienst)
- `is_vrijwilliger boolean` — markeert vrijwilligers (uitgesloten van bardienst)
- Partial indexes `members_barcommissie_idx` en `members_vrijwilliger_idx` zijn aanwezig

`UserRole` (`'lid' | 'beheerder'`) en `LidType` in `packages/shared/src/types/app.types.ts` hoeven **niet** te worden uitgebreid.

### 2. Nieuwe tabel: `bar_day_slots`
Configureert welke dagen en tijdvensters bardienst nodig zijn.

```sql
CREATE TABLE bar_day_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  starts_at   time NOT NULL,       -- bijv. 08:00
  ends_at     time NOT NULL,       -- bijv. 18:00
  sport       text,                -- 'voetbal' | 'hockey' | NULL (club-breed)
  season      text NOT NULL,       -- bijv. '2025-2026'
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz          -- soft delete
);
```

### 3. Nieuwe kolom op `activities`
```sql
ALTER TABLE activities ADD COLUMN bar_day_slot_id uuid REFERENCES bar_day_slots(id) ON DELETE SET NULL;
```
Hiermee is traceerbaar welke activiteiten auto-gegenereerd zijn vanuit een day-slot.

### 4. Fairness tracking
Geen aparte tabel nodig. Het aantal diensten per lid per seizoen wordt afgeleid via:
```sql
SELECT member_id, COUNT(*) 
FROM bar_assignments ba
JOIN activities a ON a.id = ba.activity_id
WHERE a.starts_at BETWEEN [seizoen_start] AND [seizoen_eind]
  AND a.type = 'bardienst'
  AND a.deleted_at IS NULL
GROUP BY member_id
```

---

## Generatie-algoritme

```
Input: lijst van bar_day_slots + seizoensperiode

Voor elke day-slot:
  1. Splits tijdvenster op in diensten van 2,5 uur
     bijv. 08:00–18:00 → [08:00–10:30, 10:30–13:00, 13:00–15:30, 15:30–18:00]
  
  2. Haal alle eligibele leden op:
     - Regulier: lid_type IN ('spelend-lid', 'jeugdlid', 'relatie') AND is_vrijwilliger = false AND is_barcommissie = false, deleted_at IS NULL
     - Barcommissie: is_barcommissie = true, deleted_at IS NULL
     - Filter op sport als day-slot sport-specifiek is

  3. Tel bestaande diensten per lid dit seizoen (fairness score)

  4. Voor elke dienst:
     a. Sorteer barcommissieleden op fairness score (asc)
     b. Wijs barcommissielid #1 toe (laagste score)
     c. Sorteer reguliere leden op fairness score (asc)
     d. Wijs regulier lid #1 en #2 toe (laagste scores)
     e. Verhoog fairness score in geheugen (voor volgende diensten in dezelfde run)

Output: preview van [activity, [member_id × 3]] per dienst (nog NIET opgeslagen)
```

**Randgevallen:**
- Te weinig barcommissieleden → foutmelding vóór generatie ("Onvoldoende barcommissieleden beschikbaar")
- Te weinig reguliere leden → foutmelding met aantal
- Iemand is al ingepland op dezelfde dag (andere dienst) → overslaan bij toewijzing

---

## CMS — nieuwe pagina's

### `/dashboard/bardienst/`
Overzichtspagina met twee tabs:
- **Day slots**: beheer van de te bedienen dagen
- **Rooster**: het gegenereerde rooster, gegroepeerd per dag

### `/dashboard/bardienst/day-slots/nieuw`
Formulier: datum, begintijd, eindtijd, sport (optioneel), seizoen, notities.

### `/dashboard/bardienst/genereren`
Wizard in 3 stappen:
1. **Selectie** — kies seizoen + welke day-slots meegenomen worden
2. **Preview** — tabel per dag met alle diensten en toegewezen leden. Admin kan hier handmatig leden omwisselen via een zoekdropdown per slot.
3. **Publiceren** — bevestiging → systeem maakt `activities` + `bar_assignments` aan → push notificatie naar betrokken leden

### `/dashboard/bardienst/rooster`
Na publicatie: read-only overzicht per dag, met per dienst de drie ingeplande leden en hun bevestigingsstatus. Admin kan nog altijd individuele toewijzingen wijzigen (redirect naar bestaand BardienstForm flow).

---

## Mobile — impact

Geen nieuwe schermen nodig. De gegenereerde diensten zijn gewone `bardienst`-activiteiten en verschijnen automatisch in:
- **Agenda tab** — op de juiste datum
- **Activiteit detail** — met bevestigknop (bestaande BardienstSectie component)
- **Push notificatie** — bij publicatie ("Je bent ingepland voor bardienst op [datum]")

---

## Roadmap positie

Dit wordt **Phase 8 — Bardienst Rooster** toegevoegd na Phase 7 (Beta & Polish). Schatting: **2 weken**.

Subtaken voor in de roadmap:
- [x] DB: `lid_type`, `is_vrijwilliger`, `is_barcommissie` op `members` (gereed — migration 20260513172517)
- [ ] DB: `bar_day_slots` tabel + `bar_day_slot_id` kolom op activities
- [ ] CMS: day-slot beheer (lijst + formulier)
- [ ] CMS: rooster generatie-wizard (selectie → preview → publiceren)
- [ ] CMS: generatie-algoritme (eerlijke verdeling, randgevallen)
- [ ] CMS: gepubliceerd rooster overzicht
- [ ] Push notificatie bij publicatie

---

## Buiten scope

- Leden kunnen **niet** onderling ruilen via de app
- Geen herhaalpatronen voor day-slots (elk slot wordt handmatig aangemaakt)
- Geen export van het rooster (PDF/CSV) — V2
- Geen automatische re-generatie als leden uitvallen — admin past handmatig aan

---

## Kritieke bestanden (bij implementatie)

| Bestand | Wijziging |
|---|---|
| `supabase/migrations/` | Nieuwe migratie: `bar_day_slots` tabel + `bar_day_slot_id` kolom op `activities` |
| `packages/shared/src/types/app.types.ts` | `BarDaySlot` type toevoegen (UserRole/LidType ongewijzigd) |
| `packages/shared/src/schemas/cms.schema.ts` | `createBarDaySlotSchema` toevoegen |
| `apps/web/app/dashboard/bardienst/` | Nieuwe pagina's (day-slots, genereren, rooster) |
| `apps/web/app/api/cms/bardienst/` | API routes voor day-slots CRUD + generatie |
| `docs/ROADMAP_V1.md` | Phase 8 toevoegen |

---

## Verificatie

1. Admin maakt 2 day-slots aan (bijv. zaterdag 08:00–13:00 en zondag 10:00–15:30)
2. Admin opent generatie-wizard, selecteert beide slots, klikt "Genereer preview"
3. Preview toont correcte dienstindeling (2,5u per dienst, 3 personen, 1 barcommissielid)
4. Admin wisselt handmatig één persoon om in de preview
5. Admin publiceert → activiteiten + toewijzingen verschijnen in DB
6. Betrokken leden ontvangen push notificatie
7. Lid opent agenda → bardienst activiteit zichtbaar op juiste datum → "Bevestigen" werkt
8. Na tweede generatierun: leden die vorige keer meer diensten hadden staan lager in prioriteit
