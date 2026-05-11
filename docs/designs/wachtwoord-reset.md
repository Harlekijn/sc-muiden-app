# Wachtwoord Reset
<!-- generated: 2026-05-11 -->

## Samenvatting

De "Wachtwoord vergeten"-knop in de mobiele app stuurt al een reset-e-mail, maar de herstelkoppeling daarin leidt nergens naartoe — er bestaat geen callback-pagina. Deze feature voegt de ontbrekende stukken toe: een CMS-webpagina waar de gebruiker een nieuw wachtwoord instelt, een "Wachtwoord vergeten"-formulier in de CMS-loginpagina, en een beheerder-actie om een resetmail te sturen namens een lid.

---

## Gebruiksscenario's (Use Cases)

```
UC-01 — Lid/ouder kan een herstelmail aanvragen via de mobiele app
        zodat ze toegang herwinnen na een vergeten wachtwoord.

UC-02 — Lid/ouder/beheerder/commissielid kan een nieuw wachtwoord instellen
        via de CMS-webpagina (na klikken op de herstelkoppeling)
        zodat ze hun account kunnen hervatten.

UC-03 — Beheerder kan een herstelmail sturen voor een specifiek lid vanuit de CMS
        zodat een lid geholpen wordt zonder de beheerder te bellen.
```

---

## Gebruikersstromen (User Flows)

### UC-01 — Herstelmail aanvragen (app)

**Happy path:**
1. Gebruiker opent de mobiele app op het loginscherm.
2. Gebruiker tikt op "Wachtwoord vergeten?".
3. App navigeert naar het "Wachtwoord vergeten"-scherm.
4. Gebruiker vult zijn e-mailadres in.
5. Gebruiker tikt op "Herstelkoppeling sturen".
6. App roept `supabase.auth.resetPasswordForEmail(email, { redirectTo: EXPO_PUBLIC_RESET_REDIRECT_URL })` aan.
7. App toont bevestigingsscherm: "Controleer je e-mail. Als je e-mailadres bekend is, ontvang je een herstelkoppeling."

**Foutpad — e-mail niet ingevuld:**
- Formuliervalidatie blokkeert verzending; foutmelding onder het veld.

**Foutpad — onverwachte Supabase-fout:**
- Generieke foutmelding: "Er is een fout opgetreden. Probeer het opnieuw."
- Bevestigingsmelding wordt bewust ook getoond bij een onbekend e-mailadres (enumeration-preventie).

---

### UC-02 — Nieuw wachtwoord instellen (web)

**Happy path:**
1. Gebruiker opent de herstelkoppeling in de e-mail; browser navigeert naar `/auth/wachtwoord-reset?code=xxx`.
2. Server-component wisselt de code uit via `supabase.auth.exchangeCodeForSession(code)`.
3. Sessie van type `recovery` is ingesteld in cookies.
4. Pagina toont het formulier "Nieuw wachtwoord instellen".
5. Gebruiker vult nieuw wachtwoord + bevestiging in.
6. Client roept `supabase.auth.updateUser({ password })` aan.
7. Client werkt `profiles.password_changed_at = now()` bij.
8. Pagina toont succesmelding: "Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS."

**Foutpad — vervallen of al gebruikte koppeling:**
- `exchangeCodeForSession` geeft een fout terug.
- Pagina toont: "Deze koppeling is niet meer geldig."
- Geen verdere actie of link.

**Foutpad — wachtwoorden komen niet overeen:**
- Client-validatie blokkeert verzending; foutmelding onder bevestigingsveld.

**Foutpad — wachtwoord voldoet niet aan eisen:**
- Client-validatie blokkeert verzending; specifieke foutmelding.

**Foutpad — Supabase `updateUser` mislukt:**
- Generieke foutmelding boven het formulier: "Er is een fout opgetreden. Probeer het opnieuw."

---

### UC-03 — Beheerder stuurt resetmail (CMS)

**Happy path:**
1. Beheerder navigeert naar Dashboard → Leden.
2. Beheerder ziet sectie "Stuur wachtwoord-resetmail".
3. Beheerder vult het e-mailadres van het lid in.
4. Beheerder klikt op "Stuur resetmail".
5. Client roept `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/wachtwoord-reset' })` aan.
6. Succesbericht: "Resetmail verstuurd naar [e-mail]."

**Foutpad — Supabase-fout:**
- Foutmelding: "Er is een fout opgetreden. Controleer het e-mailadres en probeer opnieuw."

---

## Acceptatiecriteria

### UC-01

```
Gegeven een gebruiker op het loginscherm,
als hij tikt op "Wachtwoord vergeten?" en een geldig e-mailadres invult,
dan wordt een bevestigingsmelding getoond en is een resetmail te vinden in Inbucket.

Gegeven een gebruiker op het loginscherm,
als hij tikt op "Wachtwoord vergeten?" en een onbekend e-mailadres invult,
dan wordt dezelfde bevestigingsmelding getoond (geen onderscheid zichtbaar voor de gebruiker).

Gegeven het "Wachtwoord vergeten"-scherm,
als het e-mailveld leeg is en de gebruiker op verzenden tikt,
dan blijft het formulier staan met een validatiefout in het Dutch.
```

### UC-02

```
Gegeven een geldige herstelkoppeling in de browser,
als de gebruiker een nieuw wachtwoord van minimaal 8 tekens met 1 hoofdletter en 1 cijfer invult en bevestigt,
dan wordt het wachtwoord bijgewerkt, profiles.password_changed_at gevuld, en de succesmelding getoond.

Gegeven een vervallen herstelkoppeling,
als de pagina laadt,
dan wordt "Deze koppeling is niet meer geldig" getoond zonder formulier.

Gegeven het resetformulier,
als wachtwoord en bevestiging niet overeenkomen,
dan wordt het formulier niet verzonden en verschijnt een foutmelding op het bevestigingsveld.

Gegeven het resetformulier,
als het wachtwoord geen hoofdletter bevat,
dan wordt het formulier niet verzonden en verschijnt een specifieke foutmelding.
```

### UC-03

```
Gegeven een ingelogde beheerder op de Leden-pagina,
als hij een geldig e-mailadres invult en op "Stuur resetmail" klikt,
dan verschijnt het succesbericht en is een resetmail te vinden in Inbucket.

Gegeven een ingelogde commissielid,
als hij de Leden-pagina bezoekt,
dan is de sectie "Stuur wachtwoord-resetmail" NIET zichtbaar.
```

---

## UI / Graphical Design

### 1 — WachtwoordVergetenScreen (app)

**Naam:** Wachtwoord vergeten
**Route:** `/(auth)/wachtwoord-vergeten` *(bestaand, minimale wijziging)*
**Lay-out:** Geen UI-wijziging. Enige aanpassing: `redirectTo` gebruikt `process.env.EXPO_PUBLIC_RESET_REDIRECT_URL`.

---

### 2 — WachtwoordVergetenPage (web CMS)

**Naam:** Wachtwoord vergeten
**Route:** `/wachtwoord-vergeten` (`apps/web/app/(auth)/wachtwoord-vergeten/page.tsx`)
**Lay-out:** Centered card op navy achtergrond, zelfde opmaak als CMS-loginpagina.

**Componenten:**
- Achtergrond: `var(--color-navy)`, volledig scherm
- Card: `var(--color-white)`, `var(--radius-lg)`, `var(--shadow-modal)`, max-breedte 400px
- Titel: `var(--font-display)`, `var(--text-3xl)`, `var(--color-navy)` — "SC Muiden"
- Subtitel: `var(--color-text-2)`, `var(--text-base)` — "Beheeromgeving"
- Sectietitel: `var(--text-lg)`, `600`, `var(--color-navy)` — "Wachtwoord vergeten"
- Omschrijving: `var(--color-text-2)`, `var(--text-sm)` — "Voer je e-mailadres in. We sturen je een koppeling om je wachtwoord te herstellen."
- E-mailveld: label "E-mailadres", `type="email"`, border `rgba(1,29,80,0.12)`, `var(--radius-md)`
- Knop: "Herstelkoppeling sturen", `var(--color-navy)` achtergrond, `var(--color-white)` tekst, `var(--radius-md)`, min-height 44px
- Teruglink: "Terug naar inloggen" → `/login`, `var(--color-blue)`, `var(--text-sm)`

**Lege/succestoestand:**
- Na verzending: succeskaart met tekst "Controleer je e-mail. Als je e-mailadres bekend is, ontvang je een herstelkoppeling." met teruglink naar `/login`.

**Foutmelding:** "Er is een fout opgetreden. Probeer het opnieuw." in banner boven het veld, achtergrond `#fde8e8`, tekst `var(--color-error)`.

**Laadindicator:** Knoptekst wijzigt naar "Bezig…", knop uitgeschakeld.

---

### 3 — WachtwoordResetPage (web CMS)

**Naam:** Nieuw wachtwoord instellen
**Route:** `/auth/wachtwoord-reset` (`apps/web/app/auth/wachtwoord-reset/page.tsx`)
**Lay-out:** Centered card op navy achtergrond.

**Componenten:**
- Zelfde shell als WachtwoordVergetenPage
- Titel: "SC Muiden"
- Sectietitel: "Nieuw wachtwoord instellen"
- Wachtwoordveld: label "Nieuw wachtwoord", `type="password"`, `autoComplete="new-password"`
- Bevestigingsveld: label "Wachtwoord bevestigen", `type="password"`, `autoComplete="new-password"`
- Wachtwoordhint: `var(--color-text-2)`, `var(--text-xs)` — "Minimaal 8 tekens, 1 hoofdletter, 1 cijfer"
- Knop: "Wachtwoord opslaan", `var(--color-navy)`, min-height 44px

**Vervallen koppeling (aparte weergave):**
- Titel: "Koppeling niet meer geldig"
- Body: "Deze koppeling is niet meer geldig." — `var(--color-text-2)`
- Geen verdere actie of link

**Succestoestand (na updateUser):**
- Titel: "Wachtwoord gewijzigd"
- Body: "Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS."
- Geen knop (gebruiker opent app zelf)

**Foutmelding:** Banner boven formulier, achtergrond `#fde8e8`, `var(--color-error)`.
**Laadindicator:** Knoptekst "Bezig…", knop uitgeschakeld.

---

### 4 — Beheerder resetmail sectie (CMS Leden-pagina)

**Naam:** Stuur wachtwoord-resetmail
**Route:** `/dashboard/leden` (`apps/web/app/dashboard/leden/page.tsx`, bestaande pagina uitbreiden)
**Lay-out:** Sectie onderaan de pagina, gescheiden van toekomstig ledenbeheer.

**Componenten:**
- Sectieheader: `var(--font-display)`, `var(--text-xl)`, `var(--color-navy)` — "Wachtwoord-resetmail sturen"
- Omschrijving: `var(--color-text-2)`, `var(--text-sm)` — "Stuur een gebruiker een koppeling om zijn wachtwoord in te stellen. Alleen zichtbaar voor beheerders."
- E-mailveld: label "E-mailadres van de gebruiker", `type="email"`, `var(--radius-md)`, border `rgba(1,29,80,0.12)`
- Knop: "Stuur resetmail", `var(--color-navy)`, `var(--radius-md)`, min-height 44px
- Succesbericht (inline): `var(--color-text-2)` tekst — "Resetmail verstuurd naar [e-mail]."
- Foutmelding (inline): `var(--color-error)` tekst — "Er is een fout opgetreden. Controleer het e-mailadres en probeer opnieuw."

**Zichtbaarheidsregel:** Sectie wordt alleen gerenderd als `profile.role === 'beheerder'`.

---

## Technisch Design

### Database wijzigingen

**Tabel: `profiles` (aanpassing)**

Voeg één kolom toe:

```sql
ALTER TABLE public.profiles
  ADD COLUMN password_changed_at timestamptz;
```

- Geen nieuwe RLS-policies nodig: de bestaande `users_update_own_profile` policy (`using (auth.uid() = id)`) dekt de update van deze kolom.
- Geen index nodig: de kolom wordt niet gebruikt in queries of RLS WHERE-clauses.

**Migratiebestand:** `YYYYMMDDHHMMSS_add_password_changed_at.sql`

---

### Gedeelde types (`packages/shared/src/`)

**Nieuw schema in `packages/shared/src/schemas/auth.schema.ts`:**

```ts
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Wachtwoord minimaal 8 tekens')
      .regex(/[A-Z]/, 'Wachtwoord moet minimaal één hoofdletter bevatten')
      .regex(/[0-9]/, 'Wachtwoord moet minimaal één cijfer bevatten'),
    passwordBevestiging: z.string().min(1, 'Bevestig je wachtwoord'),
  })
  .refine((data) => data.password === data.passwordBevestiging, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['passwordBevestiging'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

Exporteer `resetPasswordSchema` en `ResetPasswordInput` via `packages/shared/src/index.ts`.

`supabase gen types typescript --local` moet opnieuw worden uitgevoerd na de migratie.

---

### Mobiele implementatie (`apps/mobile/`)

**Gewijzigd bestand: `apps/mobile/app/(auth)/wachtwoord-vergeten.tsx`**

Vervang de hardcoded `redirectTo`:

```ts
// Oud:
{ redirectTo: 'scmuiden://auth/callback' }

// Nieuw:
{ redirectTo: process.env.EXPO_PUBLIC_RESET_REDIRECT_URL }
```

Voeg toe aan `apps/mobile/.env.local`:
```
EXPO_PUBLIC_RESET_REDIRECT_URL=http://localhost:3000/auth/wachtwoord-reset
```

Geen nieuwe schermen of hooks — de app-kant is verder compleet.

---

### Web CMS implementatie (`apps/web/`)

**Nieuw: `apps/web/app/(auth)/wachtwoord-vergeten/page.tsx`**
- `'use client'`
- Formulier: e-mailadres invoer + knop
- Bij verzending: `createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/wachtwoord-reset' })`
- Succestoestand: bevestigingstekst + teruglink naar `/login`
- Foutmelding: generieke banner

**Gewijzigd: `apps/web/app/(auth)/login/page.tsx`**
- Voeg link "Wachtwoord vergeten?" toe onder de inlogknop → navigeert naar `/wachtwoord-vergeten`

**Nieuw: `apps/web/app/auth/wachtwoord-reset/page.tsx`**

Structuur: server component + client formulier component.

```tsx
// Server component (page.tsx)
export default async function WachtwoordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code) return <KoppelingNietGeldig />;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return <KoppelingNietGeldig />;

  return <NieuwWachtwoordForm />;
}
```

```tsx
// 'use client' — NieuwWachtwoordForm
// useForm met resetPasswordSchema
// Bij submit: supabase.auth.updateUser({ password })
//   daarna: supabase.from('profiles').update({ password_changed_at: new Date().toISOString() }).eq('id', session.user.id)
// Succestoestand: statische bevestigingstekst
```

**Gewijzigd: `apps/web/app/dashboard/leden/page.tsx`**
- Converteren naar `'use client'`
- Fetch `profile.role` via Supabase browser client om beheerder-check client-side uit te voeren
- Sectie "Stuur wachtwoord-resetmail" alleen renderen als `role === 'beheerder'`
- Bij submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/wachtwoord-reset' })`

**Implementatievolgorde:**
1. DB migratie
2. `supabase db reset` + `supabase gen types typescript --local`
3. `resetPasswordSchema` + `ResetPasswordInput` in shared
4. `EXPO_PUBLIC_RESET_REDIRECT_URL` toevoegen aan `apps/mobile/.env.local`
5. `wachtwoord-vergeten.tsx` (app) — update `redirectTo`
6. `apps/web/app/(auth)/wachtwoord-vergeten/page.tsx` (nieuw)
7. `apps/web/app/(auth)/login/page.tsx` — voeg link toe
8. `apps/web/app/auth/wachtwoord-reset/page.tsx` (nieuw)
9. `apps/web/app/dashboard/leden/page.tsx` — voeg admin-sectie toe
10. Tests

---

## GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Minimaal — e-mailadres voor verzending, `password_changed_at` als metadata | — |
| Wettelijke grondslag | Uitvoering van overeenkomst (accountbeheer) | — |
| Data van kinderen (< 16 jaar)? | Mogelijk — leden kunnen jonger zijn | Geen extra verwerking; wachtwoord-reset gaat via ouder/voogd e-mail |
| Bewaartermijn | `password_changed_at` — onbeperkt, zolang account bestaat; soft-delete geldt al | — |
| Toegang beperkt via RLS? | Ja — bestaande `users_update_own_profile` policy dekt update van `password_changed_at` | — |
| PII in logs vermeden? | Ja — geen e-mailadressen of tokens in logs | — |
| Data binnen EU (Supabase EU-region)? | Ja — bestaande Supabase EU-project | — |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete + export bestaat al | — |

---

## Scenario-updates

Hoogste bestaande scenario-nummer: **07**. Nieuwe scenarios starten bij **08**.

### Te updaten: `docs/scenarios/01-authenticatie.md`

Voeg toe na S01-G:

---

#### S01-J — Nieuw wachtwoord instellen via webpagina (vervolg op S01-G)

**Doel:** Een gebruiker die de herstelmail heeft ontvangen, kan via de webpagina een nieuw wachtwoord instellen en daarna inloggen.

**Vereisten:** S01-G is doorlopen; reset-e-mail staat in Inbucket.

**Stappen:**

1. Open Inbucket op http://127.0.0.1:54324.
2. Open de inbox voor `e2e-lid@e2e.scmuiden.test`.
3. Open de reset-e-mail en klik op de herstelkoppeling.
4. De browser navigeert naar `http://localhost:3000/auth/wachtwoord-reset?code=xxx`.
5. Het formulier "Nieuw wachtwoord instellen" verschijnt.
6. Vul in: Nieuw wachtwoord `NieuwWachtwoord123!`, Bevestiging `NieuwWachtwoord123!`.
7. Klik op "Wachtwoord opslaan".

**Verwacht resultaat:**

- De succesmelding "Je wachtwoord is gewijzigd. Je kunt nu inloggen in de app of het CMS." verschijnt.
- Het formulier is niet meer zichtbaar.

**Verificatie via Supabase Studio:**

- Navigeer naar Table Editor → `profiles`.
- De rij voor `e2e-lid@e2e.scmuiden.test` heeft een gevulde `password_changed_at`.

---

#### S01-K — Vervallen herstelkoppeling

**Doel:** Een verlopen of al gebruikte koppeling toont een duidelijke foutmelding, zonder formulier.

**Stappen:**

1. Navigeer handmatig naar `http://localhost:3000/auth/wachtwoord-reset` (zonder `?code=` parameter).

**Verwacht resultaat:**

- De pagina toont "Deze koppeling is niet meer geldig."
- Er is geen wachtwoordformulier zichtbaar.

---

### Nieuw bestand: `docs/scenarios/08-wachtwoord-reset.md`

```markdown
# Scenario: Wachtwoord-resetmail door beheerder

Covers de admin-gestuurde wachtwoord-reset vanuit het CMS-dashboard.

**Prerequisites:** Local Supabase running (`supabase start`), seed data applied, beheerder ingelogd in het CMS als `e2e-beheerder@e2e.scmuiden.test`.

---

## S08-A — Beheerder stuurt resetmail voor een lid

**Doel:** Een beheerder kan via de Leden-pagina een resetmail sturen naar een lid.

**Stappen:**

1. Log in op het CMS als `e2e-beheerder@e2e.scmuiden.test`.
2. Navigeer naar Dashboard → Leden.
3. Zoek de sectie "Wachtwoord-resetmail sturen".
4. Vul in het e-mailveld: `e2e-lid@e2e.scmuiden.test`.
5. Klik op "Stuur resetmail".

**Verwacht resultaat:**

- Het succesbericht "Resetmail verstuurd naar e2e-lid@e2e.scmuiden.test." verschijnt.
- Open Inbucket op http://127.0.0.1:54324 → inbox van `e2e-lid@e2e.scmuiden.test`: een reset-e-mail staat klaar.

---

## S08-B — Commissielid heeft geen toegang tot de reset-sectie

**Doel:** De admin-sectie is alleen zichtbaar voor beheerders, niet voor commissieleden.

**Stappen:**

1. Log in op het CMS als een gebruiker met rol `commissielid`.
2. Navigeer naar Dashboard → Leden.

**Verwacht resultaat:**

- De sectie "Wachtwoord-resetmail sturen" is niet zichtbaar op de pagina.
```

---

## Implementatieplan

1. **Migratie aanmaken**
   - Bestand: `supabase/migrations/YYYYMMDDHHMMSS_add_password_changed_at.sql`
   - Inhoud: `ALTER TABLE public.profiles ADD COLUMN password_changed_at timestamptz;`

2. **Migratie toepassen en types genereren**
   - `supabase db reset`
   - `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`

3. **`resetPasswordSchema` toevoegen**
   - Bestand: `packages/shared/src/schemas/auth.schema.ts`
   - Exporteer ook via `packages/shared/src/index.ts`

4. **Env-variabele toevoegen (app)**
   - Bestand: `apps/mobile/.env.local`
   - Voeg toe: `EXPO_PUBLIC_RESET_REDIRECT_URL=http://localhost:3000/auth/wachtwoord-reset`

5. **`redirectTo` updaten in de app**
   - Bestand: `apps/mobile/app/(auth)/wachtwoord-vergeten.tsx`
   - Vervang `'scmuiden://auth/callback'` door `process.env.EXPO_PUBLIC_RESET_REDIRECT_URL`

6. **CMS "Wachtwoord vergeten"-pagina aanmaken**
   - Bestand: `apps/web/app/(auth)/wachtwoord-vergeten/page.tsx`
   - `'use client'`, formulier met e-mailveld, `resetPasswordForEmail`, succestoestand

7. **Link toevoegen aan CMS-loginpagina**
   - Bestand: `apps/web/app/(auth)/login/page.tsx`
   - Voeg "Wachtwoord vergeten?"-link toe onder de inlogknop → `/wachtwoord-vergeten`

8. **Wachtwoord-resetpagina aanmaken (web)**
   - Bestand: `apps/web/app/auth/wachtwoord-reset/page.tsx`
   - Server component: `exchangeCodeForSession`, render formulier of foutmelding
   - Client component `NieuwWachtwoordForm`: `useForm` met `resetPasswordSchema`, `updateUser`, `profiles.password_changed_at` bijwerken

9. **Beheerder-sectie toevoegen aan Leden-pagina**
   - Bestand: `apps/web/app/dashboard/leden/page.tsx`
   - `'use client'`, rolcheck (`beheerder` only), formulier voor e-mailadres, `resetPasswordForEmail`

10. **Tests aanmaken**
    - `packages/shared/src/__tests__/auth.schema.test.ts` — uitbreiden met `resetPasswordSchema` tests
    - `apps/web/app/auth/wachtwoord-reset/__tests__/page.test.tsx` — verlopen koppeling + succespad

11. **Verificatie**
    - `pnpm typecheck`
    - `pnpm test`
    - `pnpm lint`

12. **Scenario-bestanden bijwerken**
    - `docs/scenarios/01-authenticatie.md` — S01-J en S01-K toevoegen
    - `docs/scenarios/08-wachtwoord-reset.md` — nieuw aanmaken (S08-A, S08-B)

---

## Open vragen

- De `registerSchema` hanteert alleen `min(8)` voor het wachtwoord — geen uppercase/cijfer-eis. Overweeg deze schema in dezelfde PR te verstrengen voor consistentie.
- Productie-URL voor `EXPO_PUBLIC_RESET_REDIRECT_URL` is nog niet vastgesteld (CMS-domein onbekend). Configureer dit zodra het CMS wordt uitgerold.

---

## SRE Notes

**Datum:** 11-05-2026

### Logging
- Geen edge functions of server-side API routes geïntroduceerd — geen logging-vereisten van toepassing.
- Geen PII (e-mailadressen, namen, member IDs) in enig log-statement aangetroffen.

### Monitoring
- Geen nieuwe tabellen geïntroduceerd — alleen kolom `password_changed_at` toegevoegd aan bestaande `profiles` tabel.
- Geen index nodig: kolom wordt enkel geschreven, niet gefilterd in queries of RLS-policies.
- Geen nieuwe React Query hooks of edge functions.

### Foutafhandeling
- Netwerkfout-detectie toegevoegd aan alle 4 client-side formulieren: `apps/mobile/app/(auth)/wachtwoord-vergeten.tsx`, `apps/web/app/(auth)/wachtwoord-vergeten/page.tsx`, `apps/web/app/auth/wachtwoord-reset/NieuwWachtwoordForm.tsx`, `apps/web/app/dashboard/leden/page.tsx`.
- Bij fetch-fout wordt nu getoond: "Geen verbinding — controleer je internetverbinding en probeer opnieuw."
- Alle overige foutmeldingen zijn in het Nederlands, bevatten geen ruwe Supabase-tekst, en geven een actie aan.
- Verzendknoppen uitgeschakeld tijdens in-flight requests (`disabled={isSubmitting}` / `loading={isSubmitting}`).

### Beveiliging
- Geen nieuwe RLS-policies geïntroduceerd; bestaande `users_update_own_profile` policy dekt de schrijftoegang tot `password_changed_at`.
- Alle formulierinvoer gevalideerd via Zod (`forgotPasswordSchema`, `resetPasswordSchema`) vóór elke Supabase-aanroep.
- `EXPO_PUBLIC_RESET_REDIRECT_URL` is een URL, geen secret — geen beveiligingsrisico.
- `SUPABASE_SECRET_KEY` niet aangeraakt in deze feature.
- Geen bestandsuploads.

### Bundle
- Geen nieuwe packages toegevoegd aan `apps/mobile/package.json` of root `package.json`.

### Openstaande punten
- Productie-URL voor `EXPO_PUBLIC_RESET_REDIRECT_URL` moet worden ingesteld bij uitrol van het CMS (CMS-domein nog onbekend).
