# Teams importeren via CSV

**Feature:** Bulk-import van teams vanuit een CSV-bestand via een meerstaps-wizard in het CMS.  
**Gebaseerd op:** het bestaande leden-importpatroon (`/dashboard/leden/importeren/`).  
**Toegang:** uitsluitend `beheerder`.

---

## Samenvatting

Een beheerder kan meerdere teams tegelijk importeren door een CSV-bestand te uploaden. De wizard doorloopt vier stappen: Upload → Kolomkoppeling → Analyse/preview → Bevestigen. Vóór het definitief opslaan ziet de beheerder welke rijen nieuw zijn, welke een conflict veroorzaken met een bestaand team, en welke ongeldig zijn. Conflicterende rijen kunnen worden overgeslagen of overschreven. Zacht-verwijderde teams worden herleefd (`deleted_at = NULL`) in plaats van opnieuw aangemaakt.

---

## Use Cases

### UC-01 — beheerder kan teams importeren via CSV zodat hij teams in bulk kan aanmaken zonder handmatig invoeren

**Succesvol pad:**

1. Beheerder opent `/dashboard/teams/importeren/`.
2. Beheerder sleept een CSV-bestand in de dropzone of klikt om te selecteren.
3. Systeem parseert het bestand clientside en toont de kolomkoppelingsstap.
4. Beheerder koppelt CSV-kolommen aan applicatievelden (`name`, `sport`, `age_category`, `season`, `federation_team_id`).
5. Beheerder klikt "Analyseren".
6. Systeem stuurt rijen naar `POST /api/cms/teams/import/analyse`; de endpoint valideert via Zod en detecteert duplicaten.
7. Systeem toont een importpreview met badges: "Nieuw", "Conflict" of "Ongeldig".
8. Beheerder controleert de preview en klikt "Importeren".
9. Systeem stuurt geselecteerde rijen naar `POST /api/cms/teams/import`.
10. Systeem toont de resultaatpagina: aantal ingevoegd, bijgewerkt, mislukt.

**Foutpad 1 — ongeldig bestand:**

1–2 gelijk aan succesvol pad.
3. Systeem detecteert dat het bestand geen `.csv`-extensie heeft of groter is dan 5 MB.
4. Systeem toont foutmelding: "Alleen CSV-bestanden zijn toegestaan." of "Bestand mag niet groter zijn dan 5 MB."
5. Wizard blijft op de uploadstap; geen verdere verwerking.

**Foutpad 2 — analyse-endpoint onbereikbaar:**

1–5 gelijk aan succesvol pad.
6. HTTP-verzoek naar `/api/cms/teams/import/analyse` mislukt (netwerk- of serverfout).
7. Systeem toont foutmelding: "Analyse mislukt. Probeer het opnieuw."
8. Wizard blijft op de koppelingstap.

**Foutpad 3 — ontbrekende verplichte velden in CSV:**

5–6 gelijk aan succesvol pad.
7. Rijen zonder `name` of zonder geldige `sport`-waarde krijgen status `invalid` met een Nederlandse foutomschrijving.
8. Ongeldige rijen worden in de preview getoond maar zijn niet selecteerbaar voor import.

---

### UC-02 — beheerder kan conflicterende teams overschrijven of overslaan zodat bestaande teamdata bijgewerkt kan worden

**Succesvol pad:**

1–7 gelijk aan UC-01 succesvol pad.
8. Preview toont één of meer rijen met badge "Conflict" en de conflictreden ("Zelfde federation_team_id" of "Zelfde naam, sport en seizoen").
9. Beheerder schakelt selectievakjes aan naast de rijen die hij wil overschrijven.
10. Beheerder klikt "Importeren"; het systeem werkt de geselecteerde conflictrijen bij en slaat niet-geselecteerde conflictrijen over.

**Foutpad 1 — beheerder importeert zonder conflicten te selecteren:**

8. Preview toont conflictrijen; beheerder selecteert geen van de conflictrijen.
9. Beheerder klikt "Importeren".
10. Systeem verwerkt alleen de "Nieuw"-rijen; conflictrijen worden stilzwijgend overgeslagen.
11. Resultaatpagina toont 0 bijgewerkte teams naast het aantal nieuwe teams.

**Foutpad 2 — databasefout bij bijwerken:**

9–10 gelijk aan succesvol pad.
11. Databasebewerking voor een specifieke rij mislukt (bv. constraint-schending).
12. Rij wordt toegevoegd aan de `failed`-lijst met Nederlandse foutmelding; overige rijen worden normaal verwerkt.

---

### UC-03 — beheerder kan een zacht-verwijderd team herleven via import zodat verwijderde teams niet als duplicaat worden behandeld

**Succesvol pad:**

1–6 gelijk aan UC-01 succesvol pad.
7. Analyse-endpoint detecteert een match op `federation_team_id` of `(name, sport, season)` met een bestaande rij waarbij `deleted_at IS NOT NULL`.
8. Rij krijgt status `conflict` met conflictreden "Team bestaat maar is verwijderd; import herstelt het team."
9. Beheerder selecteert de rij en klikt "Importeren".
10. Systeem werkt de bestaande rij bij: zet `deleted_at = NULL` en past overige velden aan.

**Foutpad 1 — beheerder slaat herleefd team over:**

9. Beheerder laat de conflictrij uitgeschakeld.
10. Rij wordt overgeslagen; `deleted_at` blijft ingevuld; team blijft verwijderd.

---

### UC-04 — beheerder wordt geblokkeerd als hij geen toegang heeft zodat onbevoegde gebruikers geen teams kunnen importeren

**Succesvol pad:**

1. Ingelogde `beheerder` opent `/dashboard/teams/importeren/`.
2. Pagina en formulier worden getoond.

**Foutpad 1 — niet ingelogd:**

1. Niet-ingelogde gebruiker navigeert naar `/dashboard/teams/importeren/`.
2. CMS-middleware detecteert ontbrekende sessie.
3. Gebruiker wordt doorgestuurd naar `/login`.

**Foutpad 2 — rol zonder toegang (`lid`, `commissielid`):**

1. Ingelogde gebruiker met rol anders dan `beheerder` benadert de analyse- of importendpoint direct (via API-call).
2. Endpoint retourneert `403 Geen toegang.`
3. Geen gegevens worden gelezen of gewijzigd.

---

## Acceptatiecriteria

### UC-01

- Gegeven een geldig CSV-bestand met koptekstrij, als de beheerder het uploadt, dan toont de wizard de kolomkoppelingsstap met automatisch herkende velden ingevuld.
- Gegeven een bestand zonder `.csv`-extensie of groter dan 5 MB, als de beheerder het selecteert, dan toont de wizard een Nederlandse foutmelding en blijft op de uploadstap.
- Gegeven een kolomkoppeling waarbij `name` en `sport` zijn toegewezen, als de beheerder "Analyseren" klikt, dan stuurt de wizard een POST naar `/api/cms/teams/import/analyse` en toont een preview met statuskleuren.
- Gegeven een preview met uitsluitend "Nieuw"-rijen, als de beheerder "Importeren" klikt, dan worden alle rijen als nieuwe rijen in de tabel `teams` opgeslagen en toont de resultaatpagina het juiste aantal ingevoegde teams.
- Gegeven een succesvolle import, als de resultaatpagina verschijnt, dan zijn de geïmporteerde teams direct zichtbaar in de teamlijst op `/dashboard/teams/`.

### UC-02

- Gegeven een CSV-rij waarvan `federation_team_id` overeenkomt met een bestaand niet-verwijderd team, als de analyse is voltooid, dan krijgt die rij status `conflict` met de melding "Zelfde federation_team_id".
- Gegeven een CSV-rij zonder `federation_team_id` waarvan `(name, sport, season)` overeenkomt met een bestaand niet-verwijderd team, als de analyse is voltooid, dan krijgt die rij status `conflict` met de melding "Zelfde naam, sport en seizoen".
- Gegeven conflictrijen in de preview, als de beheerder een conflictrij selecteert en importeert, dan wordt het bestaande team in de database bijgewerkt en is `updated_at` vernieuwd.
- Gegeven conflictrijen in de preview, als de beheerder een conflictrij niet selecteert, dan blijft het bestaande team ongewijzigd in de database.

### UC-03

- Gegeven een CSV-rij die overeenkomt met een team waarvan `deleted_at IS NOT NULL`, als de beheerder deze rij selecteert en importeert, dan is `deleted_at` na import `NULL` en zijn de overige velden bijgewerkt.
- Gegeven een zacht-verwijderd team dat herleefd is via import, als de beheerder de teamlijst bekijkt, dan is het team weer zichtbaar.

### UC-04

- Gegeven een niet-ingelogde gebruiker, als hij `/dashboard/teams/importeren/` bezoekt, dan wordt hij doorgestuurd naar `/login`.
- Gegeven een ingelogde gebruiker met rol `lid` of `commissielid`, als hij een POST stuurt naar `/api/cms/teams/import/analyse` of `/api/cms/teams/import`, dan retourneert het systeem HTTP 403 met de melding "Geen toegang.".
- Gegeven een ingelogde `beheerder`, als hij het importformulier opent, dan zijn de uploadzone en alle wizardstappen beschikbaar.

---

## Randgevallen

- Een CSV-rij met `federation_team_id` die overeenkomt met een zacht-verwijderd team én tevens een andere rij met dezelfde combinatie `(name, sport, season)` op hetzelfde actieve team: de `federation_team_id`-match heeft prioriteit.
- Een CSV-bestand zonder koptekstrij: de wizard toont "Het bestand bevat geen geldige kolomkoppen." en blokkeert verdere stappen.
- `sport`-waarde die geen `'voetbal'` of `'hockey'` is (bv. `'tennis'`): Zod-validatie faalt; rij krijgt status `invalid` met melding "Ongeldige sport waarde."
- `season`-veld ontbreekt volledig in de CSV: rij is geldig als `season` optioneel is in het schema; conflictdetectie op `(name, sport, season)` valt terug op `(name, sport, NULL)`.
- Twee rijen in dezelfde CSV met dezelfde `federation_team_id`: de tweede rij wordt door de analyse-endpoint ook als conflict gemarkeerd ten opzichte van de eerste rij die al in de database staat; rijen binnen de CSV zelf worden niet onderling vergeleken (dit is een openstaande vraag).
- Zeer grote CSV (> 500 rijen): de analyse-endpoint verwerkt rijen sequentieel; bij een time-out retourneert het endpoint een generieke foutmelding.
- `federation_team_id` is een leeg string in de CSV: behandeld als `null` (geen federatie-ID aanwezig), valt terug op `(name, sport, season)` voor conflictdetectie.

---

## Buiten scope

- Import van `team_members` (koppeling van leden aan teams) via dezelfde CSV — dit is een afzonderlijke feature.
- Import van `recurring_rules` (trainingsroosters) via CSV.
- Import door gebruikers met rol `commissielid` — alleen `beheerder` heeft toegang tot deze functionaliteit.
- Validatie of `federation_team_id` daadwerkelijk bestaat bij KNVB of KNHB — dit wordt pas relevant bij federatiekoppeling in v1.1.
- Automatische aanmaak van teamleden of activiteiten als bijproduct van de import.
- Export van teams naar CSV vanuit de CMS.
- Undo/terugdraaien van een voltooide import.
- Importeren via de mobiele app.

---

## Openstaande vragen

1. Is `season` een verplicht veld voor een team, of optioneel? De huidige database-definitie heeft `season text null`. Als het optioneel is, moeten twee teams met `season = null` toch als duplicaat worden beschouwd als `name` en `sport` overeenkomen?
2. Zijn CSV-rijen binnen één bestand onderling te vergelijken op duplicaten (intra-bestand-conflicten), of alleen ten opzichte van bestaande databaserijen?
3. Mag een `commissielid` in de toekomst ook teams importeren, of blijft dit exclusief voor `beheerder`?
4. Wat is de maximaal toegestane bestandsgrootte voor de teams-CSV? (Leden-import gebruikt 5 MB — teams hebben minder kolommen; is een lager limiet gewenst?)
5. Moet de herleving van zacht-verwijderde teams expliciet worden bevestigd met een duidelijkere melding dan een regulier conflict, of is de huidige conflictstroom voldoende?
