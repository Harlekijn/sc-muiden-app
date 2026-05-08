# Scenario: Push-token registratie

End-to-end flow voor het registreren van een Expo push-token na het inloggen.

**Prerequisites:**
- Local Supabase running (`supabase start`)
- Seed data applied (`cd apps/web && pnpm seed`)
- Mobile app op fysiek apparaat of simulator met Expo Go / development build
- Test Lid account: `e2e-lid@e2e.scmuiden.test` / `E2eTestWachtwoord123!`

---

## S08-A — Push-token opgeslagen na inloggen met permissie

**Goal:** Na het verlenen van notificatiepermissie wordt het push-token opgeslagen in `push_tokens`.

**Steps:**

1. Verwijder eventuele bestaande `push_tokens`-rijen voor Test Lid via Studio.
2. Start de app op een apparaat dat push ondersteunt (fysiek of simulator met push-support).
3. Log in als Test Lid.
4. Het OS toont een notificatiepermissievraag — keur goed.

**Expected result:**

- De app laadt het thuisscherm zonder foutmelding.
- In Supabase Studio → `push_tokens`: er bestaat een rij voor Test Lid met:
  - `profile_id`: UUID van Test Lid
  - `token`: een geldige Expo Push Token (begint met `ExponentPushToken[`)
  - `platform`: `ios` of `android`

**Verificatie via Studio:**

Open Supabase Studio → `push_tokens`. Filter op `profile_id = <Test Lid UUID>`. Controleer dat precies één rij aanwezig is.

---

## S08-B — Geen push-token opgeslagen na weigeren permissie

**Goal:** Als de gebruiker notificatiepermissie weigert, wordt er geen token opgeslagen en crasht de app niet.

**Steps:**

1. Verwijder eventuele bestaande `push_tokens`-rijen voor Test Lid.
2. Log in als Test Lid.
3. Het OS toont een notificatiepermissievraag — weiger.

**Expected result:**

- De app laadt het thuisscherm zonder foutmelding.
- In Supabase Studio → `push_tokens`: geen rij voor Test Lid.

---

## S08-C — Duplicaat push-token wordt bijgewerkt, niet gedupliceerd

**Goal:** Als het push-token al bestaat (bijv. na herinstallatie met zelfde token), wordt de bestaande rij bijgewerkt via upsert.

**Steps:**

1. Zorg dat Test Lid al een `push_tokens`-rij heeft.
2. Log in als Test Lid opnieuw (bijv. na uitloggen).

**Expected result:**

- In Supabase Studio → `push_tokens`: nog steeds precies één rij voor Test Lid.
- `updated_at` is bijgewerkt naar het huidige tijdstip.
