# web-cms
<!-- generated: 2026-05-11 -->

Web CMS — volledige beheerdersinterface voor SC Muiden. Fase 5 van de V1-roadmap.

---

## Gebruiksscenario's (Use Cases)

`UC-01` — Beheerder/commissielid kan een dashboardoverzicht zien zodat hij in één oogopslag de clubstatus begrijpt.

`UC-02` — Beheerder/commissielid kan de ledenlijst doorzoeken en filteren zodat hij snel een specifiek lid vindt.

`UC-03` — Beheerder/commissielid kan een liddetail bekijken en bewerken zodat leden actuele gegevens hebben in de app.

`UC-04` — Beheerder kan leden importeren via ClubBase-CSV zodat de ledenadministratie gesynchroniseerd blijft.

`UC-05` — Beheerder kan importconflicten per rij oplossen zodat bestaande data niet onbedoeld wordt overschreven.

`UC-06` — Beheerder/commissielid kan teams aanmaken en bewerken zodat de clubstructuur correct is weergegeven.

`UC-07` — Beheerder/commissielid kan leden aan een team koppelen of verwijderen zodat activiteiten juist worden toegewezen.

`UC-08` — Beheerder/commissielid kan een training aanmaken (eenmalig of wekelijks terugkerend) zodat leden het schema zien in hun agenda.

`UC-09` — Beheerder/commissielid kan een clubactiviteit aanmaken zodat leden dit zien in hun agenda.

`UC-10` — Beheerder/commissielid kan een bardienst aanmaken en leden toewijzen zodat barverplichtingen worden bijgehouden.

`UC-11` — Beheerder/commissielid kan een activiteit bewerken of annuleren (soft-delete) zodat fouten kunnen worden gecorrigeerd.

`UC-12` — Beheerder/commissielid kan wedstrijden inzien (read-only) zodat hij de federatiedata kan controleren.

`UC-13` — Beheerder (niet commissielid) kan de rol van een lidaccount toewijzen of intrekken zodat toegangsrechten correct zijn.

---

## Gebruikersstromen (User Flows)

### UC-01 — Dashboard overzicht
**Happy path:**
1. Beheerder logt in op `/login`.
2. Redirect naar `/dashboard`.
3. Pagina laadt: telkaarten (leden, teams, aankomende activiteiten), 5 meest recente activiteiten.

**Foutpad F1 — DB-fout:**
3a. Query mislukt → toon Dutch foutbanner: "Gegevens konden niet worden geladen. Probeer de pagina te vernieuwen."

---

### UC-02 — Ledenlijst doorzoeken
**Happy path:**
1. Navigeer naar `/dashboard/leden`.
2. Ledenlijst laadt (server-rendered, paginatie 50/pagina).
3. Typ in zoekveld → client-side filter op voornaam + achternaam + e-mail.
4. Klik sportfilter "Voetbal" / "Hockey" / "Beide" → lijst filtert.
5. Klik op een rij → navigeer naar `/dashboard/leden/[id]`.

**Foutpad F1 — geen resultaten:**
4a. Leeg zoekresultaat → toon: "Geen leden gevonden voor deze zoekopdracht."

---

### UC-03 — Liddetail bekijken en bewerken
**Happy path:**
1. Beheerder opent `/dashboard/leden/[id]`.
2. Lidgegevens worden server-side geladen.
3. Klik "Bewerken" → formulier wordt bewerkbaar.
4. Wijzig velden, klik "Opslaan" → PATCH naar Supabase → toast "Wijzigingen opgeslagen".
5. Klik "Annuleren" → formulier terug naar read-only zonder opslaan.

**Foutpad F1 — validatiefout:**
4a. Verplicht veld leeg → inline foutmelding onder het veld.

**Foutpad F2 — DB-fout:**
4b. Supabase-fout → toast "Opslaan mislukt. Probeer het opnieuw."

---

### UC-04 & UC-05 — CSV-import
**Happy path:**
1. Navigeer naar `/dashboard/leden/importeren`.
2. Upload CSV-bestand via drag-and-drop of bestandsselectie.
3. Systeem parseert bestand; toon kolomkoppelingstabel (ClubBase-kolomnaam → applicatieveld).
4. Beheerder bevestigt of corrigeert de koppeling.
5. Klik "Analyseren" → systeem vergelijkt rijen met bestaande `members` op `email + first_name + last_name + birth_date`.
6. Preview-tabel toont:
   - Groene rijen: nieuw (geen conflict).
   - Gele rijen: conflict gedetecteerd (bestaand lid gevonden) — standaard **niet aangevinkt**.
7. Beheerder vinkt conflictrijen aan die hij wil overschrijven.
8. Klik "Importeren" → nieuwe rijen ingevoegd, aangevinkte conflicten bijgewerkt.
9. Succesbericht: "X nieuwe leden toegevoegd. Y leden bijgewerkt."

**Foutpad F1 — ongeldig bestand:**
2a. Bestand is geen CSV of groter dan 5 MB → fout: "Alleen CSV-bestanden tot 5 MB zijn toegestaan."

**Foutpad F2 — ongeldige rijen:**
6a. Rijen met ontbrekende verplichte kolommen (voornaam, achternaam) worden als **ongeldig** gemarkeerd (rood), standaard overgeslagen en kunnen niet worden geselecteerd.

**Foutpad F3 — gedeeltelijke mislukking:**
8a. Sommige rijen mislukken in de DB → toon: "Import gedeeltelijk geslaagd: X toegevoegd, Y mislukt." Geef de mislukte rijen terug als download.

---

### UC-06 — Team aanmaken/bewerken
**Happy path:**
1. Navigeer naar `/dashboard/teams`.
2. Klik "Nieuw team" → navigeer naar `/dashboard/teams/nieuw`.
3. Vul naam, sport, leeftijdscategorie, seizoen, federation_team_id in.
4. Klik "Opslaan" → insert → redirect naar `/dashboard/teams/[id]`.

**Bewerken happy path:**
1. Open `/dashboard/teams/[id]`.
2. Klik "Bewerken" → bewerkformulier.
3. Wijzig velden → "Opslaan" → toast "Team bijgewerkt".

**Foutpad F1 — naam al in gebruik voor dezelfde sport:**
4a. DB-constraint of appvalidatie: "Een team met deze naam bestaat al voor dit seizoen en deze sport."

---

### UC-07 — Leden aan team koppelen
**Happy path:**
1. Open `/dashboard/teams/[id]` → tabblad "Leden".
2. Klik "Lid toevoegen" → zoekveld opent (live search op members).
3. Selecteer lid, kies rol (speler / trainer / coach / teammanager) en optioneel rugnummer.
4. Klik "Toevoegen" → insert in `team_members`.
5. Lid verschijnt direct in de lijst.

**Verwijderen happy path:**
5a. Klik prullenbak-icoon naast lid → bevestigingsdialoog → soft-delete (`deleted_at`) in `team_members`.

**Foutpad F1 — lid al in team:**
4a. Toon inline: "Dit lid is al gekoppeld aan dit team."

---

### UC-08 — Training aanmaken
**Happy path (eenmalig):**
1. Navigeer naar `/dashboard/activiteiten/nieuw?type=training`.
2. Selecteer team, datum, begintijd, eindtijd, locatie, notities.
3. Schakelaar "Wekelijks herhalen": uit.
4. Klik "Opslaan" → insert `activities` (type=training, geen recurring_rule_id) → redirect naar lijst.

**Happy path (terugkerend):**
1–2. Zelfde als boven.
3. Schakelaar "Wekelijks herhalen": aan → toon velden: geldig van, geldig tot.
4. Klik "Opslaan" → insert `recurring_rules` + genereer `activities`-rijen per week binnen het geldig-van/tot-bereik, allemaal met `recurring_rule_id`.
5. Toast: "Terugkerende training aangemaakt: X sessies gegenereerd."

**Foutpad F1 — geen team geselecteerd:**
2a. Inline: "Selecteer een team voor deze training."

---

### UC-09 — Clubactiviteit aanmaken
**Happy path:**
1. Navigeer naar `/dashboard/activiteiten/nieuw?type=clubactiviteit`.
2. Vul titel, datum, begintijd, eindtijd, locatie, sport (voetbal/hockey/beide/geen filter), notities in.
3. Geen teamkoppeling vereist.
4. Klik "Opslaan" → insert `activities` → redirect naar lijst.

---

### UC-10 — Bardienst aanmaken
**Happy path:**
1. Navigeer naar `/dashboard/activiteiten/nieuw?type=bardienst`.
2. Vul datum, begintijd, eindtijd, locatie, sport, notities in.
3. Sectie "Toegewezen leden": zoekveld → selecteer één of meer leden → voeg toe aan lijst.
4. Klik "Opslaan" → insert `activities` + insert `bar_assignments` per geselecteerd lid.

**Foutpad F1 — geen leden toegewezen:**
3a. Waarschuwing (niet blokkerend): "Je hebt nog geen leden toegewezen aan deze bardienst."

---

### UC-11 — Activiteit bewerken/annuleren
**Happy path (bewerken):**
1. Open `/dashboard/activiteiten/[id]/bewerken`.
2. Wijzig velden → "Opslaan".
3. Voor terugkerende training: keuze "Alleen deze sessie" of "Alle toekomstige sessies".

**Happy path (annuleren):**
1. Open activiteitenlijst of detailpagina.
2. Klik "Annuleren" → bevestigingsdialoog: "Weet je zeker dat je deze activiteit wilt annuleren? Deelnemers ontvangen geen automatische notificatie."
3. Bevestig → `deleted_at = now()` in `activities`.

**Foutpad F1 — activiteit is een wedstrijd:**
De bewerkknop is niet aanwezig voor `type = 'wedstrijd'`. Wedstrijden zijn read-only.

---

### UC-12 — Wedstrijden inzien
**Happy path:**
1. Open `/dashboard/activiteiten` → filter op type "Wedstrijd".
2. Wedstrijden worden getoond in de lijst met status-badge (GEPLAND / LIVE / GESPEELD).
3. Klik op rij → detailweergave met score, thuisteam, uitteam, datum, locatie.
4. Geen bewerkknop; label "Via federatiesync" zichtbaar.

---

### UC-13 — Rolbeheer
**Happy path:**
1. Open `/dashboard/rollen` (beheerder only — commissielid ziet "Geen toegang" op deze pagina).
2. Lijst van alle profielen met huidige rol.
3. Klik rol-dropdown naast een profiel → selecteer nieuwe rol → confirm dialog.
4. Update `profiles.role` → toast "Rol bijgewerkt".

**Foutpad F1 — eigen rol wijzigen:**
3a. Kan niet: beheerder kan zijn eigen rol niet wijzigen. Dropdown disabled + tooltip: "Je kunt je eigen rol niet wijzigen."

**Foutpad F2 — commissielid probeert /rollen te openen:**
1a. Pagina toont `<GeenToegang />`: "Deze pagina is alleen toegankelijk voor beheerders."

---

## Acceptatiecriteria

### UC-01
- Gegeven een beheerder op `/dashboard`, als de pagina laadt, dan zijn 4 telkaarten zichtbaar: totaal leden, totaal teams, aankomende activiteiten (komende 7 dagen), openstaande gezinsverzoeken.
- Gegeven de DB is bereikbaar, dan worden alle telkaarten gevuld met actuele getallen.

### UC-02
- Gegeven een ledenlijst met 100 leden, als de beheerder "de vries" typt, dan worden alleen leden getoond waarvan voornaam, achternaam of e-mail de zoekopdracht bevat.
- Gegeven sportfilter "voetbal", dan worden alleen leden met `sport` bevat "voetbal" getoond.

### UC-03
- Gegeven een liddetailpagina, als de beheerder een lege achternaam opslaat, dan verschijnt: "Achternaam is verplicht" onder het veld.
- Gegeven een succesvolle opslag, dan is `updated_at` in de DB bijgewerkt.

### UC-04 & UC-05
- Gegeven een geldig CSV-bestand, dan worden duplicate-rijen (zelfde e-mail of naam+geboortedatum) geel gemarkeerd en standaard niet aangevinkt.
- Gegeven aangevinkte conflicten bij import, dan worden de corresponderende `members`-rijen bijgewerkt.
- Gegeven ongeldige rijen (ontbrekende verplichte kolommen), dan worden die rijen rood gemarkeerd en kunnen niet worden geselecteerd.

### UC-06
- Gegeven een nieuw team aangemaakt, dan is het zichtbaar in de teamslijst zonder pagina te vernieuwen.
- Gegeven `federation_team_id` ingevuld, dan is dit veld opgeslagen in de DB en zichtbaar in het detailformulier.

### UC-07
- Gegeven een lid toegevoegd aan een team, dan verschijnt het lid in de teamledenlijst.
- Gegeven een lid verwijderd (soft-delete), dan is `team_members.deleted_at` gevuld en het lid niet meer zichtbaar in de lijst.

### UC-08
- Gegeven een terugkerende training aangemaakt met looptijd 4 weken op dinsdag, dan zijn 4 `activities`-rijen aangemaakt, allemaal gelinkt aan dezelfde `recurring_rule_id`.
- Gegeven een eenmalige training, dan is `recurring_rule_id` null.

### UC-09 / UC-10
- Gegeven een bardienst opgeslagen met 2 toegewezen leden, dan zijn 2 `bar_assignments`-rijen aangemaakt.
- Gegeven een clubactiviteit zonder teamkoppeling, dan is `team_id` null en de activiteit zichtbaar in de lijst.

### UC-11
- Gegeven een activiteit geannuleerd, dan is `deleted_at` gevuld in de DB en de activiteit verdwenen uit de lijst.
- Gegeven een wedstrijd in de lijst, dan is de bewerkknop niet aanwezig.

### UC-13
- Gegeven commissielid opent `/dashboard/rollen`, dan toont de pagina `<GeenToegang />`.
- Gegeven beheerder wijzigt de rol van een lid naar `trainer`, dan is `profiles.role = 'trainer'` in de DB.
- Gegeven beheerder probeert eigen rol te wijzigen, dan is de dropdown disabled.

---

## UI / Grafisch ontwerp

### 1. Dashboard Overzicht — `/dashboard`

**Lay-out:**
- Paginatitel: "Dashboard" (ds-h2, `--color-navy`)
- 4 telkaarten in een 2×2-grid op desktop (1-kolom op mobiel), gap `--space-6`
- Sectie "Aankomende activiteiten" eronder: tabel of lijst van de 5 eerstvolgende activiteiten

**Telkaart-component:**
- Achtergrond: `--color-white`, border `1px solid --color-mid`, `--radius-lg`, `--shadow-card`
- Boven: label `--color-text-2`, ds-label, ALL CAPS
- Getal: ds-h1 lettergrootte (48px), Barlow Condensed, `--color-navy`
- Lucide-icon rechtsonder: 24px, `--color-blue`, outline only
  - Leden: `<Users />`
  - Teams: `<ShieldCheck />`
  - Aankomende activiteiten: `<Calendar />`
  - Gezinsverzoeken: `<Clock />`
- Skeleton: shimmer-blok in `--color-mid`

**Activiteitenlijst (preview):**
- Kolommen: datum, type-badge, team, titel
- Type-badge: pill met `--radius-pill`, tekst ds-label
  - training: achtergrond `--color-light`, tekst `--color-text`
  - bardienst: achtergrond `rgba(245,197,24,0.15)`, tekst `--color-warning`
  - clubactiviteit: achtergrond `rgba(4,107,186,0.12)`, tekst `--color-blue`
  - wedstrijd: achtergrond `--color-navy`, tekst `--color-white`
- Lege staat: "Geen aankomende activiteiten."
- Laadindicator: skeletten van 5 rijen

---

### 2. Ledenlijst — `/dashboard/leden`

**Lay-out:**
- Paginatitel: "Leden" (ds-h2, `--color-navy`)
- Subheader: aantal leden weergegeven (bijv. "47 leden")
- Actiebalk (horizontaal, gap `--space-3`):
  - Zoekveld: icoon `<Search />` 16px links, placeholder "Zoek op naam of e-mail", `--radius-md`, border `1.5px solid --color-mid`
  - Sportfilter: 3 knoppen "Alle" / "Voetbal" / "Hockey", actief: background `--color-navy`, tekst `--color-white`; inactief: background `--color-light`, tekst `--color-text`
  - Knop "Importeren": rechts uitgelijnd, icoon `<Upload />`, `--color-blue` border + tekst (outline variant)
- Tabel:
  - Kolommen: naam (sorteerbaar), sport, rol, e-mail, acties
  - Rij: horizontale padding `--space-4`, `--space-3` verticaal, border-bottom `1px solid --color-mid`
  - Naam: ds-body, `--color-text`, bold
  - Rol-badge: pill, `--radius-pill`, ds-caption
    - lid: `--color-light` achtergrond
    - beheerder: `--color-navy` achtergrond, wit
    - commissielid: `--color-blue` achtergrond, wit
    - trainer/coach/teammanager: `rgba(4,107,186,0.1)` achtergrond, `--color-blue` tekst
  - Actiescell: `<ChevronRight />` 16px, `--color-text-2`
  - Hover rij: background `--color-light`
- Paginatie: "Vorige" / "Volgende" knoppen + "1 van 5" label
- Lege staat: "Geen leden gevonden voor deze zoekopdracht."
- Laadindicator: 10 skeletsrijen

---

### 3. Liddetail — `/dashboard/leden/[id]`

**Lay-out:**
- Broodkruimel: "Leden > [naam]" (ds-caption, `--color-text-2`)
- Paginatitel: volledige naam (ds-h2, `--color-navy`)
- Sectie 1: "Persoonsgegevens"
  - Velden: voornaam, achternaam, geboortedatum, e-mail, telefoon
  - Sportbadges (lees-only): voetbal / hockey
  - Rol (read-only in dit scherm; wijzigen via /rollen)
  - ClubBase-ID (read-only, italic, `--color-text-2`)
- Sectie 2: "Gekoppeld account"
  - Toon het profiel-e-mailadres indien de member gekoppeld is aan een profiel (via `profiles.member_id`)
  - Anders: "Geen app-account gekoppeld."
- Sectie 3: "Teams"
  - Lijst van teams waaraan dit lid is gekoppeld (via `team_members`), met rol en rugnummer
- Bewerkknop: rechtsboven, "Bewerken", icoon `<Pencil />`, solid primary button

**Bewerkmodus:**
- Velden worden bewerkbaar (controlled React Hook Form)
- Inline validatiefouten in `--color-error`, ds-caption
- Opslaan-knop (disabled tijdens submit) + Annuleer-knop
- Laadindicator: spinner op de knop

**Foutmeldingen:**
- Veldfouten: onder het veld, `--color-error`
- API-fout: rode banner bovenaan sectie

---

### 4. CSV-import — `/dashboard/leden/importeren`

**Lay-out:**
- Paginatitel: "Leden importeren" (ds-h2)
- Stap 1 — Bestand uploaden:
  - Drop zone: gestippelde border `2px dashed --color-mid`, `--radius-lg`, padding `--space-12`
  - Icoon `<Upload />` 32px gecentreerd, `--color-blue`
  - Tekst: "Sleep een CSV-bestand hierheen of klik om te selecteren" (ds-body, `--color-text-2`)
  - Subtekst: "Maximaal 5 MB. Komma-gescheiden." (ds-caption)
  - Na selectie: bestandsnaam zichtbaar + "Verwijder" link

- Stap 2 — Kolomkoppeling (zichtbaar nadat bestand is geüpload):
  - Tabel: linkerkolom = CSV-kolomnaam, rechterkolom = dropdown applicatieveld
  - Applicatievelden: voornaam, achternaam, geboortedatum, e-mail, telefoon, sport, rol, clubbase_id, (overslaan)
  - Standaard auto-mapping op basis van kolomnamen (case-insensitive match)
  - Knop "Analyseren" (primary, `--color-navy`)

- Stap 3 — Preview (zichtbaar na "Analyseren"):
  - Samenvatting balk: "X nieuwe leden · Y conflicten · Z ongeldige rijen"
  - Tabel met rijen:
    - Groen (nieuw): achtergrond `rgba(26,140,92,0.06)`, tekst normaal
    - Geel (conflict): achtergrond `rgba(245,197,24,0.10)`, checkbox links (standaard UIT), conflict-tooltip: "Bestaand lid gevonden op [criterium]"
    - Rood (ongeldig): achtergrond `rgba(214,60,60,0.08)`, checkbox disabled, foutmelding in rij
  - "Selecteer alle conflicten" checkbox in header
  - Knop "Importeren" (primary) + "Opnieuw beginnen" (secondary)
  - Laadindicator tijdens import: spinner op knop, button disabled

---

### 5. Teamslijst — `/dashboard/teams`

**Lay-out:**
- Paginatitel: "Teams" (ds-h2)
- Actiebalk: sportfilter (Alle/Voetbal/Hockey) + knop "Nieuw team" (primary, icoon `<Plus />`)
- Tabel:
  - Kolommen: naam, sport-badge, leeftijdscategorie, seizoen, leden-count, acties
  - Acties: `<ChevronRight />` — navigeert naar teamdetail
- Lege staat: "Er zijn nog geen teams aangemaakt."
- Laadindicator: 5 skeletsrijen

---

### 6. Teamdetail — `/dashboard/teams/[id]`

**Lay-out:**
- Broodkruimel: "Teams > [naam]"
- Paginatitel: teamnaam (ds-h2)
- Twee tabbladen: "Gegevens" | "Leden"

**Tabblad Gegevens:**
- Formulier: naam, sport (select), leeftijdscategorie, seizoen, federation_team_id
- Bewerkknop + Opslaan/Annuleer (zelfde patroon als liddetail)
- Dangerzone (onderin): "Team verwijderen" → soft-delete knop, `--color-error` border

**Tabblad Leden:**
- Tabel: voornaam + achternaam, rol-badge (speler/trainer/coach/teammanager), rugnummer, acties (verwijder `<Trash2 />`)
- Bovenaan: "Lid toevoegen" → inline zoekpanel
  - Zoekveld + resultatenlijst (live, 5 items max)
  - Per resultaat: naam, sport-badge, selecteerknop
  - Rol-select + rugnummer-input na selectie
  - Toevoegen-knop
- Bevestigingsdialoog voor verwijderen: "Weet je zeker dat je [naam] uit dit team wilt verwijderen?"

---

### 7. Team aanmaken — `/dashboard/teams/nieuw`

**Lay-out:**
- Paginatitel: "Nieuw team" (ds-h2)
- Formulier:
  - Naam (verplicht)
  - Sport: radio-group Voetbal / Hockey (verplicht)
  - Leeftijdscategorie (optioneel)
  - Seizoen (optioneel, bijv. "2025-2026")
  - Federation Team ID (optioneel, ds-caption helptext: "KNVB of KNHB team-ID voor automatische synchronisatie")
- Knoppen: "Aanmaken" (primary) + "Annuleren" (secondary, terug naar lijst)

---

### 8. Activiteitenlijst — `/dashboard/activiteiten`

**Lay-out:**
- Paginatitel: "Activiteiten" (ds-h2)
- Filterbalk:
  - Type-filter: Alle / Training / Clubactiviteit / Bardienst / Wedstrijd
  - Datumfilter: "Aankomend" / "Verleden" / datumselectie (optioneel)
  - Sport-filter: Alle / Voetbal / Hockey
- Knop "Nieuwe activiteit" → dropdown: Training / Clubactiviteit / Bardienst (Wedstrijden niet te kiezen)
- Tabel:
  - Kolommen: datum, tijd, type-badge, sport-badge, team, titel, acties
  - Wedstrijden: actiecel toont `<Lock />` 16px + tooltip "Via federatiesync"
  - Niet-wedstrijden: actiecel toont `<Pencil />` + `<XCircle />` (annuleren)
  - Geannuleerde activiteiten niet zichtbaar (deleted_at filter)
- Lege staat: "Geen activiteiten gevonden voor de gekozen filters."
- Laadindicator: 10 skeletsrijen

---

### 9. Activiteit aanmaken — `/dashboard/activiteiten/nieuw?type=[training|clubactiviteit|bardienst]`

**Gedeelde velden (alle types):**
- Datum (verplicht)
- Begintijd (verplicht, 24h, bijv. 19:00)
- Eindtijd (optioneel)
- Locatie (optioneel)
- Notities (optioneel)

**Extra velden per type:**

*Training:*
- Team (verplicht, select)
- Schakelaar "Wekelijks herhalen":
  - Uit (default): eenmalige training
  - Aan: toont "Geldig van" (pre-filled met datum) + "Geldig tot" (verplicht)
  - Helptext: "Er worden wekelijks activiteiten aangemaakt op dezelfde dag."

*Clubactiviteit:*
- Titel (verplicht)
- Sport-filter: Voetbal / Hockey / Beide / Geen filter (radio-group)

*Bardienst:*
- Sport-filter: Voetbal / Hockey / Beide
- Sectie "Leden toewijzen":
  - Zoekveld + live resultaten
  - Toegevoegde leden als tags met verwijderknop `<X />`
  - Niet-blokkerend als er geen leden zijn (waarschuwing)

**Knoppen:** "Opslaan" (primary) + "Annuleren" (secondary)

---

### 10. Activiteit bewerken — `/dashboard/activiteiten/[id]/bewerken`

- Zelfde formulier als aanmaken, pre-filled met bestaande waarden
- Voor terugkerende trainingen: extra keuze bovenin:
  - Radio: "Alleen deze sessie" | "Alle toekomstige sessies"
  - "Alle toekomstige sessies": past `recurring_rule` aan en regenereert toekomstige activities
- Sectie "Activiteit annuleren" onderin (rood, uitgeklapt met knop)

---

### 11. Rolbeheer — `/dashboard/rollen`

**Toegang:** uitsluitend `beheerder` — commissielid ziet `<GeenToegang />`.

**Lay-out:**
- Paginatitel: "Rollen" (ds-h2)
- Beschrijving: "Wijs rollen toe aan app-accounts. Rollen bepalen welke functies beschikbaar zijn." (ds-body, `--color-text-2`)
- Zoekveld: filter op naam of e-mail
- Tabel:
  - Kolommen: naam, e-mail, huidige rol, acties
  - Rol-dropdown per rij (select-element, alle 7 rollen)
  - Eigen rij (auth.uid() === profile.id): dropdown disabled + `--color-text-2`
  - Bevestigingsdialoog na selectie: "Wil je de rol van [naam] wijzigen naar [nieuwe rol]?"
- Lege staat: "Geen accounts gevonden."
- Laadindicator: 8 skeletsrijen

---

## Technisch ontwerp

### Database wijzigingen

**Migratie:** `YYYYMMDDHHMMSS_web_cms_rls_fix.sql`

1. Fix RLS-recursieprobleem op `recurring_rules`: vervang inline admin-check door `is_admin()`:
   ```sql
   drop policy if exists "staff_manage_recurring_rules" on public.recurring_rules;
   create policy "admins_manage_recurring_rules"
     on public.recurring_rules for all
     to authenticated
     using (public.is_admin());
   ```

2. RLS `profiles` voor CMS: beheerder moet alle profielen kunnen updaten (voor rolwijziging):
   ```sql
   create policy "admins_update_profiles"
     on public.profiles for update
     to authenticated
     using (public.is_admin())
     with check (public.is_admin());
   ```

3. Index `activities.starts_at` (als nog niet bestaat):
   ```sql
   create index if not exists activities_starts_at_idx on public.activities(starts_at);
   ```

**Geen nieuwe tabellen** — alle benodigde tabellen zijn al aanwezig.

---

### Gedeelde types (`packages/shared/src/`)

**Nieuwe Zod-schemas in `packages/shared/src/schemas/`:**

*`cms.schema.ts`* (nieuw bestand):
```typescript
// Teamformulier
createTeamSchema: naam (min 1), sport (voetbal|hockey), age_category?, season?, federation_team_id?
updateTeamSchema: zelfde velden, allemaal optional

// Activiteitformulieren
createTrainingSchema: team_id, starts_at, ends_at?, location?, notes?, is_recurring, valid_from?, valid_until?
createClubactiviteitSchema: title, starts_at, ends_at?, location?, notes?, sport?
createBardienstSchema: starts_at, ends_at?, location?, notes?, sport?, assigned_member_ids[]

// Lidbewerken
updateMemberSchema: first_name, last_name, birth_date?, email?, phone?, sport[]

// Rolbeheer
updateRoleSchema: profile_id (uuid), new_role (UserRole)

// CSV-import
csvColumnMappingSchema: per veld mapping naar applicationveld
csvImportRowSchema: parsed + validated rij
```

Alle `.message()` strings in het Nederlands.

**Nieuwe TypeScript types in `packages/shared/src/types/app.types.ts`:**
```typescript
interface TeamWithMemberCount extends Team {
  member_count: number;
}

interface TeamMemberWithMember extends TeamMember {
  member: Pick<Member, 'id' | 'first_name' | 'last_name' | 'sport'>;
}

interface ActivityWithTeam extends Activity {
  team: Pick<Team, 'id' | 'name' | 'sport'> | null;
}

interface CsvImportRow {
  index: number;
  data: Partial<Member>;
  status: 'new' | 'conflict' | 'invalid';
  conflictMemberId?: string;
  conflictReason?: string;
  errors?: string[];
}

interface CsvImportResult {
  inserted: number;
  updated: number;
  failed: CsvImportRow[];
}

interface DashboardStats {
  totalMembers: number;
  totalTeams: number;
  upcomingActivities: number;
  pendingFamilyRequests: number;
}
```

---

### Web CMS implementatie (`apps/web/`)

**Server components (data ophalen via Supabase server client):**

| Route | Type | Beslissing |
|---|---|---|
| `/dashboard/page.tsx` | Server | Stats via count queries, geen client state |
| `/dashboard/leden/page.tsx` | Server | Volledige ledenlijst laden, client-side filtering |
| `/dashboard/leden/[id]/page.tsx` | Server | Liddata laden; edit-formulier als client component |
| `/dashboard/leden/importeren/page.tsx` | Client | File upload, multi-stap wizard |
| `/dashboard/teams/page.tsx` | Server | Teamslijst met member counts |
| `/dashboard/teams/[id]/page.tsx` | Server | Teamdata + leden; leden-tabblad als client component |
| `/dashboard/teams/nieuw/page.tsx` | Client | Formulier |
| `/dashboard/activiteiten/page.tsx` | Server | Activiteitenlijst met filters als URL params |
| `/dashboard/activiteiten/nieuw/page.tsx` | Client | Type uit searchParams; formulier |
| `/dashboard/activiteiten/[id]/bewerken/page.tsx` | Server → Client | Data laden (server), formulier (client) |
| `/dashboard/rollen/page.tsx` | Server | Profielen laden; rolwijziging als client component |

**API routes in `apps/web/app/api/`:**

- `POST /api/cms/import` — verwerkt CSV-import body (JSON array van CsvImportRow), returnt CsvImportResult
- `POST /api/cms/activities/generate-recurring` — genereert activiteiten vanuit recurring_rule, returnt aantal gegenereerde rijen

**Rolguard voor /rollen:**
Extra check in `apps/web/app/dashboard/rollen/page.tsx`:
```typescript
if (profile.role !== 'beheerder') return <GeenToegang />;
```

---

### Implementatievolgorde

1. DB migratie uitvoeren
2. `supabase db reset` + `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
3. Shared: `packages/shared/src/schemas/cms.schema.ts` + nieuwe types in `app.types.ts`
4. Dashboard overzicht: `apps/web/app/dashboard/page.tsx`
5. Leden:
   - `apps/web/app/dashboard/leden/page.tsx` (lijst + zoeken/filteren)
   - `apps/web/app/dashboard/leden/[id]/page.tsx` + client-component `_components/LidEditForm.tsx`
   - `apps/web/app/dashboard/leden/importeren/page.tsx` + `_components/CsvImportWizard.tsx`
   - `apps/web/app/api/cms/import/route.ts`
6. Teams:
   - `apps/web/app/dashboard/teams/page.tsx`
   - `apps/web/app/dashboard/teams/nieuw/page.tsx`
   - `apps/web/app/dashboard/teams/[id]/page.tsx` + `_components/TeamLedenTab.tsx`
7. Activiteiten:
   - `apps/web/app/dashboard/activiteiten/page.tsx`
   - `apps/web/app/dashboard/activiteiten/nieuw/page.tsx` + `_components/TrainingForm.tsx`, `ClubactiviteitForm.tsx`, `BardienstForm.tsx`
   - `apps/web/app/dashboard/activiteiten/[id]/bewerken/page.tsx`
   - `apps/web/app/api/cms/activities/generate-recurring/route.ts`
8. Rollen:
   - `apps/web/app/dashboard/rollen/page.tsx` + `_components/RolDropdown.tsx`
9. Tests:
   - `apps/web/app/dashboard/__tests__/dashboard.test.tsx`
   - `apps/web/app/dashboard/leden/__tests__/leden.test.tsx`
   - `apps/web/app/dashboard/teams/__tests__/teams.test.tsx`
   - `apps/web/app/dashboard/activiteiten/__tests__/activiteiten.test.tsx`
   - `apps/web/app/dashboard/rollen/__tests__/rollen.test.tsx`
   - `packages/shared/src/schemas/__tests__/cms.schema.test.ts`
10. Verificatie: `pnpm typecheck` + `pnpm test` + `pnpm lint`

---

## GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Ja — naam, geboortedatum, e-mail, telefoon, sport, rol van leden en app-gebruikers | Vastleggen in design doc |
| Wettelijke grondslag | Overeenkomst (lidmaatschap sportclub) | Grondslag geldt al voor bestaande data |
| Data van kinderen (< 16 jaar)? | Ja — leden kunnen minderjarige spelers zijn | Extra RLS al aanwezig (`members_admin_all`); geen tracking; geen profieldata van minderjarigen in logs |
| Bewaartermijn | Soft-delete; `deleted_at` gevuld maar data bewaard | Beleid: data 2 jaar na `deleted_at` definitief verwijderen (buiten V1-scope) |
| Toegang beperkt via RLS? | Ja — `is_admin()` op alle schrijfoperaties; leden zien alleen eigen data | Policies al aanwezig; nieuwe migratie voegt `admins_update_profiles` toe |
| PII in logs vermeden? | Risico in CSV-import API route | API route mag geen PII loggen — alleen row index, outcome, timestamp |
| Data binnen EU (Supabase EU-region)? | Ja — Supabase EU-regio (Frankfurt) | Geen actie vereist |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete op `members` + `profiles`; export via CMS ledenlijst | Export-knop op ledenlijst (CSV-download) toevoegen als DSAR-faciliteit |

**Acties uit GDPR:**
- CSV-import API-route: nooit volledige rijen loggen — alleen `{ row_index, outcome, timestamp }`.
- Ledenlijst: "Exporteer als CSV" knop toevoegen voor DSAR-verzoeken (implementeren als deel van UC-02).

---

## Scenario-updates

Hoogste bestaand scenario-nummer: 11. Nieuwe scenario's starten op 12.

### Nieuwe scenario-bestanden

- `docs/scenarios/12-web-cms.md` — volledig nieuw (zie inhoud hieronder)

### Bestaande bestanden te updaten

- `docs/scenarios/11-federatie-integratie.md` — geen wijzigingen vereist; sync-management pagina al gedekt in S11-B/C
- `docs/scenarios/04-cms-toegang.md` — toevoegen: test dat commissielid geen toegang heeft tot `/dashboard/rollen`

---

## Implementatieplan

1. [ ] Maak migratie `YYYYMMDDHHMMSS_web_cms_rls_fix.sql`:
   - Fix `recurring_rules` policy → `is_admin()`
   - Voeg `admins_update_profiles` policy toe
   - Voeg `activities_starts_at_idx` index toe
   - Bestand: `supabase/migrations/YYYYMMDDHHMMSS_web_cms_rls_fix.sql`

2. [ ] Voer uit: `supabase db reset`

3. [ ] Voer uit: `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`

4. [ ] Maak `packages/shared/src/schemas/cms.schema.ts` met: `createTeamSchema`, `updateTeamSchema`, `createTrainingSchema`, `createClubactiviteitSchema`, `createBardienstSchema`, `updateMemberSchema`, `updateRoleSchema`, `csvColumnMappingSchema`, `csvImportRowSchema`

5. [ ] Voeg toe aan `packages/shared/src/types/app.types.ts`: `TeamWithMemberCount`, `TeamMemberWithMember`, `ActivityWithTeam`, `CsvImportRow`, `CsvImportResult`, `DashboardStats`

6. [ ] Export nieuwe schema's en types vanuit `packages/shared/src/index.ts`

7. [ ] Implementeer `apps/web/app/dashboard/page.tsx` — stats telkaarten (server component)

8. [ ] Implementeer `apps/web/app/dashboard/leden/page.tsx` — ledenlijst met zoek + filter + export-knop (server component + client-side filter)

9. [ ] Implementeer `apps/web/app/dashboard/leden/[id]/page.tsx` + `_components/LidEditForm.tsx` (client form)

10. [ ] Implementeer `apps/web/app/dashboard/leden/importeren/page.tsx` + `_components/CsvImportWizard.tsx`

11. [ ] Implementeer `apps/web/app/api/cms/import/route.ts` — parse + vergelijk + insert/update, geen PII in logs

12. [ ] Implementeer `apps/web/app/dashboard/teams/page.tsx` — teamslijst met member counts

13. [ ] Implementeer `apps/web/app/dashboard/teams/nieuw/page.tsx`

14. [ ] Implementeer `apps/web/app/dashboard/teams/[id]/page.tsx` + `_components/TeamLedenTab.tsx`

15. [ ] Implementeer `apps/web/app/dashboard/activiteiten/page.tsx` — lijst met type/datum/sport filters (URL params)

16. [ ] Implementeer `apps/web/app/dashboard/activiteiten/nieuw/page.tsx` + `_components/TrainingForm.tsx`, `ClubactiviteitForm.tsx`, `BardienstForm.tsx`

17. [ ] Implementeer `apps/web/app/dashboard/activiteiten/[id]/bewerken/page.tsx`

18. [ ] Implementeer `apps/web/app/api/cms/activities/generate-recurring/route.ts`

19. [ ] Implementeer `apps/web/app/dashboard/rollen/page.tsx` + `_components/RolDropdown.tsx` (beheerder-only guard)

20. [ ] Schrijf tests:
    - `packages/shared/src/schemas/__tests__/cms.schema.test.ts`
    - `apps/web/app/dashboard/__tests__/dashboard.test.tsx`
    - `apps/web/app/dashboard/leden/__tests__/leden.test.tsx`
    - `apps/web/app/dashboard/teams/__tests__/teams.test.tsx`
    - `apps/web/app/dashboard/activiteiten/__tests__/activiteiten.test.tsx`
    - `apps/web/app/dashboard/rollen/__tests__/rollen.test.tsx`

21. [ ] Voer uit: `pnpm typecheck`

22. [ ] Voer uit: `pnpm test`

23. [ ] Voer uit: `pnpm lint`

---

## Open vragen

1. **commissielid vs beheerder granulariteit:** Voor V1 hebben beide rollen dezelfde CMS-toegang, behalve `/dashboard/rollen` (uitsluitend beheerder). Is dit de juiste afbakening, of zijn er andere modules waarvoor commissielid beperktere toegang moet hebben?

2. **Bardienst zonder team:** Ontwerp staat dit toe (sport-filter only). Bevestig dat bardienst ook clubbreed mag worden aangemaakt zonder teamkoppeling.

3. **Terugkerende trainingen bewerken:** "Alle toekomstige sessies" past de recurring_rule aan en regenereert activiteiten ná vandaag. Verleden activiteiten worden niet aangeraakt. Akkoord?

4. **CSV-export voor DSAR:** Toegevoegd als GDPR-actie. Eenvoudige CSV-download van alle ledengegevens op de ledenlijstpagina — akkoord met scope?

---

## SRE Notes

**Datum:** 12-05-2026

### Logging
- `generate-recurring/route.ts` — geen log statements; acceptabel (korte sync-operatie, Supabase audit log is leidend)
- `analyse/route.ts` — geen log statements; acceptabel
- `import/route.ts` — 3 console.error statements; bevatten alleen `row_index` (integer) en `outcome` string; geen PII

### Monitoring
- `profiles_member_id_idx` toegevoegd (migration 20260512090000): gebruikt door rollen-pagina JOIN
- `members_name_birthdate_idx` toegevoegd (migration 20260512090000): gebruikt door CSV import duplicate detectie
- `bar_assignments_member_id_idx` toegevoegd (migration 20260512090000): gebruikt door RLS policies
- `activities_starts_at_idx` (migration 20260511122139): bestond al; `IF NOT EXISTS` voorkomt fout

### Foutafhandeling
- Alle foutberichten in het Nederlands en voorzien van actie-instructie ("Probeer het opnieuw") ✓
- Alle submit-knoppen disabled tijdens isSubmitting ✓
- `CsvImportWizard.handleAnalyse`: double-submit beveiliging toegevoegd (`analysing` state)

### Beveiliging
- `admins_manage_recurring_rules` en `admins_update_profiles` policies gebruiken `is_admin()` security-definer ✓
- Admin client (`supabase-admin`) uitsluitend in API routes; nooit in dashboard client components ✓
- CSV import `analyse/route.ts`: Zod-validatie op elke rij vóór database-query ✓
- CSV import `import/route.ts`: Zod-validatie (`csvImportRowDataSchema`) toegevoegd vóór insert/update ✓
- Bestandsvalidatie: `.csv` extensie + 5 MB limiet client-side ✓
- Geen secret keys in NEXT_PUBLIC_ of EXPO_PUBLIC_ variabelen ✓

### Bundle
- Geen nieuwe packages toegevoegd aan apps/mobile of root package.json

### Openstaande punten
- CSV-export voor DSAR nog niet geïmplementeerd — buiten scope V1 tenzij goedgekeurd
