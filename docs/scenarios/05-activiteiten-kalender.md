# Scenario: Activiteiten & Kalender

End-to-end flow voor de Agenda-tab: maandoverzicht, gezinsfilter, lege staat, en offline gedrag.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open en ingelogd als Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)
- De seed heeft een RecurringRule aangemaakt voor het voetbalteam (maandag 19:00, valid_from = 7 dagen geleden, valid_until = +180 dagen). Trainings worden on-the-fly gegenereerd via de view `activities_with_occurrences`.
- De seed heeft daarnaast activiteiten aangemaakt: 1 wedstrijd (overmorgen), 1 bardienst (volgende week), 1 clubactiviteit (deze week)
- Test Kindlid is via `team_members` gekoppeld aan het voetbalteam waarvoor de RecurringRule en wedstrijd zijn gepland
- **Let op (vanaf federatie-integratie):** wedstrijd-activiteiten worden gevuld door de federatiesync. Het seed-script maakt een wedstrijd-activiteit + bijbehorend `matches` record met `status: 'gepland'` aan voor testdoeleinden.

---

## S05-A — Maandoverzicht toont dots op dagen met activiteiten

**Goal:** De kalender toont activiteitsdots op de correcte dagen.

**Steps:**

1. Log in als Test Lid.
2. Tik op de "Agenda"-tab in de bottom navigation bar.
3. De Agenda-scherm opent op de huidige maand.

**Expected result:**

- De kalender is zichtbaar met de huidige maandnaam en het jaar in de header.
- Op de dag van de training is ten minste één blauwe dot zichtbaar.
- Op de dag van de wedstrijd is ten minste één marine dot zichtbaar.
- Op de dag van de bardienst is ten minste één gele dot zichtbaar.
- Op de dag van de clubactiviteit is ten minste één groene dot zichtbaar.
- Dagen zonder activiteiten hebben geen dots.
- De huidige dag is gemarkeerd met een blauwe achtergrond.

**Verificatie via Studio:**

Open Supabase Studio → `activities_with_occurrences`. Controleer dat alle seed-activiteiten + de gegenereerde trainings aanwezig zijn met `deleted_at IS NULL`. Trainings hebben `is_generated = true` en bestaan niet als losse rijen in `activities`.

---

## S05-B — Dagdetail toont activiteiten van de geselecteerde dag

**Goal:** Na het tikken op een dag met activiteiten verschijnt de daglijst met de juiste activiteiten.

**Prerequisites:** Agenda-scherm open (S05-A).

**Steps:**

1. Tik op de dag met de training in de kalender.

**Expected result:**

- De geselecteerde dag krijgt een marine ring in de kalender.
- Onder de kalender verschijnt een lijst met de activiteiten van die dag.
- De training is zichtbaar als card met:
  - Titel van de training
  - Tijdstip in 24h formaat (bijv. "09:00")
  - Type badge "Training"
  - Sport badge "Voetbal"
  - Een blauwe kleurstrip links op de card
- De volgorde is op starts_at ASC.

---

## S05-C — Lege dag toont Dutch lege staat

**Goal:** Wanneer de gebruiker een dag zonder activiteiten selecteert, verschijnt een heldere lege staat.

**Prerequisites:** Agenda-scherm open.

**Steps:**

1. Tik op een dag in de kalender zonder activiteitsdots.

**Expected result:**

- De daglijst onder de kalender toont: "Geen activiteiten op deze dag."
- Er zijn geen activiteitcards zichtbaar.
- Geen Engelse tekst of technische foutmeldingen.

---

## S05-D — Gezinsfilter op één gezinslid

**Goal:** De filterrij laat de gebruiker schakelen tussen "Heel gezin" en een specifiek gezinslid.

**Prerequisites:** Agenda-scherm open. Test Kindlid is gekoppeld aan het voetbalteam.

**Steps:**

1. Controleer dat bovenaan de Agenda de filterrij zichtbaar is met:
   - "Heel gezin" (actief, donkerblauw)
   - "Test Kindlid" (inactief)
2. Tik op "Test Kindlid".

**Expected result:**

- "Test Kindlid"-chip wordt actief (donkerblauw).
- "Heel gezin"-chip wordt inactief.
- De kalenderdots worden herberekend: alleen activiteiten van Test Kindlid's team zijn zichtbaar.
- Clubbrede activiteiten (bardienst, clubactiviteit zonder team) blijven zichtbaar voor alle filters.

**Steps (terug naar heel gezin):**

3. Tik op "Heel gezin".

**Expected result:**

- "Heel gezin"-chip is actief.
- Kalender toont alle activiteiten.

---

## S05-E — Gebruiker zonder teamkoppelingen ziet alleen clubbrede activiteiten

**Goal:** Een gebruiker zonder gezinsleden in een team krijgt toch een zinvol overzicht.

**Setup:**

1. Maak een nieuw auth-gebruiker aan via Supabase Studio of `supabase auth create-user`:
   - E-mail: `geen-team@e2e.scmuiden.test`
   - Wachtwoord: `E2eTestWachtwoord123!`
2. Maak een overeenkomstig `members`-record aan.
3. Maak een `profiles`-record aan zonder `user_family_members`-koppelingen.

**Steps:**

4. Log in als `geen-team@e2e.scmuiden.test`.
5. Open de Agenda-tab.

**Expected result:**

- De kalender toont alleen de clubbrede activiteiten (activiteiten zonder team_id: bardienst, clubactiviteit).
- Dots verschijnen alleen op de dagen van clubbrede activiteiten.
- Indien er geen clubbrede activiteiten in de geselecteerde maand zijn: lege staat "Geen activiteiten gevonden."

---

## S05-F — Pull-to-refresh herlaadt de data

**Goal:** Trekken aan het scherm herlaadt de activiteiten.

**Prerequisites:** Agenda-scherm open als Test Lid.

**Steps:**

1. Trek het scherm omlaag (pull-to-refresh).

**Expected result:**

- Een laad-indicator verschijnt bovenaan.
- Na het loslaten worden de activiteiten opnieuw geladen vanuit Supabase.
- De kalender en daglijst tonen bijgewerkte data.

---

## S05-G — Vorige en volgende maand navigeren

**Goal:** De pijlknoppen in de maandkalender wisselen van maand.

**Prerequisites:** Agenda-scherm open.

**Steps:**

1. Noteer de huidige maandnaam bovenaan de kalender.
2. Tik op de rechter pijl (`>`).

**Expected result:**

- De maandnaam verandert naar de volgende maand.
- De calendar grid herlaadt voor de nieuwe maand.
- Dots worden getoond voor de nieuwe maand op basis van aanwezige activiteiten.

**Steps:**

3. Tik twee keer op de linker pijl (`<`).

**Expected result:**

- De maandnaam is nu de maand vóór de originele maand.
