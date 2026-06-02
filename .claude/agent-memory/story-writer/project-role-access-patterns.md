---
name: project-role-access-patterns
description: Welke rollen toegang hebben tot CMS-functies — patroon gevonden in import-endpoints en CMS-middleware
metadata:
  type: project
---

**Rollen in het systeem:** `lid`, `ouder`, `trainer`, `coach`, `teammanager`, `commissielid`, `beheerder`

**CMS-toegang algemeen:** alleen `beheerder` en `commissielid` mogen het CMS-dashboard betreden (middleware-bewaking).

**Import-endpoints (leden en teams):** uitsluitend `beheerder`. `commissielid` heeft expliciet géén toegang. Endpoints retourneren HTTP 403 met body `{ "error": "Geen toegang." }` voor alle andere rollen.

**Niet-ingelogde gebruiker:** endpoints retourneren HTTP 401 met body `{ "error": "Niet ingelogd." }`.

**Why:** de leden-import-endpoint (`apps/web/app/api/cms/import/route.ts`) controleert `profile.role !== 'beheerder'` — `commissielid` wordt dus ook geblokkeerd ondanks algemene CMS-toegang.

**How to apply:** bij nieuwe CMS-endpoints: overweeg bewust of `commissielid` ook toegang nodig heeft, of dat de striktere `beheerder`-only bewaking van kracht blijft. Vermeld dit als openstaande vraag als het niet duidelijk is.
