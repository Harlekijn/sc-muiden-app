# Scenario: Bardienst bevestigen

End-to-end flow voor het bevestigen van een bardienst-toewijzing vanuit de mobiele app.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open en ingelogd als Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)
- De seed heeft een bardienst-activiteit aangemaakt met een `bar_assignments`-rij die Test Kindlid (gezinslid van Test Lid) toewijst

---

## S07-A — Bardienst-sectie zichtbaar bij eigen toewijzing

**Goal:** De bardienst-sectie is zichtbaar op het detailscherm van een bardienst-activiteit, alleen wanneer een gezinslid van de gebruiker is toegewezen.

**Steps:**

1. Log in als Test Lid.
2. Open de Agenda-tab.
3. Tik op de dag met de bardienst.
4. Tik op de bardienst-card.

**Expected result:**

- Het activiteitdetail-scherm opent met type badge "Bardienst".
- Onder de info-sectie is de "Bardienst"-sectie zichtbaar als card.
- De sectie toont:
  - Naam van het toegewezen gezinslid: "Test Kindlid"
  - Knop "Bevestigen" (groen)
- De knop is aantikbaar.

**Verificatie via Studio:**

Open Supabase Studio → `bar_assignments`. De seed-rij heeft:
- `activity_id`: UUID van de bardienst-activiteit
- `family_member_id`: UUID van Test Kindlid
- `confirmed_at`: null

---

## S07-B — Bardienst bevestigen (happy path)

**Goal:** Tikken op "Bevestigen" slaat de bevestiging op en de knop verandert van staat.

**Prerequisites:** S07-A uitgevoerd. De bardienst is nog niet bevestigd (`confirmed_at IS NULL`).

**Steps:**

1. Op het bardienst-detailscherm, tik op "Bevestigen".

**Expected result:**

- De knop verandert direct naar "Bevestigd" met een vinkje.
- De knop is uitgeschakeld (niet meer tappable).
- De kleur van de knop verandert naar grijs/gedimde groen.
- Er is geen herlading of navigatie nodig.

**Verificatie via Studio:**

Open Supabase Studio → `bar_assignments`. De rij voor Test Kindlid heeft nu:
- `confirmed_at`: een timestamp (niet null)

---

## S07-C — Bardienst al bevestigd bij openen

**Goal:** Wanneer een bardienst al bevestigd is, toont het scherm direct de "Bevestigd"-staat zonder extra actie van de gebruiker.

**Prerequisites:** S07-B is uitgevoerd (confirmed_at is ingevuld).

**Steps:**

1. Sluit en heropen de bardienst-detailpagina.

**Expected result:**

- De bardienst-sectie toont direct "Bevestigd" met een vinkje.
- De knop is uitgeschakeld.
- Er is geen "Bevestigen"-knop zichtbaar.

---

## S07-D — Bevestigen mislukt bij netwerkfout

**Goal:** Bij een netwerkfout bij bevestigen verschijnt een Nederlandse foutmelding en blijft de knop actief.

**Setup:**

1. Schakel wifi/mobiele data uit op de simulator of zet vliegtuigmodus aan.

**Steps:**

2. Open de bardienst-detailpagina (gecachte data).
3. Tik op "Bevestigen".

**Expected result:**

- De app toont een foutmelding: "Kon niet bevestigen. Controleer je verbinding."
- De "Bevestigen"-knop blijft actief.
- De "Geen verbinding"-banner verschijnt bovenaan het scherm.
- `confirmed_at` is na het inschakelen van verbinding nog steeds null (Studio check).

**Cleanup:**

4. Zet verbinding terug aan.

---

## S07-E — Bardienst-sectie niet zichtbaar voor andere gebruikers

**Goal:** Een gebruiker zonder toewijzing ziet de bardienst-sectie niet.

**Setup:**

Maak een extra auth-gebruiker aan (`e2e-geen-bardienst@e2e.scmuiden.test`) zonder gezinsleden in de bardienst-activiteit.

**Steps:**

1. Log in als `e2e-geen-bardienst@e2e.scmuiden.test`.
2. Navigeer naar het detailscherm van de bardienst-activiteit (via Agenda).

**Expected result:**

- Het activiteitdetail-scherm is zichtbaar (de activiteit is publiek voor leden).
- De "Bardienst"-sectie is **niet** zichtbaar (geen eigen toewijzing).
- Geen foutmelding, geen lege card.

**Verificatie via Studio:**

Open Supabase Studio → `bar_assignments`. Er is geen rij voor gezinsleden van deze gebruiker.
