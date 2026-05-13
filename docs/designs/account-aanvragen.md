# Design: account-aanvragen
<!-- generated: 2026-05-13 -->

## Gebruiksscenario's (Use Cases)

- `UC-01` — Nieuwe gebruiker kan een account aanvragen (naam, e-mail, geboortedatum) zodat de admin het kan beoordelen.
- `UC-02` — Admin kan een account aanvraag goedkeuren en aan één of meerdere leden koppelen zodat de gebruiker een uitnodiging ontvangt.
- `UC-03` — Admin kan een account aanvraag afwijzen zodat niet-leden geen toegang krijgen.
- `UC-04` — Gebruiker kan wachtwoord instellen via de uitnodigingslink zodat het account geactiveerd wordt.
- `UC-05` — Admin kan een gezinsverzoek goedkeuren via de CMS (zonder Supabase Studio) zodat het gezinslid zichtbaar wordt in de app.
- `UC-06` — Admin kan een gezinsverzoek afwijzen via de CMS zodat afgewezen verzoeken duidelijk zichtbaar zijn.

---

## Gebruikersstromen (User Flows)

### UC-01 — Account aanvragen (mobiel)

**Happy path:**
1. Gebruiker opent de app op het loginscherm.
2. Tikt op "Account aanvragen".
3. Het scherm "Account aanvragen" opent met drie velden: naam, e-mailadres, geboortedatum (optioneel).
4. Gebruiker vult de verplichte velden in.
5. Tikt op "Aanvraag indienen".
6. App toont het bevestigingsscherm: "Aanvraag ingediend — Je ontvangt een e-mail zodra je account is goedgekeurd."

**Foutpaden:**
- Naam of e-mail leeg → inline validatiefout in het Nederlands onder het veld.
- E-mail ongeldig formaat → "Ongeldig e-mailadres."
- E-mail heeft al een actieve aanvraag (pending of approved) → "Er bestaat al een aanvraag voor dit e-mailadres."
- Netwerkfout → "Er is iets misgegaan. Controleer je verbinding en probeer het opnieuw."

---

### UC-02 — Account aanvraag goedkeuren (CMS)

**Happy path:**
1. Admin navigeert naar `/dashboard/account-aanvragen`.
2. Tab "In behandeling" toont de openstaande aanvragen.
3. Admin bekijkt een aanvraag: naam, e-mail, geboortedatum, datum ingediend.
4. Admin typt in het zoekveld "Zoek lid..." en selecteert het juiste lid (of meerdere leden) uit de dropdown.
5. Klikt "Goedkeuren en uitnodigen".
6. Systeem roept `inviteUserByEmail` aan → auth-account aangemaakt → profiel aangemaakt → leden gekoppeld.
7. Aanvraag verdwijnt uit "In behandeling" en verschijnt in "Afgehandeld" als "Goedgekeurd".
8. Gebruiker ontvangt uitnodigingsmail van Supabase.

**Foutpaden:**
- Geen lid geselecteerd → "Goedkeuren en uitnodigen"-knop uitgeschakeld.
- Supabase invite mislukt (e.g. e-mail al in auth) → foutmelding "Uitnodiging kon niet worden verzonden. Controleer of dit e-mailadres al een account heeft.", status blijft pending.
- Aanvraag heeft niet-pending status → 409, redirect naar overzicht.

---

### UC-03 — Account aanvraag afwijzen (CMS)

**Happy path:**
1. Admin klikt "Afwijzen" bij een aanvraag.
2. Optioneel: vult een interne notitie in.
3. Klikt "Bevestigen".
4. Aanvraag krijgt status `rejected`, verschuift naar "Afgehandeld".

---

### UC-04 — Wachtwoord instellen via uitnodigingslink

**Happy path:**
1. Gebruiker ontvangt uitnodigingsmail van Supabase.
2. Klikt op de activatielink.
3. Browser opent `/auth/wachtwoord-reset?code=xxx` (bestaande web-route).
4. Formulier "Wachtwoord instellen" verschijnt (zelfde pagina als wachtwoord-reset, andere koptekst).
5. Gebruiker vult nieuw wachtwoord in (2×, min. 8 tekens).
6. Klikt "Wachtwoord opslaan".
7. `profiles.password_changed_at` wordt gezet.
8. Succesmelding: "Je account is geactiveerd. Je kunt nu inloggen in de app."

**Foutpad:**
- Link verlopen of ongeldig → "Deze koppeling is niet meer geldig." (bestaande logica).

---

### UC-05 — Gezinsverzoek goedkeuren (CMS)

**Happy path:**
1. Admin navigeert naar `/dashboard/gezinsverzoeken`.
2. Ziet pending verzoek met naam + geboortedatum van het gevraagde gezinslid.
3. Typt in "Zoek lid..." en selecteert het juiste lid.
4. Klikt "Goedkeuren".
5. `user_family_members`-rij aangemaakt, `family_link_requests.status = approved`.
6. Verzoek verschuift naar "Afgehandeld".

**Foutpad:**
- Geen lid geselecteerd → "Goedkeuren"-knop uitgeschakeld.

---

### UC-06 — Gezinsverzoek afwijzen (CMS)

**Happy path:**
1. Admin klikt "Afwijzen" bij een verzoek.
2. Optionele notitie.
3. Bevestigt → `family_link_requests.status = rejected`, verzoek naar "Afgehandeld".

---

## Acceptatiecriteria

**UC-01**
- Gegeven het registratiescherm, als naam en e-mail correct zijn ingevuld en het e-mailadres geen actieve aanvraag heeft, dan bestaat een rij in `account_requests` met `status = 'pending'` en het bevestigingsscherm is zichtbaar.
- Gegeven het registratiescherm, als het e-mailadres al een aanvraag met `status IN ('pending', 'approved')` heeft, dan wordt de aanvraag niet ingediend en is de foutmelding "Er bestaat al een aanvraag voor dit e-mailadres." zichtbaar.
- Gegeven een eerder afgewezen aanvraag, als hetzelfde e-mailadres opnieuw wordt ingediend, dan wordt de aanvraag succesvol opgeslagen.
- Gegeven het registratiescherm, als een verplicht veld leeg is, dan is een Nederlandstalige validatiefout zichtbaar en is er geen rij aangemaakt in `account_requests`.

**UC-02**
- Gegeven een pending aanvraag, als de admin een lid koppelt en goedkeurt, dan bestaat een rij in `auth.users`, een rij in `profiles` met `member_id = member_ids[0]`, en optioneel rijen in `user_family_members` voor extra leden.
- Gegeven de goedkeuring, dan heeft `account_requests.status` de waarde `approved` en zijn `reviewed_by` en `reviewed_at` ingevuld.
- Gegeven de "Goedkeuren en uitnodigen"-knop, als geen lid is geselecteerd, dan is de knop uitgeschakeld.

**UC-03**
- Gegeven een pending aanvraag, als de admin afwijst, dan heeft `account_requests.status` de waarde `rejected`.
- Gegeven een afwijzing, dan bestaat er geen nieuw `auth.users`-record voor dat e-mailadres.

**UC-04**
- Gegeven een geldige uitnodigingslink, als de gebruiker een wachtwoord instelt, dan is `profiles.password_changed_at` niet null.
- Gegeven een ongeldige of verlopen link, dan is de melding "Deze koppeling is niet meer geldig." zichtbaar en geen formulier.

**UC-05**
- Gegeven een pending gezinsverzoek, als de admin een lid koppelt en goedkeurt, dan bestaat een rij in `user_family_members` en heeft `family_link_requests.status` de waarde `approved`.
- Gegeven de "Goedkeuren"-knop, als geen lid is geselecteerd, dan is de knop uitgeschakeld.

**UC-06**
- Gegeven een pending gezinsverzoek, als de admin afwijst, dan heeft `family_link_requests.status` de waarde `rejected` en bestaat geen nieuwe `user_family_members`-rij.

---

## UI Design

### Mobiel: Registratiescherm

**Naam:** Account aanvragen
**Route:** `/(auth)/register`
**Lay-out:** Scrollable formulier. Logo/branding bovenaan. Daarna veldgroep. Daarna primaire knop. Daarna tekstlink naar login.

**Componenten:**
- Koptekst: `ds-h2` "Account aanvragen" — kleur `--color-navy`
- Subtekst: `ds-body` "Vul je gegevens in. Een beheerder koppelt je aan de ledenadministratie en stuurt je een uitnodiging per e-mail." — kleur `--color-mid`
- TextInput "Naam" (verplicht) — `ds-body`, border `--color-border`, radius 8px, autocapitalize words
- TextInput "E-mailadres" (verplicht) — `ds-body`, keyboardType email, autocapitalize none, autocorrect off
- TextInput "Geboortedatum" (optioneel) — placeholder "DD-MM-JJJJ", hint-tekst `ds-caption` kleur `--color-mid`
- Validatiefouten: `ds-caption` kleur `--color-error`, verschijnen direct onder het veld
- Foutbanner (dubbele aanvraag): kaart met `--color-error-bg` achtergrond, icon `<AlertCircle />` Lucide outline, tekst `ds-body`
- Primaire knop "Aanvraag indienen" — `--color-blue` achtergrond, wit tekst, radius 8px, volledige breedte, disabled + tekst "Bezig..." tijdens submit
- Tekstlink onderaan: `ds-body` "Al een account? Inloggen" — kleur `--color-blue`, navigeert naar `/(auth)/login`

**Laadindicator:** Knop toont "Bezig..." en is uitgeschakeld; geen spinner elders.

---

### Mobiel: Bevestigingsscherm

**Naam:** Aanvraag ingediend
**Route:** `/(auth)/register-bevestigd`
**Lay-out:** Gecentreerd, verticaal gestapeld. Icon → titel → bodytekst → tekstlink.

**Componenten:**
- Icon: `<MailCheck />` Lucide outline, 48px, kleur `--color-blue`
- Titel: `ds-h2` "Aanvraag ingediend" — kleur `--color-navy`
- Body: `ds-body` "Je ontvangt een e-mail zodra je account is goedgekeurd door een beheerder. Houd je inbox in de gaten." — kleur `--color-mid`
- Tekstlink: "Terug naar inloggen" — kleur `--color-blue` → `/(auth)/login`

---

### CMS: Account aanvragen overzicht

**Naam:** Account aanvragen
**Route:** `/dashboard/account-aanvragen`
**Server-/clientverdeling:** Server component haalt initiële data op en geeft die door aan `<AccountAanvragenClient>` (client component) voor interactiviteit (tabs, zoeken, acties).

**Lay-out:** Pagina-header + twee tabs.

**Componenten:**
- Pagina-header: `ds-h2` "Account aanvragen"
- Tab "In behandeling" — badge (`--color-yellow` achtergrond, `--color-navy` tekst) met aantal pending
- Tab "Afgehandeld"

**Per aanvraag — "In behandeling":**
- Kaart met shadow `rgba(1, 29, 80, 0.08)`, radius 10px, padding 16px
- Rij 1: naam (`ds-body` bold, `--color-navy`), e-mail (`ds-caption`, `--color-mid`)
- Rij 2: geboortedatum (`ds-caption`, `--color-mid`) — "–" als leeg; datum ingediend (`ds-caption`, `--color-mid`) rechts uitlijnen
- Ledenzoeker: TextInput "Zoek lid op naam of e-mail..." — debounced 300ms, dropdown met max. 5 resultaten, elk resultaat toont naam + geboortedatum
- Geselecteerde leden: tags met naam en `×`-knop, kleur `--color-blue-light` (of `--color-navy` achtergrond wit tekst) — kunnen worden verwijderd vóór goedkeuring
- Knoppenrij: "Goedkeuren en uitnodigen" (primair, `--color-blue`, uitgeschakeld als geen lid geselecteerd) — "Afwijzen" (outline, rand `--color-error`, tekst `--color-error`)
- Laadindicator per kaart: knop toont "Bezig..." en spinner icon `<Loader2 />` 16px tijdens API-aanroep

**Per aanvraag — "Afgehandeld":**
- Zelfde kaartindeling, zonder ledenzoeker en knoppen
- Extra: datum afgehandeld, beoordeeld door (display_name admin)
- Statusbadge: "Goedgekeurd" — `--color-success-bg` / "Afgewezen" — `--color-error-bg`

**Lege staat "In behandeling":** Icon `<Inbox />` 32px `--color-mid`, tekst "Geen openstaande aanvragen", subtekst "Nieuwe aanvragen verschijnen hier zodra leden de app gebruiken." — `ds-caption` `--color-mid`

**Lege staat "Afgehandeld":** Icon `<CheckCircle />` 32px `--color-mid`, tekst "Nog geen afgehandelde aanvragen"

---

### CMS: Gezinsverzoeken (verbetering)

**Route:** `/dashboard/gezinsverzoeken` (bestaand, uitgebreid)

**Wijziging:** Verwijder de instructietekst "Koppel het juiste lid via Supabase Studio". Vervang door dezelfde ledenzoeker + goedkeuren/afwijzen UI als bij account aanvragen.

**Per pending verzoek — toegevoegd:**
- Ledenzoeker: TextInput "Zoek lid op naam of e-mail..."
- Geselecteerd lid: tag met naam en `×`
- Knoppen: "Goedkeuren" (primair, uitgeschakeld als geen lid geselecteerd) — "Afwijzen" (outline error)

---

### CMS: Sidebar

**Bestand:** `apps/web/app/dashboard/layout.tsx`

**Nieuwe volgorde NAV_ITEMS:**
```
Dashboard → Leden → Account aanvragen → Teams → Activiteiten → Aankondigingen → Gezinsverzoeken → Rollen → Instellingen
```

---

## Technisch Design

### Database migrations

#### Migration: `20260513100000_account_requests.sql`

```sql
-- Tabel voor account aanvragen (pre-auth, ingediend via mobiele app)
create table public.account_requests (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  email        text not null,
  birth_date   date,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  admin_notes  text,
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Unieke index: max. één actieve aanvraag per e-mailadres
-- Herindiening na afwijzing is toegestaan (rejected valt buiten de index)
create unique index account_requests_active_email_unique
  on public.account_requests (lower(email))
  where status in ('pending', 'approved');

-- Index voor admin-query (pending bovenaan, gesorteerd op datum)
create index account_requests_status_created_idx
  on public.account_requests (status, created_at desc);

-- Index op FK
create index account_requests_reviewed_by_idx
  on public.account_requests (reviewed_by)
  where reviewed_by is not null;

-- updated_at trigger
create trigger update_account_requests_updated_at
  before update on public.account_requests
  for each row execute function update_updated_at_column();

-- RLS
alter table public.account_requests enable row level security;

-- Anonieme gebruikers mogen een aanvraag indienen
create policy account_requests_insert_anon
  on public.account_requests
  for insert
  with check (true);

-- Alleen admins mogen aanvragen lezen en bijwerken
create policy account_requests_admin_all
  on public.account_requests
  for all
  using (public.is_admin());
```

#### Migration: `20260513100001_drop_member_email_exists.sql`

```sql
drop function if exists public.member_email_exists(text);
```

### Gedeelde types (`packages/shared/src/`)

**`schemas/auth.schema.ts` — toevoegen:**

```typescript
export const createAccountRequestSchema = z.object({
  display_name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten'),
  email: z.string().email('Ongeldig e-mailadres'),
  birth_date: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Gebruik het formaat DD-MM-JJJJ')
    .optional()
    .transform((val) => {
      if (!val) return null;
      const [day, month, year] = val.split('-');
      return `${year}-${month}-${day}`;
    })
    .nullable(),
});

export type CreateAccountRequestInput = z.infer<typeof createAccountRequestSchema>;
```

**`types/app.types.ts` — toevoegen:**

```typescript
export interface AccountRequest {
  id: string;
  display_name: string;
  email: string;
  birth_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Mobiele implementatie

**`apps/mobile/app/(auth)/register.tsx`** — volledig herschrijven:
- Verwijder: password, confirmPassword velden, `member_email_exists` RPC-aanroep, `supabase.auth.signUp()`
- Voeg toe: birth_date TextInput (optioneel, formaat DD-MM-JJJJ)
- Schema: gebruik `createAccountRequestSchema` uit `@sc-muiden/shared`
- Submit: roept `useSubmitAccountRequest().mutateAsync(data)` aan
- Success: navigeer naar `/(auth)/register-bevestigd`
- Error 23505 (unique violation): toon foutbanner "Er bestaat al een aanvraag voor dit e-mailadres."

**`apps/mobile/app/(auth)/register-bevestigd.tsx`** — nieuw:
- Statisch scherm (geen data nodig)
- Koptekst, icon, body, link terug naar login

**`apps/mobile/hooks/useAccountRequest.ts`** — nieuw:
```typescript
export function useSubmitAccountRequest() {
  return useMutation({
    mutationFn: async (data: CreateAccountRequestInput) => {
      const { error } = await supabase.from('account_requests').insert({
        display_name: data.display_name,
        email: data.email.toLowerCase().trim(),
        birth_date: data.birth_date ?? null,
      });
      if (error) throw error;
    },
  });
}
```

**`apps/mobile/app/_layout.tsx`** — geen wijzigingen nodig. De Supabase invite flow zorgt dat `password_changed_at` is ingesteld vóór de eerste login.

### Web CMS implementatie

**`apps/web/app/dashboard/account-aanvragen/page.tsx`** — nieuw (server component):
- Auth guard: redirect als niet `beheerder`/`commissielid`
- Haalt pending en afgehandelde aanvragen op via admin Supabase client
- Rendert `<AccountAanvragenClient initialPending={...} initialHandled={...} />`

**`apps/web/app/dashboard/account-aanvragen/_components/AccountAanvragenClient.tsx`** — nieuw (client component):
- Tabs "In behandeling" / "Afgehandeld"
- Ledenzoeker per aanvraag (debounced fetch naar `/api/cms/leden/zoek?q=`)
- Approve-actie: POST `/api/cms/account-requests/[id]/approve`
- Reject-actie: POST `/api/cms/account-requests/[id]/reject`
- Optimistische UI: aanvraag verdwijnt direct na actie uit de lijst

**`apps/web/app/api/cms/account-requests/[id]/approve/route.ts`** — nieuw:
```
POST body: { member_ids: string[] }

1. Auth + role check (beheerder/commissielid)
2. Laad account_request, controleer status = 'pending'
3. supabase.auth.admin.inviteUserByEmail(email, { data: { display_name } })
4. Haal user.id op uit response
5. UPDATE profiles SET member_id = member_ids[0] WHERE id = user.id
6. INSERT INTO user_family_members (profile_id, member_id) voor member_ids[1...]
7. UPDATE account_requests SET status='approved', reviewed_by, reviewed_at
8. Geen PII in logs — log enkel request_id + outcome
```

**`apps/web/app/api/cms/account-requests/[id]/reject/route.ts`** — nieuw:
```
POST body: { admin_notes?: string }

1. Auth + role check
2. Laad account_request, controleer status = 'pending'
3. UPDATE account_requests SET status='rejected', admin_notes, reviewed_by, reviewed_at
```

**`apps/web/app/dashboard/gezinsverzoeken/page.tsx`** — aanpassen:
- Verwijder instructietekst "Koppel het juiste lid via Supabase Studio"
- Voeg per pending verzoek toe: ledenzoeker + goedkeuren/afwijzen knoppen
- Acties via nieuwe API routes

**`apps/web/app/api/cms/gezinsverzoeken/[id]/approve/route.ts`** — nieuw:
```
POST body: { member_id: string }

1. Auth + role check
2. Laad family_link_request, controleer status = 'pending'
3. UPDATE family_link_requests SET member_id, status='approved', reviewed_by
4. INSERT INTO user_family_members (profile_id, member_id)
   -- profile_id komt van family_link_requests.profile_id
```

**`apps/web/app/api/cms/gezinsverzoeken/[id]/reject/route.ts`** — nieuw:
```
POST body: { admin_notes?: string }

1. Auth + role check
2. UPDATE family_link_requests SET status='rejected', admin_notes, reviewed_by
```

**`apps/web/app/dashboard/layout.tsx`** — aanpassen:
Voeg `{ label: 'Account aanvragen', href: '/dashboard/account-aanvragen' }` toe na `Leden`.

### Edge functions

Geen nieuwe edge functions. De Supabase `inviteUserByEmail` Admin API stuurt de uitnodigingsmail vanuit het Supabase-platform zelf.

### Implementatievolgorde

1. DB migrations: `account_requests` tabel + drop `member_email_exists`
2. `supabase db reset` + `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
3. Shared: `createAccountRequestSchema` + `AccountRequest` type
4. Mobiel: `useAccountRequest.ts` hook
5. Mobiel: `register.tsx` herschrijven + `register-bevestigd.tsx` nieuw
6. Web CMS: `account-aanvragen/page.tsx` + `AccountAanvragenClient.tsx`
7. Web CMS: API routes `account-requests/[id]/approve` + `reject`
8. Web CMS: `gezinsverzoeken/page.tsx` verbeteren
9. Web CMS: API routes `gezinsverzoeken/[id]/approve` + `reject`
10. Web CMS: `layout.tsx` sidebar update
11. Tests: unit tests schemas, API routes, component tests
12. Verificatie: `supabase db reset`, `pnpm typecheck`, `pnpm test`, `pnpm lint`

---

## GDPR Compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | ja — naam, e-mailadres, geboortedatum | — |
| Wettelijke grondslag | Uitvoering overeenkomst (aanmelding lidmaatschap) | Vastgelegd in dit design |
| Data van kinderen (< 16 jaar)? | Mogelijk — geboortedatum kan ≤ 16 zijn | RLS: anon INSERT only, geen SELECT voor niet-admins; geen tracking |
| Bewaartermijn | Aanvragen bewaard voor audit trail; afgewezen aanvragen kunnen opnieuw worden ingediend | Geen automatische verwijdering in V1 |
| Toegang beperkt via RLS? | ja — INSERT voor anon, SELECT/UPDATE alleen voor admins | Policies geschreven in migration |
| PII in logs vermeden? | ja — API routes loggen enkel `request_id` en `outcome`, nooit naam of e-mail | Geen `console.error` met PII |
| Data binnen EU (Supabase EU-region)? | ja — Supabase EU-region project | Controleer project-regio voor productie |
| Bewerkingsverzoek (DSAR) mogelijk? | ja — admin kan aanvraag via Studio verwijderen | Geen extra implementatie nodig |

---

## Scenario wijzigingen

### Bijwerken: `docs/scenarios/01-authenticatie.md`

Vervang **S01-D** en **S01-E** volledig door de nieuwe flow. De bestaande scenario's gaan uit van registratie met wachtwoord + e-mailcheck, wat niet meer geldt.

**S01-D (nieuw):** Registreren → aanvraag ingediend (zie 14-account-aanvragen.md S14-A)
**S01-E (nieuw):** Dubbele aanvraag (zie 14-account-aanvragen.md S14-B)

### Bijwerken: `docs/scenarios/03-gezin-koppelen.md`

Vervang **S03-E** (Admin links via Supabase Studio) door de nieuwe CMS-flow (zie 14-account-aanvragen.md S14-G).

### Nieuw: `docs/scenarios/14-account-aanvragen.md`

---

## Scenarios (volledige inhoud)

### Bestand: `docs/scenarios/14-account-aanvragen.md`

```markdown
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

1. In de kaart voor "Nieuw Testlid", tik in het zoekveld "Zoek lid op naam of e-mail...".
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
3. Tik in het zoekveld "Zoek lid op naam of e-mail..." en typ "Tweede".
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
- `family_link_requests`: status = `rejected`.
- `user_family_members`: geen nieuwe rij aangemaakt.
```

---

## Implementatielijst

1. `supabase/migrations/20260513100000_account_requests.sql` — tabel, indexes, RLS
2. `supabase/migrations/20260513100001_drop_member_email_exists.sql` — drop functie
3. `supabase db reset` uitvoeren
4. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
5. `packages/shared/src/schemas/auth.schema.ts` — voeg `createAccountRequestSchema` toe
6. `packages/shared/src/types/app.types.ts` — voeg `AccountRequest` interface toe
7. `apps/mobile/hooks/useAccountRequest.ts` — nieuw
8. `apps/mobile/app/(auth)/register.tsx` — herschrijven (verwijder wachtwoordvelden + email-check, voeg geboortedatum toe)
9. `apps/mobile/app/(auth)/register-bevestigd.tsx` — nieuw
10. `apps/web/app/dashboard/account-aanvragen/page.tsx` — nieuw (server component)
11. `apps/web/app/dashboard/account-aanvragen/_components/AccountAanvragenClient.tsx` — nieuw (client component)
12. `apps/web/app/api/cms/account-requests/[id]/approve/route.ts` — nieuw
13. `apps/web/app/api/cms/account-requests/[id]/reject/route.ts` — nieuw
14. `apps/web/app/dashboard/gezinsverzoeken/page.tsx` — aanpassen (ledenzoeker + knoppen)
15. `apps/web/app/api/cms/gezinsverzoeken/[id]/approve/route.ts` — nieuw
16. `apps/web/app/api/cms/gezinsverzoeken/[id]/reject/route.ts` — nieuw
17. `apps/web/app/dashboard/layout.tsx` — "Account aanvragen" toevoegen aan NAV_ITEMS
18. Tests: `apps/web/app/api/cms/account-requests/[id]/__tests__/route.test.ts`
19. Tests: `apps/web/app/api/cms/gezinsverzoeken/[id]/__tests__/route.test.ts`
20. Tests: `apps/mobile/hooks/__tests__/useAccountRequest.test.ts`
21. `docs/scenarios/14-account-aanvragen.md` — aanmaken
22. `docs/scenarios/01-authenticatie.md` — S01-D en S01-E vervangen
23. `docs/scenarios/03-gezin-koppelen.md` — S03-E vervangen
24. Verificatie: `pnpm typecheck && pnpm test && pnpm lint`

---

## Open vragen

_Geen open vragen. Alle beslissingen vastgesteld in de planningssessie._
