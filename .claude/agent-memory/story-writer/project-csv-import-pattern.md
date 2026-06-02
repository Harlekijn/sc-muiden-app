---
name: project-csv-import-pattern
description: Het leden- en teams-importpatroon in het CMS — 4-staps wizard, endpoint-structuur, duplicaatdetectie, soft delete herleving
metadata:
  type: project
---

Het CMS gebruikt een 4-staps CSV-importwizard: Upload → Kolomkoppeling → Analyse/preview → Bevestigen.

**Bestaande implementatie (leden):**
- Wizard component: `apps/web/app/dashboard/leden/importeren/_components/CsvImportWizard.tsx`
- Analyse-endpoint: `POST /api/cms/import/analyse` — Zod-validatie + duplicaatdetectie, retourneert `CsvImportRow[]`
- Import-endpoint: `POST /api/cms/import` — per-rij verwerking, Nederlandse foutmeldingen, retourneert `CsvImportResult`
- Shared types: `CsvImportRow`, `CsvImportResult` in `packages/shared/src/types/app.types.ts`

**Teams-import (gepland, nog niet gebouwd):**
- Wizard route: `apps/web/app/dashboard/teams/importeren/`
- Analyse-endpoint: `POST /api/cms/teams/import/analyse`
- Import-endpoint: `POST /api/cms/teams/import`
- Designdoc: `docs/designs/teams-import.md`
- Scenario's: `docs/scenarios/teams-import.md` (S01-A t/m S01-H)

**Duplicaatdetectie voor teams:**
1. Primaire sleutel: `federation_team_id` (indien aanwezig en niet-leeg) — globaal uniek
2. Fallback compositiesleutel: `(name, sport, season)` — inclusief `NULL` seizoen

**Soft delete herleving:** als de analysematch een rij met `deleted_at IS NOT NULL` vindt, wordt de rij als `conflict` gemarkeerd en bij import wordt `deleted_at = NULL` gezet.

**Toegang:** uitsluitend `beheerder` (de leden-import ook). `commissielid` heeft geen toegang tot import-endpoints.

**Why:** het leden-importpatroon is het referentiemodel voor alle toekomstige bulk-importfunctionaliteit in het CMS.

**How to apply:** bij een nieuwe import-feature: volg dezelfde wizard-stappen, endpoint-namen, Zod-validatie, per-rij foutafhandeling en Nederlandse foutmeldingen. Controleer altijd of `CsvImportRow`/`CsvImportResult` herbruikbaar zijn of uitgebreid moeten worden.
