---
name: project-design-doc-conventions
description: Naamgevings- en structuurconventies voor design- en scenariobestanden in docs/designs/ en docs/scenarios/
metadata:
  type: project
---

**Designbestanden** (`docs/designs/`):
- Bestandsnaam: `[feature-slug].md` in kebab-case (bijv. `teams-import.md`, `leden-import.md`).
- Structuur: Samenvatting → Use Cases (UC-NN formaat) → Stap-voor-stap flows → Acceptatiecriteria → Randgevallen → Buiten scope → Openstaande vragen.
- UC-nummering: UC-01 t/m UC-NN, sequentieel per bestand. Nieuwe bestanden beginnen altijd bij UC-01.

**Scenariobestanden** (`docs/scenarios/`):
- Bestandsnaam: `[feature-slug].md` (zelfde slug als het bijbehorende designbestand).
- Eén bestand per feature, meerdere scenario's per bestand gescheiden door horizontale lijnen.
- Elke scenario heeft: titel, Scenario ID (SNN-X), Feature, Rol, Gherkin-stappen, Verwacht resultaat, Verificatie via Supabase Studio.
- Gherkin is ingesloten in een ```gherkin codeblok per scenario.

**Why:** consistent gevonden in de eerste gebouwde story (teams-import). Zorg dat alle toekomstige documenten dit patroon volgen.

**How to apply:** gebruik feature-slug consequent in beide bestanden; verifieer altijd of een bestaand designbestand of scenariobestand bijgewerkt moet worden in plaats van een nieuw bestand aanmaken. Zie [[project-scenario-ids]] voor ID-reeksen.
