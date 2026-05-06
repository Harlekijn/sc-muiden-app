# Scenario: Activiteitdetail

End-to-end flow voor het activiteitdetail-scherm: weergave van alle activiteitstypen.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open en ingelogd als Test Lid
- Seed bevat: 1 training, 1 wedstrijd (met `matches`-record), 1 bardienst, 1 clubactiviteit

---

## S06-A — Trainingsdetail bekijken

**Goal:** Het detailscherm van een training toont alle relevante velden correct.

**Steps:**

1. Open de Agenda-tab.
2. Tik op de dag met de training.
3. Tik op de trainingscard in de daglijst.

**Expected result:**

- Het activiteitdetail-scherm opent.
- De hero-sectie (donkerblauwe achtergrond) toont:
  - Type badge "Training" (witte pill)
  - Sport badge "Voetbal" (gele pill met marine tekst)
  - Teamnaam (bijv. "JO11-1")
  - Datum in Nederlands lang formaat (bijv. "woensdag 6 mei 2026")
  - Tijdstip in 24h formaat (bijv. "09:00")
- Info-sectie toont:
  - Locatie (met map-link icon `<MapPin />`)
  - Tijd (`<Clock />`)
  - Team (`<Users />`)
- De bardienst-sectie is **niet** zichtbaar (want type is training).
- Terug-knop navigeert terug naar de agenda.

---

## S06-B — Wedstrijddetail bekijken (gepland)

**Goal:** Een geplande wedstrijd toont de correcte status en teaminformatie.

**Steps:**

1. Open de Agenda-tab.
2. Tik op de dag met de wedstrijd.
3. Tik op de wedstrijdcard.

**Expected result:**

- De hero-sectie toont:
  - Status badge "GEPLAND" (donkerblauw/transparant)
  - Thuisteam en uitteam gescheiden door " – "
  - Geen score (wedstrijd is nog niet gespeeld)
  - Datum en tijdstip
- Info-sectie toont locatie en tijdsinformatie.
- De bardienst-sectie is **niet** zichtbaar.

---

## S06-C — Wedstrijddetail bekijken (gespeeld met score)

**Goal:** Na het spelen van een wedstrijd toont het detailscherm de score correct.

**Setup:**

1. Open Supabase Studio → `matches`.
2. Zoek de wedstrijd-match-record.
3. Stel in:
   - `status`: `gespeeld`
   - `score_home`: 3
   - `score_away`: 1
   - `played_at`: huidige timestamp

**Steps:**

4. Open de app → Agenda → wedstrijddetail.

**Expected result:**

- Status badge toont "GESPEELD" (groen).
- Score is zichtbaar als "3 – 1" (en-dash, spaties) in grote gele letters.
- Geen "Bevestigen"-knop.

---

## S06-D — Clubactiviteitdetail bekijken

**Goal:** Een clubactiviteit (geen team, sport-onafhankelijk) toont geen sport badge.

**Steps:**

1. Open de Agenda-tab.
2. Tik op de dag met de clubactiviteit.
3. Tik op de clubactiviteitcard.

**Expected result:**

- Hero-sectie:
  - Type badge "Clubactiviteit"
  - Geen sport badge (want sport is null)
  - Naam: "SC Muiden" als teamnaam (geen team gekoppeld)
- Info-sectie toont locatie en tijdstip.

---

## S06-E — Activiteit niet gevonden

**Goal:** Wanneer een activiteit verwijderd is, toont het scherm een correcte foutmelding.

**Setup:**

1. Open Supabase Studio → `activities`.
2. Zoek de training-record.
3. Zet `deleted_at` op de huidige timestamp.

**Steps:**

4. Navigeer direct naar het activiteitdetail (bijv. via een gecachte deeplink).

**Expected result:**

- Het scherm toont: "Deze activiteit is niet meer beschikbaar."
- Een terug-knop is zichtbaar.
- Geen technische foutmelding of lege scherm.

**Cleanup:**

5. Reset `deleted_at` naar null in Studio.
