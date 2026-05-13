# Scenario: Account aanvragen

End-to-end flow voor het aanvragen van een nieuw app-account — van het mobiele formulier
tot admin goedkeuring en activatie via de uitnodigingsmail.

**Vereisten:**
- Lokale Supabase draait (`supabase start`)
- Seed data toegepast (`cd apps/web && pnpm seed`)
- Mobiele app open op simulatorclient
- CMS draait (`cd apps/web && pnpm dev`)

---

## S14-A — Account aanvragen (mobiel) — happy path

**Doel:** Een nieuwe gebruiker dient een account aanvraag in.

**Stappen:**

1. Open de mobiele app. Het loginscherm "Welkom terug" is zichtbaar.
2. Tik op "Account aanvragen".
3. Het scherm "Account aanvragen" opent.
4. Vul in:
   - Naam: `Nieuw Testlid`
   - E-mailadres: `nieuw-testlid@e2e.scmuiden.test`
   - Geboortedatum: `15-04-1990`
5. Tik op "Aanvraag indienen".

**Verwacht resultaat:**

- Het bevestigingsscherm "Aanvraag ingediend" verschijnt.
- De tekst luidt: "Je ontvangt een e-mail zodra je account is goedgekeurd door een beheerder."

**Verificatie via Supabase Studio:**

- Navigeer naar Table Editor → `account_requests`.
- Een rij bestaat met:
  - `display_name`: Nieuw Testlid
  - `email`: nieuw-testlid@e2e.scmuiden.test
  - `birth_date`: 1990-04-15
  - `status`: pending

---

## S14-B — Dubbele aanvraag voor een actief e-mailadres

**Doel:** Een tweede aanvraag met een al pending e-mailadres wordt geblokkeerd.

**Vereisten:** S14-A doorlopen (aanvraag voor `nieuw-testlid@e2e.scmuiden.test` bestaat).

**Stappen:**

1. Tik opnieuw op "Account aanvragen" (of heropen het scherm).
2. Vul in:
   - Naam: `Ander Testlid`
   - E-mailadres: `nieuw-testlid@e2e.scmuiden.test`
3. Tik op "Aanvraag indienen".

**Verwacht resultaat:**

- Het scherm blijft op het formulier.
- Een foutmelding is zichtbaar: "Er bestaat al een aanvraag voor dit e-mailadres."
- Studio → `account_requests`: geen tweede rij aangemaakt voor dit e-mailadres.

---

## S14-C — Herindiening na afwijzing

**Doel:** Na een afwijzing kan hetzelfde e-mailadres opnieuw worden ingediend.

**Vereisten:** Een aanvraag bestaat voor `nieuw-testlid@e2e.scmuiden.test` met `status = 'rejected'`.
Stel dit in via Studio: zet de rij uit S14-A op `status = rejected`.

**Stappen:**

1. Open het registratiescherm.
2. Vul in:
   - Naam: `Nieuw Testlid`
   - E-mailadres: `nieuw-testlid@e2e.scmuiden.test`
3. Tik op "Aanvraag indienen".

**Verwacht resultaat:**

- Het bevestigingsscherm "Aanvraag ingediend" verschijnt.
- Studio → `account_requests`: een nieuwe rij bestaat met `status = pending` voor dit e-mailadres.

---

## S14-D — Admin bekijkt aanvragen (CMS)

**Doel:** De admin ziet de ingediende aanvraag in het CMS.

**Vereisten:** S14-A doorlopen.

**Stappen:**

1. Open het CMS op http://localhost:3000.
2. Log in als beheerder: `e2e-beheerder@e2e.scmuiden.test` / `E2eTestWachtwoord123!`.
3. Klik in de linker zijbalk op "Account aanvragen".

**Verwacht resultaat:**

- De tab "In behandeling" is actief en toont een badge met het aantal pending aanvragen.
- Een kaart is zichtbaar voor "Nieuw Testlid" met e-mail `nieuw-testlid@e2e.scmuiden.test` en geboortedatum `15-04-1990`.
- De "Goedkeuren en uitnodigen"-knop is uitgeschakeld (geen lid geselecteerd).

---

## S14-E — Admin keurt aanvraag goed en koppelt lid (CMS)

**Doel:** Admin koppelt een lid en keurt de aanvraag goed.

**Vereisten:** S14-D doorlopen. Zorg dat er een member bestaat met naam "Nieuw Testlid" (aanmaken via Studio → `members` of via CSV-import).

**Stappen:**

1. In de kaart voor "Nieuw Testlid", klik in het zoekveld "Zoek lid op naam of e-mail...".
2. Typ "Nieuw". Een dropdown verschijnt met de overeenkomende leden.
3. Selecteer "Nieuw Testlid".
4. De naam verschijnt als tag naast het zoekveld.
5. De "Goedkeuren en uitnodigen"-knop is nu actief.
6. Klik "Goedkeuren en uitnodigen".

**Verwacht resultaat:**

- De kaart verdwijnt uit "In behandeling".
- In de tab "Afgehandeld" verschijnt de aanvraag met statusbadge "Goedgekeurd".
- Open Inbucket op http://127.0.0.1:54324 → inbox voor `nieuw-testlid@e2e.scmuiden.test`: een uitnodigingsmail is aanwezig.

**Verificatie via Supabase Studio:**

- `account_requests`: status = `approved`, `reviewed_by` is ingevuld.
- `auth.users`: een nieuw account bestaat voor `nieuw-testlid@e2e.scmuiden.test`.
- `profiles`: een rij bestaat met `member_id` gekoppeld aan het lid "Nieuw Testlid".

---

## S14-F — Admin wijst aanvraag af (CMS)

**Doel:** Admin wijst een aanvraag af.

**Vereisten:** Een tweede pending aanvraag bestaat (herhaal S14-A met ander e-mailadres, bijv. `afwijzing-test@e2e.scmuiden.test`).

**Stappen:**

1. Open "Account aanvragen" in het CMS.
2. Zoek de kaart voor `afwijzing-test@e2e.scmuiden.test`.
3. Klik "Afwijzen".
4. Vul optioneel een notitie in: "Geen lid van de vereniging."
5. Klik "Bevestigen".

**Verwacht resultaat:**

- De kaart verdwijnt uit "In behandeling".
- In "Afgehandeld" verschijnt de aanvraag met statusbadge "Afgewezen".

**Verificatie via Supabase Studio:**

- `account_requests`: status = `rejected`, `admin_notes` = "Geen lid van de vereniging."
- `auth.users`: geen nieuw account aangemaakt voor dit e-mailadres.

---

## S14-G — Gebruiker activeert account via uitnodigingsmail

**Doel:** Gebruiker stelt wachtwoord in via de uitnodigingslink en logt in.

**Vereisten:** S14-E doorlopen.

**Stappen:**

1. Open Inbucket op http://127.0.0.1:54324.
2. Open de inbox voor `nieuw-testlid@e2e.scmuiden.test`.
3. Open de uitnodigingsmail en klik op de activatielink.
4. De browser navigeert naar `http://localhost:3000/auth/wachtwoord-reset?code=xxx`.
5. Het formulier "Wachtwoord instellen" verschijnt.
6. Vul in: wachtwoord `NieuwWachtwoord123!`, bevestiging `NieuwWachtwoord123!`.
7. Klik "Wachtwoord opslaan".

**Verwacht resultaat:**

- Succesmelding: "Je account is geactiveerd. Je kunt nu inloggen in de app."
- Het formulier is niet meer zichtbaar.

**Verificatie via Supabase Studio:**

- `profiles` voor `nieuw-testlid@e2e.scmuiden.test`: `password_changed_at` is ingevuld.

**Vervolg — inloggen op mobiel:**

8. Open de mobiele app.
9. Vul in: e-mailadres `nieuw-testlid@e2e.scmuiden.test`, wachtwoord `NieuwWachtwoord123!`.
10. Tik "Inloggen".

**Verwacht resultaat:**

- Het tabbar-scherm verschijnt (Thuis, Agenda, Teams, Nieuws, Profiel).

---

## S14-H — Gezinsverzoek goedkeuren via CMS (zonder Supabase Studio)

**Doel:** Admin keurt een gezinsverzoek goed via de CMS UI.

**Vereisten:**
- S03-A doorlopen (gezinsverzoek voor "Tweede Kindlid" ingediend door Test Lid).
- Een `members`-rij "Tweede Kindlid" bestaat (zie setup in 03-gezin-koppelen.md).

**Stappen:**

1. Open het CMS → "Gezinsverzoeken".
2. In "In behandeling": zoek het verzoek van Test Lid voor "Tweede Kindlid".
3. Klik in het zoekveld "Zoek lid op naam of e-mail..." en typ "Tweede".
4. Selecteer "Tweede Kindlid" uit de dropdown.
5. Klik "Goedkeuren".

**Verwacht resultaat:**

- Het verzoek verdwijnt uit "In behandeling" en verschijnt in "Afgehandeld" als "Goedgekeurd".
- Mobiele app (Test Lid): "Tweede Kindlid" verschijnt in de Mijn gezin sectie zonder clock-icoon.

**Verificatie via Supabase Studio:**

- `family_link_requests`: status = `approved`, `member_id` is ingevuld.
- `user_family_members`: een rij bestaat voor Test Lid ↔ Tweede Kindlid.

---

## S14-I — Gezinsverzoek afwijzen via CMS

**Doel:** Admin wijst een gezinsverzoek af via de CMS UI.

**Vereisten:** Een pending gezinsverzoek bestaat (zie S03-A, of dien een nieuw verzoek in via de app).

**Stappen:**

1. Open het CMS → "Gezinsverzoeken".
2. Zoek een pending verzoek.
3. Klik "Afwijzen".
4. Vul optioneel een notitie in.
5. Klik "Bevestigen".

**Verwacht resultaat:**

- Het verzoek verschijnt in "Afgehandeld" met statusbadge "Afgewezen".

**Verificatie via Supabase Studio:**

- `family_link_requests`: status = `rejected`.
- `user_family_members`: geen nieuwe rij aangemaakt.
