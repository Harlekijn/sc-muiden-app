# Scenario: Notificatie-instellingen

End-to-end flow voor het instellen van notificatievoorkeuren in de mobiele app.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open en ingelogd als Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)
- Seed heeft een `notification_preferences`-rij voor Test Lid met alle typen aan (`wedstrijd = true`, `bardienst = true`, `aankondiging = true`)

---

## S09-A — Notificatie-instellingenscherm toont actuele voorkeuren

**Goal:** Het scherm toont de opgeslagen voorkeuren van de gebruiker.

**Steps:**

1. Log in als Test Lid.
2. Open de Profiel-tab.
3. Tik op "Notificatie-instellingen".

**Expected result:**

- Het scherm opent met de titel "Notificatie-instellingen".
- Drie toggles zijn zichtbaar: "Wedstrijdherinneringen", "Bardienst-herinneringen", "Aankondigingen".
- Alle drie de toggles staan aan (blauw/actief).
- Geen "Trainingsherinneringen"-toggle (verwijderd in feature `kalender-recurring-on-the-fly`).
- Onder de card staat een caption over de herinneringstijden.

---

## S09-B — Toggle uitschakelen slaat voorkeur op

**Goal:** Het uitschakelen van een type wordt direct opgeslagen in `notification_preferences`.

**Prerequisites:** S09-A uitgevoerd.

**Steps:**

1. Tik op de toggle "Wedstrijdherinneringen" om het uit te schakelen.

**Expected result:**

- De toggle verandert direct naar de uitgeschakelde staat (grijs).
- Geen herlading of navigatie.
- Geen foutmelding zichtbaar.

**Verificatie via Studio:**

Open Supabase Studio → `notification_preferences`. Filter op `profile_id = <Test Lid UUID>`. Controleer:
- `wedstrijd = false`
- `bardienst = true`
- `aankondiging = true`

---

## S09-C — Nieuw account heeft standaard alle notificaties aan

**Goal:** Een account zonder `notification_preferences`-rij behandelt alle typen als ingeschakeld.

**Setup:**

1. Maak een nieuw test-account aan (`e2e-nieuw@e2e.scmuiden.test`).
2. Zorg dat er geen `notification_preferences`-rij bestaat voor dit account.

**Steps:**

3. Log in als `e2e-nieuw@e2e.scmuiden.test`.
4. Open Profiel → Notificatie-instellingen.

**Expected result:**

- Alle drie de toggles staan aan.
- Na het uitschakelen van één toggle wordt een nieuwe `notification_preferences`-rij aangemaakt (upsert) met de juiste waarden.

**Verificatie via Studio:**

Open Supabase Studio → `notification_preferences`. Controleer dat na de toggle-actie een nieuwe rij aanwezig is.
