# home-feed-en-notificaties
<!-- generated: 2026-05-08 -->

## Samenvatting

Leden en ouders ontvangen push-herinneringen voor wedstrijden (24u van tevoren), bardiensten (48u) en trainingen (24u), en kunnen per type instellen of ze deze willen. De home-tab toont een "Vandaag"- en "Binnenkort"-sectie als dagelijks overzicht.

---

## 1. Gebruik-scenario's (Use Cases)

| ID | Rol | Actie | Resultaat |
|---|---|---|---|
| UC-01 | Lid / ouder | ziet aankomende activiteiten op het thuisscherm | snel scannen welke activiteiten vandaag en deze week zijn gepland |
| UC-02 | Lid / ouder | ontvangt push 24u voor een wedstrijd | op tijd klaarstaan voor de wedstrijd |
| UC-03 | Lid / ouder | ontvangt push 48u voor een bardienst | bardienst niet vergeten |
| UC-04 | Lid / ouder | ontvangt push 24u voor een training | op tijd klaarstaan voor de training |
| UC-05 | Lid / ouder | stelt in welke notificatietypen actief zijn | geen ongewenste meldingen ontvangen |
| UC-06 | Systeem | voorkomt dubbele notificatie bij cron-retry | nooit twee keer dezelfde herinnering |
| UC-07 | Systeem | slaat notificatie over als push-token ontbreekt | geen crash; notificatie-record wél aangemaakt |

---

## 2. Gebruikersstromen (User Flows)

### UC-01 — Home feed bekijken

Happy path:
1. Gebruiker opent app → thuisscherm (`/(tabs)/`) laadt.
2. "Vandaag"-sectie toont activiteiten die vandaag beginnen, gesorteerd op starts_at ASC.
3. "Binnenkort"-sectie toont activiteiten van morgen t/m 7 dagen vooruit, gegroepeerd per dag.
4. Pull-to-refresh herlaadt beide secties.

Foutpaden:
- **Geen verbinding**: gecachte React Query-data tonen; "Geen verbinding"-banner bovenaan.
- **Geen activiteiten vandaag**: lege staat "Geen activiteiten vandaag."
- **Geen activiteiten binnenkort**: lege staat "Niets gepland de komende week."

### UC-02/03/04 — Push-herinnering ontvangen

Happy path:
1. Cron-job `reminder-scheduler` draait dagelijks om 06:00.
2. Zoekt activiteiten met starts_at in het herinneringsvenster (24u/48u vooruit).
3. Per activiteit: bepaal betrokken gezinsleden via `team_members` (training/wedstrijd) of `bar_assignments` (bardienst).
4. Per gezinslid: zoek parent-profile via `user_family_members`.
5. Controleer `notification_preferences` van de ouder voor het activiteitstype.
6. Controleer of al een notificatie bestaat (dedup-index).
7. Voeg een rij in in `notifications`; de `push-trigger`-webhook bezorgt de push.

Foutpaden:
- **Geen push-token**: geen push, notificatie-record aangemaakt met `sent_at = null`.
- **Activiteit geannuleerd** (`deleted_at IS NOT NULL`): overslaan.
- **Notificatie al bestaat**: overslaan (dedup-index prevents duplicate insert).
- **Expo Push API fout**: log fout; `sent_at` blijft null; geen retry binnen dezelfde dag.

### UC-05 — Notificatievoorkeuren instellen

Happy path:
1. Gebruiker opent Profiel-tab → tikt op "Notificatie-instellingen".
2. Scherm toont drie toggles: Wedstrijdherinneringen, Bardienst-herinneringen, Trainingsherinneringen.
3. Gebruiker schakelt een type uit.
4. Optimistische update: toggle zet direct om; Supabase upsert op achtergrond.

Foutpad:
- **Opslaan mislukt**: toggle terugzetten; toast "Instellingen konden niet worden opgeslagen."

---

## 3. Acceptatiecriteria

**UC-01**
- Gegeven een lid met twee gezinsleden in verschillende teams, als het thuisscherm opent, dan verschijnen alle activiteiten van vandaag in de "Vandaag"-sectie, gesorteerd op starts_at.
- Gegeven geen activiteiten vandaag, als het thuisscherm opent, dan toont de "Vandaag"-sectie "Geen activiteiten vandaag."
- Gegeven een pull-to-refresh, als losgelaten, dan worden beide secties herladen vanuit Supabase.

**UC-02/03/04**
- Gegeven een wedstrijd over 24u voor team A, als de cron-job draait, dan ontvangen alle ouders van spelers in team A een push-notificatie.
- Gegeven een bardienst over 48u, als de cron-job draait, dan ontvangen de ouders van de toegewezen gezinsleden een push.
- Gegeven `notification_preferences.wedstrijd = false`, als de cron-job draait, dan ontvangt de ouder geen push voor wedstrijden maar wel voor trainingen/bardienst.
- Gegeven een notificatie al verstuurd voor activity_id + recipient_profile_id + type, als de cron-job opnieuw draait, dan wordt geen tweede notificatie aangemaakt.

**UC-05**
- Gegeven het notificatie-instellingenscherm, als de gebruiker "Wedstrijdherinneringen" uitschakelt, dan wordt `notification_preferences.wedstrijd = false` opgeslagen.
- Gegeven een nieuw account zonder `notification_preferences`-rij, dan zijn alle typen standaard aan.

---

## 4. UI-design

### 4.1 — Thuisscherm (`/(tabs)/`) — update bestaand scherm

**Route:** `apps/mobile/app/(tabs)/index.tsx` (bestaat al; uitbreiden)

**Lay-out (top → bottom):**
1. `AppHeader` — "SC Muiden", bell-icoon rechts (navigeert naar toekomstige notificatiecentrum)
2. Gezin-filterrij (bestaand)
3. ScrollView met:
   - **"Vandaag"-sectie**: sectielabel + lijst van `ActivityCard`-componenten
   - **"Binnenkort"-sectie**: dag-groep-labels + `ActivityCard`-componenten
4. Pull-to-refresh

**Sectielabel:**
- Font: `--font-display`, 13px, `--fw-bold`, uppercase, letter-spacing 0.05em
- Kleur: `--color-text-2`
- Margin-bottom: 8px

**Dag-groep-label (binnenkort):**
- Font: `--font-body`, 13px, `--fw-semibold`
- Kleur: `--color-text`
- Padding-vertical: 8px

**Lege staat — "Vandaag":**
- Tekst (ds-body, `--color-text-2`): "Geen activiteiten vandaag."
- Geen sub-tekst, geen icoon

**Lege staat — "Binnenkort":**
- Tekst (ds-body, `--color-text-2`): "Niets gepland de komende week."

**Laadindicator:** twee skeleton-cards (`--color-mid` shimmer, radius 10px, height 80px)

---

### 4.2 — Notificatie-instellingenscherm

**Naam:** Notificatie-instellingen
**Route:** `apps/mobile/app/notificatie-instellingen.tsx` (Stack-scherm, terugknop)

**Lay-out:**
1. Header: terugpijl (`<ChevronLeft />`), titel "Notificatie-instellingen" (ds-h4)
2. Card (`--color-white`, radius 10px, shadow-card) met drie rijen:
   - Rij 1: `<Bell />` icoon (24px, `--color-blue`) + label "Wedstrijdherinneringen" (ds-body) + Toggle rechts
   - Rij 2: `<Clock />` icoon + label "Bardienst-herinneringen" + Toggle
   - Rij 3: `<Dumbbell />` icoon + label "Trainingsherinneringen" + Toggle
3. Caption onder card (ds-caption, `--color-text-2`): "Herinneringen worden 24 uur van tevoren verstuurd. Bardienst-herinneringen worden 48 uur van tevoren verstuurd."

**Toggle:**
- Aan: track `--color-blue`, thumb `--color-white`
- Uit: track `--color-mid`, thumb `--color-white`
- React Native `Switch` component

**Rij-scheidingslijn:** 1px `--color-mid`, geen horizontal-padding

**Laadindicator:** drie skeleton-rijen (height 52px, `--color-mid`, radius 4px)

**Foutmelding toast:** "Instellingen konden niet worden opgeslagen." (onderaan, 3s)

---

## 5. Technisch design

### 5.1 — Database wijzigingen

#### Nieuwe tabel: `notification_preferences`

```sql
create table public.notification_preferences (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  wedstrijd   boolean     not null default true,
  bardienst   boolean     not null default true,
  training    boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(profile_id)
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.handle_updated_at();

create index notification_preferences_profile_id_idx
  on public.notification_preferences(profile_id);

alter table public.notification_preferences enable row level security;

create policy "users_manage_own_notification_preferences"
  on public.notification_preferences for all
  using (auth.uid() = profile_id);
```

#### Wijziging tabel: `notifications`

Voeg `activity_id` en `type` toe voor deduplicatie:

```sql
alter table public.notifications
  add column activity_id uuid references public.activities(id) on delete set null,
  add column type        text check (type in (
    'wedstrijd_herinnering',
    'bardienst_herinnering',
    'training_herinnering',
    'aankondiging'
  ));

create unique index notifications_dedup_idx
  on public.notifications(recipient_profile_id, activity_id, type)
  where activity_id is not null;

create index notifications_activity_id_idx on public.notifications(activity_id);
```

**Migratie-bestandsnamen:**
- `20260508120000_notification_preferences.sql`
- `20260508120001_notifications_add_activity_type.sql`

**RLS bestaande `notifications`-tabel:** geen wijziging nodig — de edge function gebruikt service_role.

---

### 5.2 — Gedeelde types (`packages/shared/src/`)

**Nieuwe Zod-schema's in `packages/shared/src/schemas/notificationPreferences.ts`:**

```ts
import { z } from 'zod';

export const NotificationPreferencesSchema = z.object({
  id:         z.string().uuid(),
  profile_id: z.string().uuid(),
  wedstrijd:  z.boolean(),
  bardienst:  z.boolean(),
  training:   z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const UpdateNotificationPreferencesSchema = z.object({
  wedstrijd: z.boolean().optional(),
  bardienst: z.boolean().optional(),
  training:  z.boolean().optional(),
});
```

**Uitbreiding `packages/shared/src/types/app.types.ts`:**

```ts
export type NotificationType =
  | 'wedstrijd_herinnering'
  | 'bardienst_herinnering'
  | 'training_herinnering'
  | 'aankondiging';
```

---

### 5.3 — Mobiele implementatie (`apps/mobile/`)

**Nieuwe React Query hooks:**

| Bestand | Query-key | Return type |
|---|---|---|
| `hooks/useNotificationPreferences.ts` | `['notification_preferences', profileId]` | `NotificationPreferences \| null` |
| `hooks/useUpdateNotificationPreferences.ts` | mutation | `void` |
| `hooks/usePushTokenRegistration.ts` | effect (geen query) | `void` |

**Push-token registratie:**
- `usePushTokenRegistration` in `_layout.tsx` — vraagt permissie op, haalt `ExpoPushToken` op, upsert in `push_tokens`.
- Vraag permissie alleen bij eerste login (controleer via `SecureStore`-flag `push_permission_asked`).
- Nederlandse permissievraag: gebruik systeem-OS dialoog (geen custom tekst mogelijk); voeg wel een pre-prompt toe: "SC Muiden wil je meldingen sturen over trainingen, wedstrijden en bardiensten."

**Nieuwe Expo Router schermen:**

| Bestand | Route |
|---|---|
| `apps/mobile/app/notificatie-instellingen.tsx` | `/notificatie-instellingen` (Stack) |

**Wijziging bestaande schermen:**

| Bestand | Wijziging |
|---|---|
| `apps/mobile/app/(tabs)/index.tsx` | Splits `useUpcomingActivities` naar "vandaag" + "binnenkort"; voeg lege staten toe |
| `apps/mobile/app/(tabs)/profiel.tsx` | Voeg "Notificatie-instellingen" rij toe in instellingen-sectie |
| `apps/mobile/app/_layout.tsx` | Roep `usePushTokenRegistration()` aan na authenticatie |

**Wijziging `useUpcomingActivities`:**
- Voeg `section: 'vandaag' | 'binnenkort'` toe aan return of splits in twee aparte hooks.
- "Vandaag": `starts_at >= vandaag 00:00 AND starts_at < morgen 00:00`
- "Binnenkort": `starts_at >= morgen 00:00 AND starts_at < vandaag + 8 dagen 00:00`

---

### 5.4 — Web CMS (`apps/web/`)

Geen CMS-schermen nodig voor V1. De cron-job en push worden volledig via Supabase Edge Functions beheerd.

---

### 5.5 — Edge functions (`supabase/functions/`)

#### `reminder-scheduler` — cron dagelijks 06:00

**Trigger:** Supabase cron (configureer in `supabase/config.toml`):
```toml
[functions.reminder-scheduler]
cron = "0 6 * * *"
```

**Logica:**

```
voor elke activiteitstype en zijn venster:
  wedstrijd/training: starts_at BETWEEN now()+22h AND now()+26h
  bardienst:          starts_at BETWEEN now()+46h AND now()+50h

voor elke activiteit:
  haal betrokken gezinsleden op:
    - training/wedstrijd: SELECT family_member_id FROM team_members WHERE team_id = activity.team_id
    - bardienst:          SELECT family_member_id FROM bar_assignments WHERE activity_id = activity.id
  voor elk gezinslid:
    haal profile_id op via user_family_members
    controleer notification_preferences voor type
    controleer of notification al bestaat (conflict on dedup-index → skip)
    INSERT INTO notifications (recipient_profile_id, activity_id, type, title, body, data)
```

**Secrets:** `SUPABASE_SERVICE_ROLE_KEY` (al beschikbaar als Supabase built-in secret)

**Logging:** log alleen `{ event: 'reminder_scheduled', activity_id, type, recipient_count }` — geen namen of e-mailadressen.

---

#### `push-trigger` — webhook op notifications INSERT

**Trigger:** Database webhook op `INSERT` op tabel `notifications`.

**Logica:**

```
haal push_tokens op voor recipient_profile_id
als geen tokens: update notifications.sent_at = null, return
roep Expo Push API aan: https://exp.host/--/api/v2/push/send
  title: notifications.title
  body: notifications.body
  data: notifications.data
als success: UPDATE notifications SET sent_at = now()
als error: log { event: 'push_failed', notification_id, error_code } — geen PII
```

**Secrets:** `EXPO_PUSH_ACCESS_TOKEN`

---

### 5.6 — Implementatievolgorde

1. Schrijf migraties `20260508120000_notification_preferences.sql` en `20260508120001_notifications_add_activity_type.sql`
2. `supabase db reset`
3. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
4. Schrijf `packages/shared/src/schemas/notificationPreferences.ts` en update `app.types.ts`
5. Schrijf `hooks/useNotificationPreferences.ts` en `hooks/useUpdateNotificationPreferences.ts`
6. Schrijf `hooks/usePushTokenRegistration.ts`
7. Update `apps/mobile/app/(tabs)/index.tsx` — "Vandaag" en "Binnenkort" secties
8. Schrijf `apps/mobile/app/notificatie-instellingen.tsx`
9. Update `apps/mobile/app/(tabs)/profiel.tsx` — instellingen-rij toevoegen
10. Update `apps/mobile/app/_layout.tsx` — push-token registratie
11. Schrijf `supabase/functions/reminder-scheduler/index.ts`
12. Schrijf `supabase/functions/push-trigger/index.ts`
13. Schrijf tests: `__tests__/notificatie-instellingen.test.tsx`; update seed
14. `pnpm typecheck && pnpm test && pnpm lint`

---

## 6. GDPR-compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Ja — push-tokens (device-identifier), activiteitsdeelname | RLS op push_tokens en notification_preferences |
| Wettelijke grondslag | Gerechtvaardigd belang (clubactiviteiten) | Vastleggen in privacybeleid |
| Data van kinderen (< 16 jaar)? | Indirect — activiteiten van kinderen triggeren notificaties aan ouder | Notificatie gaat naar ouder-account; kind-data wordt niet in push-payload opgenomen |
| Bewaartermijn | Notifications: 12 maanden; push_tokens: tot uitloggen/verwijderen | Cron-job voor cleanup notifications ouder dan 12 maanden (V2) |
| Toegang beperkt via RLS? | Ja — push_tokens, notification_preferences, notifications hebben RLS | Policies geschreven (zie §5.1) |
| PII in logs vermeden? | Ja — logs bevatten alleen activity_id, type, count | Edge function logging gedefinieerd zonder namen/e-mail |
| Data binnen EU (Supabase EU-region)? | Controleer Supabase project-regio | Verifieer dat project in `eu-west-1` of `eu-central-1` staat |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete niet van toepassing op notifications; push_tokens en preferences worden hard-deleted bij account-verwijdering (ON DELETE CASCADE) | CASCADE al ingesteld op alle FK's |

---

## 7. Scenario-wijzigingen

### Nieuwe scenariobestanden

#### `08-push-token-registratie.md` (nieuw)
Scenario S08-A t/m S08-C

#### `09-notificatie-instellingen.md` (nieuw)
Scenario S09-A t/m S09-C

#### `10-home-feed.md` (nieuw)
Scenario S10-A t/m S10-D

### Bestaande scenariobestanden bijwerken

- **`00-seed-data.md`**: voeg `notification_preferences`-rijen toe voor test-accounts (alle typen aan).
- **`05-activiteiten-kalender.md`**: geen functionele wijziging nodig; de home feed is een apart scherm.

---

## 8. Implementatieplan (checklist)

- [ ] 1. Schrijf `supabase/migrations/20260508120000_notification_preferences.sql`
- [ ] 2. Schrijf `supabase/migrations/20260508120001_notifications_add_activity_type.sql`
- [ ] 3. `supabase db reset` — verifieer dat alle migraties slagen
- [ ] 4. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
- [ ] 5. Schrijf `packages/shared/src/schemas/notificationPreferences.ts` (Zod-schema's)
- [ ] 6. Update `packages/shared/src/types/app.types.ts` — voeg `NotificationType` toe
- [ ] 7. Schrijf `apps/mobile/hooks/useNotificationPreferences.ts`
- [ ] 8. Schrijf `apps/mobile/hooks/useUpdateNotificationPreferences.ts`
- [ ] 9. Schrijf `apps/mobile/hooks/usePushTokenRegistration.ts`
- [ ] 10. Update `apps/mobile/hooks/useUpcomingActivities.ts` — splits in vandaag/binnenkort
- [ ] 11. Update `apps/mobile/app/(tabs)/index.tsx` — "Vandaag" en "Binnenkort" secties + lege staten
- [ ] 12. Schrijf `apps/mobile/app/notificatie-instellingen.tsx`
- [ ] 13. Update `apps/mobile/app/(tabs)/profiel.tsx` — "Notificatie-instellingen"-rij
- [ ] 14. Update `apps/mobile/app/_layout.tsx` — `usePushTokenRegistration()` aanroepen na auth
- [ ] 15. Schrijf `supabase/functions/reminder-scheduler/index.ts`
- [ ] 16. Schrijf `supabase/functions/push-trigger/index.ts`
- [ ] 17. Update `supabase/config.toml` — cron schedule voor reminder-scheduler
- [ ] 18. Update `apps/mobile/app/(tabs)/__tests__/index.test.tsx` — test "Vandaag" en "Binnenkort"
- [ ] 19. Schrijf `apps/mobile/app/__tests__/notificatie-instellingen.test.tsx`
- [ ] 20. Update seed (`apps/web/prisma/seed.ts` of equivalent) — voeg notification_preferences toe
- [ ] 21. `pnpm typecheck` — geen fouten
- [ ] 22. `pnpm test` — alle suites groen
- [ ] 23. `pnpm lint` — geen warnings

---

## 9. Open vragen

- Moeten notificaties ook zichtbaar zijn in een in-app notificatiecentrum (bell-icoon in header)? Roadmap noemt dit voor Phase 6 — voor nu alleen push; bell-icoon navigeert nog nergens naartoe.
- Hoe lang worden `notifications`-records bewaard? Voorstel: 12 maanden (cleanup in V2).
- Is de Supabase EU-regio al ingesteld? Verifieer vóór productie-release (GDPR-vereiste).

---

## SRE Notes

**Datum:** 08-05-2026

### Logging
- `push-trigger`: body van Expo API-fout niet meer gelogd — kon push-tokens (PII) bevatten. Opgelost: alleen `status` gelogd.
- `reminder-scheduler` en `push-trigger`: start- en eindtijdstempel toegevoegd aan beide handlers.

### Monitoring
- `notification_preferences.profile_id`: zowel `unique`-constraint als expliciete index aanwezig — redundant maar niet schadelijk.
- `notifications.activity_id`: index aanwezig via `notifications_activity_id_idx`.
- `notifications_dedup_idx` dekt `(recipient_profile_id, activity_id, type)` — voorkomt dubbele cron-retry inserts.
- Alle React Query hooks hebben expliciete `staleTime` (5 minuten).

### Foutafhandeling
- `notificatie-instellingen.tsx`: `Switch` krijgt `disabled={isPending}` — voorkomt dubbele mutations tijdens in-flight opslaan.
- Optimistische rollback aanwezig via `onMutate`/`onError` in `useUpdateNotificationPreferences`.
- Foutmelding `Alert` is Dutch en geeft gebruiker vervolgactie.

### Beveiliging
- RLS `FOR ALL USING (auth.uid() = profile_id)`: PostgreSQL gebruikt USING automatisch als WITH CHECK bij INSERT — insert-bescherming correct.
- Geen secrets in `EXPO_PUBLIC_` of `NEXT_PUBLIC_` variabelen.
- Alle secrets via `Deno.env.get()`.

### Bundle
- Geen nieuwe packages toegevoegd aan `apps/mobile/package.json`.

### Openstaande punten
- `push-trigger` heeft `verify_jwt = false` — het endpoint is publiek bereikbaar. Voeg vóór productie een webhook-signature validatie toe (bijv. `X-Supabase-Signature` header controleren) om request-forgery te voorkomen.
