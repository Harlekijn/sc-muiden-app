# Scenario: Home feed

End-to-end flow voor het thuisscherm met "Vandaag"- en "Binnenkort"-secties.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app open en ingelogd als Test Lid (`e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`)
- De seed heeft activiteiten aangemaakt:
  - 1 training vandaag (09:00)
  - 1 wedstrijd overmorgen (14:30)
  - 1 bardienst volgende week
  - Test Kindlid is via `team_members` gekoppeld aan het voetbalteam

---

## S10-A — "Vandaag"-sectie toont activiteiten van vandaag

**Goal:** Het thuisscherm toont uitsluitend de activiteiten van de huidige dag in de "Vandaag"-sectie.

**Steps:**

1. Log in als Test Lid.
2. Open de app — het thuisscherm laadt.

**Expected result:**

- De "Vandaag"-sectie is zichtbaar met een sectielabel "VANDAAG".
- De training van vandaag is zichtbaar als `ActivityCard` met:
  - Titel van de training
  - Tijdstip "09:00"
  - Type badge "Training"
  - Sport badge "Voetbal"
- Activiteiten van andere dagen zijn niet in de "Vandaag"-sectie zichtbaar.

**Verificatie via Studio:**

Open Supabase Studio → `activities`. Controleer dat de training `starts_at` vandaag heeft.

---

## S10-B — "Binnenkort"-sectie toont activiteiten komende 7 dagen gegroepeerd per dag

**Goal:** De "Binnenkort"-sectie toont activiteiten van morgen t/m 7 dagen vooruit, gegroepeerd per dag.

**Prerequisites:** S10-A uitgevoerd.

**Steps:**

1. Scroll omlaag op het thuisscherm naar de "Binnenkort"-sectie.

**Expected result:**

- De "Binnenkort"-sectie is zichtbaar met een sectielabel "BINNENKORT".
- De wedstrijd overmorgen is zichtbaar onder een dag-label (bijv. "maandag 11 mei").
- Activiteiten zijn gesorteerd op starts_at ASC binnen elke dag.
- Vandaag en activiteiten meer dan 7 dagen weg zijn niet zichtbaar.

---

## S10-C — Lege staat bij geen activiteiten vandaag

**Goal:** Wanneer er geen activiteiten vandaag zijn, verschijnt een duidelijke lege staat.

**Setup:**

1. Verwijder of verschuif de training van vandaag zodat er geen activiteiten vandaag zijn.

**Steps:**

2. Open het thuisscherm.

**Expected result:**

- De "Vandaag"-sectie toont: "Geen activiteiten vandaag."
- Geen `ActivityCard`-componenten in de "Vandaag"-sectie.
- Geen Engelse tekst of technische foutmeldingen.

**Cleanup:**

3. Herstel de training.

---

## S10-E — Volgende wedstrijd hero card zichtbaar op thuisscherm

**Goal:** Als er een komende wedstrijd gesynchroniseerd is voor de sport van het lid, is de hero card "VOLGENDE WEDSTRIJD" zichtbaar op het thuisscherm.

**Prerequisites:**
- Federation-sync uitgevoerd (S11-A); minimaal 1 wedstrijd met `status = 'gepland'` en `starts_at > now()` aanwezig in `matches`.
- Test Kindlid is gekoppeld aan het voetbalteam.

**Steps:**

1. Open het thuisscherm als Test Lid.

**Expected result:**

- Sectielabel "VOLGENDE WEDSTRIJD" is zichtbaar (ALL CAPS, ds-label).
- Hero card (navy achtergrond) toont: thuisclub vs uitclub, datum + tijd, statusbadge "GEPLAND".
- Tikken op de hero card navigeert naar het wedstrijddetail-scherm (`/wedstrijd/[id]`).

**Steps (geen komende wedstrijden):**

2. Stel alle wedstrijden in op `status = 'gespeeld'` of verwijder ze.
3. Herlaad het thuisscherm.

**Expected result:**

- De sectie "VOLGENDE WEDSTRIJD" is volledig verborgen. Geen lege staat of placeholder.

**Verificatie via Supabase Studio:**

`SELECT * FROM matches WHERE status = 'gepland' AND activity_id IN (SELECT id FROM activities WHERE starts_at > now());`
→ Als leeg: hero card moet verborgen zijn.

---

## S10-D — Pull-to-refresh herlaadt beide secties

**Goal:** Trekken aan het scherm herlaadt de activiteiten van beide secties.

**Prerequisites:** Thuisscherm open als Test Lid.

**Steps:**

1. Trek het scherm omlaag (pull-to-refresh).

**Expected result:**

- Een laadindicator verschijnt bovenaan.
- Na het loslaten worden de "Vandaag"- en "Binnenkort"-secties herladen vanuit Supabase.
- Bijgewerkte data is zichtbaar.
