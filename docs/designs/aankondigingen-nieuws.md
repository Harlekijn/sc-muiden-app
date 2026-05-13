# Design: aankondigingen-nieuws
<!-- generated: 2026-05-12 -->

## Gebruiksscenario's (Use Cases)

- `UC-01` — Beheerder/commissielid kan een aankondiging aanmaken (concept of gepubliceerd) zodat clubnieuws centraal beheerd wordt.
- `UC-02` — Beheerder/commissielid kan een aankondiging bewerken en (her)publiceren zodat correcties mogelijk zijn.
- `UC-03` — Beheerder/commissielid kan een aankondiging archiveren (soft-delete) zodat verouderd nieuws verdwijnt uit de app.
- `UC-04` — Alle leden met overeenkomende sportvoorkeur ontvangen een push-notificatie bij publicatie zodat ze op de hoogte zijn.
- `UC-05` — Lid kan gepubliceerde aankondigingen lezen in de Nieuws-tab zodat ze clubnieuws kunnen volgen.
- `UC-06` — Lid kan in het notificatiecentrum alle ontvangen notificaties inzien zodat niets gemist wordt.
- `UC-07` — Lid kan aankondigingen filteren op sport zodat ze alleen relevante berichten zien.
- `UC-08` — Lid kan de push-voorkeur voor aankondigingen uitschakelen zodat ze geen ongewenste push-notificaties ontvangen.

---

## Gebruikersstromen (User Flows)

### UC-01 — Aankondiging aanmaken (CMS)

**Happy path:**
1. Beheerder/commissielid navigeert naar `/dashboard/aankondigingen`.
2. Klikt "Nieuwe aankondiging".
3. Vult titel in (verplicht).
4. Schrijft body in WYSIWYG-editor (TipTap): tekst, opmaak, links, afbeeldingen.
5. Kiest doelgroep: "Alle leden", "Voetbal" of "Hockey".
6. Kiest actie: "Opslaan als concept" of "Nu publiceren".
7. Klikt de actie-knop.
8. Redirect naar aankondigingenoverzicht met toast bevestiging.

**Foutpaden:**
- Titel is leeg → inline validatiefout "Titel is verplicht".
- Body is leeg → inline validatiefout "Bericht is verplicht".
- Upload afbeelding mislukt → toast "Afbeelding kon niet worden geüpload. Controleer je verbinding."
- Server-fout bij opslaan → toast "Opslaan mislukt. Probeer het opnieuw."

### UC-02 — Aankondiging bewerken & publiceren

**Happy path:**
1. Beheerder opent aankondiging via `/dashboard/aankondigingen/[id]/bewerken`.
2. Bewerkt inhoud.
3. Klikt "Publiceren" (concept → gepubliceerd).
4. Toast "Aankondiging gepubliceerd" verschijnt.
5. Push-notificaties worden uitgestuurd naar doelgroep.

**Foutpad:**
- Aankondiging is al gepubliceerd → "Publiceren"-knop niet zichtbaar; alleen "Opslaan" (geen dubbele push).

### UC-03 — Aankondiging archiveren

**Happy path:**
1. Beheerder klikt `<Trash2 />` icoon naast een aankondiging.
2. Bevestigingsdialoog: "Aankondiging archiveren? Dit is niet zichtbaar voor leden."
3. Klikt "Bevestigen".
4. `deleted_at` wordt gezet; aankondiging verdwijnt uit lijst en app.

### UC-04 — Push-notificatie bij publicatie

**Happy path:**
1. Aankondiging wordt gepubliceerd via CMS (UC-01 of UC-02).
2. API-route `/api/cms/announcements/[id]/publiceren` roept `announcement-push` edge function aan.
3. Edge function haalt alle profielen op die aan de doelgroep voldoen.
4. Voor elk profiel waar `notification_preferences.aankondiging = true`: insert in `notifications` (type=`'aankondiging'`, data=`{announcement_id}`).
5. Bestaande `push-trigger` webhook stuurt push via Expo Push API per notification-rij.
6. Leden ontvangen push op toestel.

**Foutpaden:**
- Edge function mislukt voor één profiel → logt fout, gaat door met overige profielen.
- Profiel heeft geen push-token → notificatie-rij wordt wél ingevoegd in DB (voor in-app centrum), geen push verstuurd.
- Aankondiging al eerder gepubliceerd (dedup-check) → edge function logt 'already-sent' en stopt.

### UC-05 — Nieuws lezen (mobiel)

**Happy path:**
1. Lid tikt op "Nieuws"-tab.
2. Overzicht toont gepubliceerde aankondigingen relevant voor gebruikers sportvoorkeur, nieuwste eerst.
3. Lid tikt op een aankondiging.
4. Detailscherm toont titel, body (HTML gerenderd), datum, auteursnaam, sportbadge.
5. Ongelezen-indicator op bijbehorende notificatie verdwijnt (`read_at` gezet).

**Foutpaden:**
- Geen internetverbinding → "Geen verbinding — controleer je internetverbinding en probeer opnieuw."
- Geen aankondigingen → lege staat "Geen berichten beschikbaar. Er zijn nog geen aankondigingen voor jouw sportvoorkeur."

### UC-06 — Notificatiecentrum (mobiel)

**Happy path:**
1. Lid tikt op bell-icoon (`<Bell />`) in de Nieuws-tab header.
2. Scherm `/notificaties` opent met alle notificaties (aankondigingen + activiteitsherinneringen), nieuwste eerst.
3. Elk item toont: type-icoon, titel, samenvatting, tijdstip.
4. Ongelezen items hebben een blauwe dot.
5. Lid tikt op notificatie → navigeert naar aankondigingsdetail of activiteitdetail.
6. `read_at` wordt gezet na navigatie.

### UC-08 — Aankondigingsvoorkeur uitschakelen

**Happy path:**
1. Lid navigeert naar `/notificatie-instellingen`.
2. Schakelt toggle "Aankondigingen" uit.
3. Instelling opgeslagen; volgende publicaties sturen geen push naar dit lid.

---

## Acceptatiecriteria

### UC-01
- Gegeven een beheerder op `/dashboard/aankondigingen/nieuw`, als hij "Opslaan als concept" klikt, dan wordt de aankondiging opgeslagen met `published_at = null`.
- Gegeven een beheerder op `/dashboard/aankondigingen/nieuw`, als hij "Nu publiceren" klikt, dan wordt `published_at` ingesteld op het huidige moment.
- Gegeven een lege titel, als het formulier wordt ingediend, dan verschijnt "Titel is verplicht" inline onder het titelveld.
- Gegeven een leeg bericht, als het formulier wordt ingediend, dan verschijnt "Bericht is verplicht" inline.

### UC-02
- Gegeven een conceptaankondiging, als beheerder "Publiceren" klikt, dan verandert de status naar GEPUBLICEERD en worden push-notificaties verstuurd.
- Gegeven een al-gepubliceerde aankondiging, als beheerder inhoud bewerkt en "Opslaan" klikt, dan worden GEEN nieuwe push-notificaties verstuurd.

### UC-04
- Gegeven een aankondiging met doelgroep "Voetbal" en 3 voetbal-profielen + 2 hockey-profielen, als gepubliceerd, dan ontvangen precies 3 profielen een notificatie-rij in de DB.
- Gegeven een profiel met `aankondiging = false` in notification_preferences, als een aankondiging gepubliceerd wordt, dan ontvangt dit profiel GEEN push maar WEL een notificatie-rij (in-app centrum blijft werken).
- Gegeven een al eerder gepubliceerde aankondiging, als `announcement-push` nogmaals aangeroepen wordt, dan worden geen dubbele notificaties aangemaakt (dedup).

### UC-05
- Gegeven de Nieuws-tab, als er gepubliceerde aankondigingen zijn voor de sportvoorkeur van het lid, dan worden deze getoond (nieuwste eerst).
- Gegeven een aankondiging met doelgroep "Hockey", als een lid alleen "Voetbal" in zijn sportvoorkeur heeft, dan wordt deze aankondiging NIET getoond.
- Gegeven een aankondiging met doelgroep "Alle leden" (sport = null), als een lid met willekeurige sportvoorkeur de Nieuws-tab opent, dan wordt de aankondiging WEL getoond.
- Gegeven een ongelezen aankondiging-notificatie, als het lid de detailpagina opent, dan wordt `read_at` gezet op de bijbehorende notificatie.

### UC-06
- Gegeven het notificatiecentrum, als het geopend wordt, dan worden alle notificaties getoond (nieuwste eerst, type-onderscheidend icoon).
- Gegeven een ongelezen notificatie, als erop getikt wordt, dan wordt `read_at` gezet na navigatie.
- Gegeven geen notificaties, dan toont het scherm "Geen notificaties. Je hebt nog geen notificaties ontvangen."

### UC-08
- Gegeven toggle "Aankondigingen" uitgeschakeld, als een nieuwe aankondiging gepubliceerd wordt, dan ontvangt dit lid GEEN push-notificatie.

---

## UI Design per Scherm/Component

### CMS — Aankondigingen overzicht (`/dashboard/aankondigingen`)

**Route:** `apps/web/app/dashboard/aankondigingen/page.tsx` (server component)

**Lay-out:**
- Paginaheader: ds-h2 "Aankondigingen" (kleur: `--color-navy`) + "Nieuwe aankondiging"-knop rechts
- Tabel met kolommen: Titel, Doelgroep, Status, Datum, Acties
- Status-badges: CONCEPT (`--color-warning` bg), GEPUBLICEERD (`--color-success` bg), GEARCHIVEERD (`--color-text-2` bg)
- Acties per rij: `<Pencil />` (16px, `--color-blue`) bewerken, `<Trash2 />` (16px, `--color-error`) archiveren

**Componenten:**
- StatusBadge: `--radius-pill`, ds-label (uppercase), kleur per status, `--color-white` tekst
- Tabel-rij hover: achtergrond `--color-navy-06`
- "Nieuwe aankondiging"-knop: achtergrond `--color-blue`, `--color-white` tekst, `--radius-md`, `<Plus />` icoon 20px

**Lege staat:** "Geen aankondigingen. Maak de eerste aankondiging aan voor je leden."

**Laadindicator:** 3 skeleton-rijen, hoogte 52px, `--color-mid` achtergrond

---

### CMS — Aankondiging aanmaken / bewerken

**Routes:**
- `apps/web/app/dashboard/aankondigingen/nieuw/page.tsx`
- `apps/web/app/dashboard/aankondigingen/[id]/bewerken/page.tsx`

**Lay-out:**
- Broodkruimelpad: Aankondigingen / [Nieuwe aankondiging | Bewerken]
- Formulier (max-width: 800px, `--color-white` achtergrond, `--radius-lg`, `--shadow-card`):
  1. **Titel** — text input, label "Titel", placeholder "Geef de aankondiging een titel"
  2. **Doelgroep** — radio-groep (3 opties): "Alle leden" (`--color-text`), "Voetbal" (`--color-blue`), "Hockey" (`--color-blue`)
  3. **Body** — TipTap-editor (full-width, min-height 320px, `--radius-md` border `--color-mid`)
     - Toolbar: Bold, Italic, H2, H3, BulletList, OrderedList, Link (`<Link2 />`), Image (`<Image />`), Undo, Redo
     - Afbeelding uploaden via `/api/cms/announcements/[id]/afbeelding` naar bucket `announcement-images`
  4. **Actie-knoppen** (rechts, gap 12px):
     - "Opslaan als concept" — secondary (`--color-white` bg, `--color-navy` border, `--color-navy` tekst, `--radius-md`)
     - "Nu publiceren" (bij nieuw) / "Publiceren" (bij concept) / "Opslaan" (bij al gepubliceerd) — primary (`--color-blue` bg, `--color-white`, `--radius-md`)

**Foutmeldingen:**
- Veldfout: ds-caption `--color-error` inline onder veld
- Upload-fout: toast `--color-error` achtergrond, 4s auto-dismiss

---

### CMS — API Routes

| Route | Methode | Doel |
|---|---|---|
| `/api/cms/announcements` | POST | Aanmaken (concept of publiceren) |
| `/api/cms/announcements/[id]` | PATCH | Bewerken |
| `/api/cms/announcements/[id]` | DELETE | Soft-delete (set `deleted_at`) |
| `/api/cms/announcements/[id]/publiceren` | POST | Publiceren + trigger `announcement-push` |
| `/api/cms/announcements/[id]/afbeelding` | POST | Upload afbeelding naar Storage |

Alle routes: role guard (`beheerder` of `commissielid`), Zod input validatie, `SUPABASE_SECRET_KEY` via admin client, DOMPurify sanitisatie van HTML body voor opslag.

---

### Mobile — Nieuws-tab (`/(tabs)/nieuws`)

**Route:** `apps/mobile/app/(tabs)/nieuws.tsx`

**Tab zichtbaar:** Tab-balk toont "Nieuws" met `<Newspaper />` icoon (24px). Badge = aantal ongelezen notificaties van type `aankondiging` (verberg als 0).

**Lay-out:**
- Header (navy achtergrond):
  - Links: ds-h3 "Nieuws" (`--color-white`)
  - Rechts: `<Bell />` 24px (`--color-white`) — badge met totale ongelezen-telling (alle typen)
- Filterchips (horizontaal scrollbaar, `--space-4` padding):
  - "Alle", "Voetbal", "Hockey"
  - Actief: `--color-blue` achtergrond, `--color-white` tekst, `--radius-pill`
  - Inactief: `--color-mid` achtergrond, `--color-text` tekst, `--radius-pill`
  - Gap: `--space-2`
- `FlatList` van `AnnouncementCard` components

**AnnouncementCard:**
- Achtergrond: `--color-white`, `--radius-lg`, shadow `0 2px 8px rgba(1,29,80,0.10)`
- Sportbadge: pill `--color-blue` achtergrond, `--color-white` ds-label, 16px tekst (verberg als doelgroep = alle)
- Titel: ds-h4 `--color-text`
- Body-preview: ds-body `--color-text-2`, 2 regels (`numberOfLines={2}`)
- Datum: ds-caption `--color-text-2`, rechts
- Ongelezen dot: 8px cirkel `--color-blue`, links boven (verberg indien `read_at` gezet)
- Padding: `--space-4`

**Lege staat:**
- Hoofdtekst: "Geen berichten beschikbaar"
- Sub-tekst: "Er zijn nog geen aankondigingen voor jouw sportvoorkeur."
- Icoon: `<Newspaper />` 48px `--color-mid`

**Laadindicator:** 3 skeleton-kaarten, hoogte 120px, `--color-mid` shimmer

**Foutmelding:**
- "Nieuws kon niet worden geladen."
- Sub-tekst: "Controleer je verbinding en probeer opnieuw."
- `<RefreshCw />` knop

---

### Mobile — Aankondiging detail (`/aankondiging/[id]`)

**Route:** `apps/mobile/app/aankondiging/[id].tsx`

**Lay-out:**
- Header (navy): `<ChevronLeft />` 24px wit + ds-h4 "Nieuws" wit
- Body (scrollbaar, `--color-light` achtergrond, `--space-4` padding):
  - Sportbadge (pill `--color-blue`, ds-label) — verberg als doelgroep = alle
  - Titel: ds-h2 `--color-text`
  - Meta-rij: datum "zaterdag 10 mei 2026" (ds-caption `--color-text-2`) · auteursnaam (ds-caption `--color-text-2`)
  - Divider: 1px `--color-mid`
  - Body: HTML gerenderd via `react-native-render-html` met custom basestyles matching design system

**Op mount:** Als `notification_id` aanwezig in route params → `mutate(notification_id)` van `useMarkNotificationRead`.

**Laadindicator:**
- Header-skeleton (ds-h2 breedte, hoogte 32px, `--color-mid`)
- Body-skeleton (3 tekstregels)

**Foutmelding:** "Aankondiging kon niet worden geladen. Probeer het opnieuw."

---

### Mobile — Notificatiecentrum (`/notificaties`)

**Route:** `apps/mobile/app/notificaties.tsx`

**Lay-out:**
- Header (navy): `<ChevronLeft />` 24px wit + ds-h4 "Notificaties" wit
- `FlatList` van `NotificatieRij` components
- Dividers tussen rijen: 1px `--color-mid`

**NotificatieRij:**
- Icoon links (24px, in 40×40 cirkel `--color-navy-06`):
  - `aankondiging` → `<Newspaper />`
  - `wedstrijd` → `<Calendar />`
  - `bardienst` → `<Clock />`
  - `training` → `<Dumbbell />`
- Icoonkleur: `--color-blue` (ongelezen), `--color-text-2` (gelezen)
- Midden:
  - Titel: ds-body, `--fw-semibold` indien ongelezen
  - Sub-tekst: ds-caption `--color-text-2` (bijv. "2 uur geleden")
- Rechts: ongelezen dot 8px `--color-blue` (verberg indien gelezen)
- Tap → navigeer naar bestemming, set `read_at`

**Lege staat:**
- "Geen notificaties"
- Sub-tekst: "Je hebt nog geen notificaties ontvangen."
- Icoon: `<Bell />` 48px `--color-mid`

**Laadindicator:** 4 skeleton-rijen

---

### Mobile — Notificatie-instellingen (uitbreiden)

**Route:** `apps/mobile/app/notificatie-instellingen.tsx` (bestaand)

**Wijziging:** Voeg vierde `ToggleRow` toe:
- Icoon: `<Newspaper />` 20px `--color-blue`
- Label: "Aankondigingen"
- Value: `prefs?.aankondiging ?? true`
- `isLast: true` (training was isLast → zet `isLast` op false bij training)

Caption uitbreiden: voeg toe "Aankondigingen worden direct verstuurd zodra ze gepubliceerd worden."

---

## Technisch Design

### Database wijzigingen

#### Migratie 1: `YYYYMMDDHHMMSS_add_aankondiging_notification_preference.sql`

```sql
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS aankondiging boolean NOT NULL DEFAULT true;
```

Geen nieuwe RLS-policies nodig — bestaande `users_select_own_notification_preferences` en `users_upsert_own_notification_preferences` dekken de nieuwe kolom.

Voeg index toe voor dedup-query in edge function:
```sql
CREATE INDEX IF NOT EXISTS notifications_data_announcement_idx
  ON public.notifications USING GIN (data)
  WHERE type = 'aankondiging';
```

#### Migratie 2: `YYYYMMDDHHMMSS_announcement_images_bucket.sql`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "cms_users_upload_announcement_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'announcement-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('beheerder', 'commissielid')
    )
  );

CREATE POLICY "public_read_announcement_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');
```

**Bestaande announcements-tabel en RLS:** Al aanwezig in `20260429000005_notifications.sql`:
- `authenticated_select_published_announcements` — published + niet deleted zichtbaar voor alle auth-users
- `admins_manage_announcements` — beheerder + commissielid mogen alles (incl. concepten zien)

Geen wijzigingen nodig aan bestaande RLS.

---

### Gedeelde types (`packages/shared/src/`)

**`packages/shared/src/schemas/notificationPreferences.schema.ts`** — uitbreiden:
```typescript
// In NotificationPreferencesSchema:
aankondiging: z.boolean(),

// In UpdateNotificationPreferencesSchema:
aankondiging: z.boolean().optional(),
```

**`packages/shared/src/schemas/announcement.schema.ts`** — uitbreiden:
```typescript
export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
```

Voeg Dutch `.message()` toe aan bestaande `createAnnouncementSchema`:
- `title`: `.min(1, 'Titel is verplicht').max(200, 'Titel mag maximaal 200 tekens bevatten')`
- `body`: `.min(1, 'Bericht is verplicht')`

**`packages/shared/src/types/app.types.ts`** — toevoegen:
```typescript
export type AnnouncementWithAuthor = Tables<'announcements'> & {
  author: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export type NotificationWithContext = Tables<'notifications'>;
```

Zorg dat beide types geëxporteerd worden vanuit `packages/shared/src/index.ts`.

---

### Mobiele implementatie (`apps/mobile/`)

**React Query hooks:**

| Bestand | Query key | staleTime | Return type |
|---|---|---|---|
| `hooks/useAnnouncements.ts` | `['announcements', filter]` | 5 min | `AnnouncementWithAuthor[]` |
| `hooks/useAnnouncement.ts` | `['announcement', id]` | 10 min | `AnnouncementWithAuthor` |
| `hooks/useNotifications.ts` | `['notifications']` | 0 | `NotificationWithContext[]` |
| `hooks/useMarkNotificationRead.ts` | mutation — invalidates `['notifications']` | n.v.t. | `void` |
| `hooks/useUnreadCount.ts` | afgeleid van `['notifications']` | 0 | `number` |

`useAnnouncements` query-logica:
```typescript
// filter = 'alle': sport IS NULL or sport overlaps user's sport
// filter = 'voetbal': sport IS NULL or sport @> ['voetbal']
// filter = 'hockey': sport IS NULL or sport @> ['hockey']
supabase
  .from('announcements')
  .select('*, author:profiles!author_id(display_name)')
  .is('deleted_at', null)
  .not('published_at', 'is', null)
  .lte('published_at', new Date().toISOString())
  .order('published_at', { ascending: false })
```

Sport-filtering per filter-waarde als extra `.or()` clause.

`useUpdateNotificationPreferences` — uitbreiden met `aankondiging` veld (geen destructieve wijziging — bestaand patroon is generic over partial input).

**Scherm-bestanden:**
- `apps/mobile/app/(tabs)/nieuws.tsx` — volledig implementeren
- `apps/mobile/app/aankondiging/[id].tsx` — nieuw
- `apps/mobile/app/notificaties.tsx` — nieuw
- `apps/mobile/app/notificatie-instellingen.tsx` — uitbreiden
- `apps/mobile/app/(tabs)/_layout.tsx` — Nieuws-tab zichtbaar + badge

**Package toevoegen aan `apps/mobile`:**
```
react-native-render-html
```
(~50KB gzipped — zie SRE Check 5)

---

### Web CMS implementatie (`apps/web/`)

**Server components (data ophalen):**
- `apps/web/app/dashboard/aankondigingen/page.tsx` — vervangt stub; haalt alle aankondigingen op (incl. concepten) via Supabase SSR client
- `apps/web/app/dashboard/aankondigingen/nieuw/page.tsx` — leeg formulier
- `apps/web/app/dashboard/aankondigingen/[id]/bewerken/page.tsx` — haalt specifieke aankondiging op

**Client components:**
- `apps/web/app/dashboard/aankondigingen/_components/AankondigingenClient.tsx` — lijst, status-badges, delete-dialoog
- `apps/web/app/dashboard/aankondigingen/_components/AankondigingenForm.tsx` — formulier met validatie, TipTap integratie
- `apps/web/app/dashboard/aankondigingen/_components/TipTapEditor.tsx` — `'use client'` wrapper om `@tiptap/react` Editor

**API routes** (alle met role guard + Zod validatie + admin Supabase client):
- `apps/web/app/api/cms/announcements/route.ts` — POST
- `apps/web/app/api/cms/announcements/[id]/route.ts` — PATCH, DELETE
- `apps/web/app/api/cms/announcements/[id]/publiceren/route.ts` — POST (set `published_at`, roep edge function aan)
- `apps/web/app/api/cms/announcements/[id]/afbeelding/route.ts` — POST (multipart upload naar Storage)

**Packages toevoegen aan `apps/web`:**
```
@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image dompurify
@types/dompurify (dev)
```

DOMPurify gebruiken in de publiceer-API-route om HTML body te sanitiseren voor opslag in DB.

---

### Edge functions (`supabase/functions/`)

**`supabase/functions/announcement-push/index.ts`**

- Trigger: HTTP-aanroep vanuit `/api/cms/announcements/[id]/publiceren`
- Input body: `{ announcement_id: string }`
- Flow:
  1. Log `{ event: 'announcement-push-start', timestamp }` — geen PII
  2. Fetch aankondiging (title, sport, id)
  3. Dedup: `SELECT COUNT(*) FROM notifications WHERE type = 'aankondiging' AND data->>'announcement_id' = $1` → als count > 0: log 'already-sent', return 200
  4. Fetch profielen die matchen: sport IS NULL of `sport @> announcement.sport`, JOIN met `notification_preferences` waar `aankondiging = true`
  5. Insert `notifications` rij voor elk matchend profiel: `{ recipient_profile_id, title: announcement.title, body: [eerste 160 tekens body], type: 'aankondiging', data: { announcement_id } }`
  6. Log `{ event: 'announcement-push-complete', count: N, timestamp }`
- Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Error handling: catch per profiel; één fout stopt de gehele functie NIET
- Nooit loggen: profielnamen, e-mails, telefoons, geboortedata

**Relatie met bestaande push-trigger:** De bestaande `push-trigger` webhook op `notifications` INSERT handelt de daadwerkelijke Expo-push-verzending af. `announcement-push` hoeft zelf geen pushes te sturen — alleen `notifications`-rijen aanmaken.

---

### Implementatievolgorde

1. DB migration — `aankondiging` column + GIN index op notifications
2. DB migration — `announcement-images` storage bucket
3. `supabase db reset`
4. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
5. Shared schemas: `notificationPreferences.schema.ts` (aankondiging veld)
6. Shared schemas: `announcement.schema.ts` (Dutch messages, updateAnnouncementSchema)
7. Shared types: `app.types.ts` (AnnouncementWithAuthor, NotificationWithContext)
8. `pnpm --filter @sc-muiden/shared typecheck`
9. Mobile hooks: `useAnnouncements`, `useAnnouncement`, `useNotifications`, `useMarkNotificationRead`, `useUnreadCount`
10. Mobile hooks: update `useUpdateNotificationPreferences` (aankondiging veld)
11. Mobile: update `notificatie-instellingen.tsx`
12. Mobile: implementeer `nieuws.tsx` volledig
13. Mobile: nieuw `aankondiging/[id].tsx`
14. Mobile: nieuw `notificaties.tsx`
15. Mobile: update `(tabs)/_layout.tsx`
16. Web: packages installeren (`@tiptap/*`, `dompurify`)
17. Web: `TipTapEditor.tsx` component
18. Web: `AankondigingenForm.tsx`
19. Web: `AankondigingenClient.tsx`
20. Web: aankondigingen server components (overzicht, nieuw, bewerken)
21. Web: API routes (create, update, delete, publiceren, afbeelding)
22. Edge function: `announcement-push/index.ts`
23. Unit tests: `packages/shared/src/__tests__/announcement.schema.test.ts`
24. Unit tests: `packages/shared/src/__tests__/notificationPreferences.schema.test.ts`
25. Playwright E2E: `apps/web/e2e/aankondigingen.spec.ts` (S13-A, S13-B, S13-C, S13-D)
26. Seed data voor aankondigingen toevoegen aan `supabase/seed.sql`
27. `pnpm typecheck`
28. `pnpm test`
29. `pnpm lint`

---

## GDPR Compliance

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | Ja — `author_id` koppelt aankondiging aan profiel; `recipient_profile_id` in notifications | RLS op announcements en notifications aanwezig |
| Wettelijke grondslag | Gerechtvaardigd belang — clubcommunicatie als onderdeel van het lidmaatschap | Vastgelegd in design doc |
| Data van kinderen (< 16 jaar)? | Indirect — notificaties bereiken ouder-account (bestaand model: kinderen hebben geen eigen login) | Geen extra actie vereist in V1 |
| Bewaartermijn | Aankondigingen: soft-delete, geen automatische purge in V1 | V2: automatische purge na 12 maanden |
| Toegang beperkt via RLS? | Ja — published-only voor reguliere gebruikers; admins kunnen alles | Bestaande policies in migratie 005 |
| PII in logs vermeden? | Ja — edge function logt alleen event, count, timestamp | Edge function logging-regels gespecificeerd |
| Data binnen EU (Supabase EU-region)? | Ja — Supabase EU-region voor project | Controleer Supabase project regio bij deployment |
| Bewerkingsverzoek (DSAR) mogelijk? | Ja — soft-delete aankondiging via beheerder; `author_id` kan verwijderd worden bij accountverwijdering | Soft-delete aanwezig; cascade bij profile delete via FK |

---

## Scenario updates

Hoogste bestaand scenario: 12. Nieuwe scenario's starten bij S13.

**Nieuw bestand:** `docs/scenarios/13-aankondigingen-nieuws.md`

**Scenario IDs:** S13-A t/m S13-G

---

## Implementatieplan (numbered checklist)

- [ ] 1. `date +%Y%m%d%H%M%S` — bepaal timestamps voor migraties
- [ ] 2. Maak `supabase/migrations/YYYYMMDDHHMMSS_add_aankondiging_notification_preference.sql`
- [ ] 3. Maak `supabase/migrations/YYYYMMDDHHMMSS_announcement_images_bucket.sql`
- [ ] 4. `supabase db reset`
- [ ] 5. `supabase gen types typescript --local > packages/shared/src/types/db.types.ts`
- [ ] 6. Pas `packages/shared/src/schemas/notificationPreferences.schema.ts` aan
- [ ] 7. Pas `packages/shared/src/schemas/announcement.schema.ts` aan
- [ ] 8. Voeg types toe aan `packages/shared/src/types/app.types.ts`
- [ ] 9. `pnpm --filter @sc-muiden/shared typecheck`
- [ ] 10. Maak `apps/mobile/hooks/useAnnouncements.ts`
- [ ] 11. Maak `apps/mobile/hooks/useAnnouncement.ts`
- [ ] 12. Maak `apps/mobile/hooks/useNotifications.ts`
- [ ] 13. Maak `apps/mobile/hooks/useMarkNotificationRead.ts`
- [ ] 14. Maak `apps/mobile/hooks/useUnreadCount.ts`
- [ ] 15. Pas `apps/mobile/hooks/useUpdateNotificationPreferences.ts` aan
- [ ] 16. Pas `apps/mobile/app/notificatie-instellingen.tsx` aan
- [ ] 17. Implementeer `apps/mobile/app/(tabs)/nieuws.tsx`
- [ ] 18. Maak `apps/mobile/app/aankondiging/[id].tsx`
- [ ] 19. Maak `apps/mobile/app/notificaties.tsx`
- [ ] 20. Pas `apps/mobile/app/(tabs)/_layout.tsx` aan
- [ ] 21. `pnpm --filter apps/mobile add react-native-render-html`
- [ ] 22. `pnpm --filter apps/web add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image dompurify`
- [ ] 23. `pnpm --filter apps/web add -D @types/dompurify`
- [ ] 24. Maak `apps/web/app/dashboard/aankondigingen/_components/TipTapEditor.tsx`
- [ ] 25. Maak `apps/web/app/dashboard/aankondigingen/_components/AankondigingenForm.tsx`
- [ ] 26. Maak `apps/web/app/dashboard/aankondigingen/_components/AankondigingenClient.tsx`
- [ ] 27. Vervang `apps/web/app/dashboard/aankondigingen/page.tsx`
- [ ] 28. Maak `apps/web/app/dashboard/aankondigingen/nieuw/page.tsx`
- [ ] 29. Maak `apps/web/app/dashboard/aankondigingen/[id]/bewerken/page.tsx`
- [ ] 30. Maak `apps/web/app/api/cms/announcements/route.ts`
- [ ] 31. Maak `apps/web/app/api/cms/announcements/[id]/route.ts`
- [ ] 32. Maak `apps/web/app/api/cms/announcements/[id]/publiceren/route.ts`
- [ ] 33. Maak `apps/web/app/api/cms/announcements/[id]/afbeelding/route.ts`
- [ ] 34. Maak `supabase/functions/announcement-push/index.ts`
- [ ] 35. Schrijf `packages/shared/src/__tests__/announcement.schema.test.ts`
- [ ] 36. Schrijf `packages/shared/src/__tests__/notificationPreferences.schema.test.ts` (aankondiging)
- [ ] 37. Schrijf `apps/web/e2e/aankondigingen.spec.ts` (S13-A t/m S13-D)
- [ ] 38. Voeg aankondiging seed data toe aan `supabase/seed.sql`
- [ ] 39. `pnpm typecheck`
- [ ] 40. `pnpm test`
- [ ] 41. `pnpm lint`

---

## Open questions

- HTML sanitisatie: DOMPurify wordt toegepast in de publiceer-API-route vóór opslag. Op mobile rendert `react-native-render-html` de opgeslagen HTML — risico is minimaal omdat input beheerder-only is, maar sanitisatie is defense-in-depth.
- `react-native-render-html` is ~50KB gzipped (boven de 50KB SRE-drempel) — zie SRE Check 5.
- GIN index op `notifications.data` voor dedup-query — toegevoegd aan migratie 1.
- TipTap afbeelding-upload: de ImageExtension in TipTap vereist een custom upload handler. Dit wordt geïmplementeerd in `TipTapEditor.tsx` via een `addNodeView` override die upload-on-drop/paste afhandelt naar de afbeelding-API-route.

---

## SRE Notes

**Datum:** 12-05-2026

### Logging
- `announcement-push/index.ts`: outer catch loggede `(err as Error).message` (potentieel interne details). Opgelost: vervangen door `outcome: 'failure'`.
- Alle overige log-statements bevatten enkel event-type, timestamp, announcement_id (UUID, geen PII), en outcome. ✓

### Monitoring
- `announcements.author_id` FK-column had geen index. Opgelost: toegevoegd in migratie `20260512113007_add_aankondigingen_indexes.sql`.
- `notification_preferences.profile_id` index bestaat ✓ (migratie 20260508124158).
- GIN-index op `notifications.data WHERE type = 'aankondiging'` toegevoegd in migratie 20260512113005 ✓.
- React Query `staleTime`: `useAnnouncements` = 5 min ✓, `useAnnouncement` = 10 min ✓, `useNotifications` = 0 (gewenst) ✓.
- Edge function logt start + einde met timestamp ✓. `notifications`-rijen zijn het audit-record (sync_log is voor federatiesync, niet push).

### Foutafhandeling
- Bug gerepareerd: `AankondigingenForm.tsx` stuurde `published_at` mee in de initiële POST bij aanmaken+publiceren. De `/publiceren`-call gaf daardoor 409 en push-notificaties werden niet getriggerd. Opgelost: `published_at` verwijderd uit create-payload; de `/publiceren`-route stelt dit in én triggert de push. Publiceer-response wordt nu ook gecheckt (`if (!pubRes.ok) throw`).
- Alle gebruikersgerichte foutmeldingen zijn in het Nederlands ✓.
- Geen ruwe Supabase-fouttekst of HTTP-statuscodes zichtbaar voor gebruikers ✓.
- Submit-knoppen disabled tijdens `isPending` (geen dubbel-submit) ✓.

### Beveiliging
- RLS `authenticated_select_published_announcements` bevat geen `auth.uid()`-check — intentioneel (alle geauthenticeerde leden mogen gepubliceerde berichten zien). Anonieme API-aanroepen met de anon-key vallen hier ook onder; acceptabel omdat de app auth vereist.
- Storage bucket `announcement-images`: MIME-type-validatie én bestandsgrootte (5 MB) gehandhaafd op zowel API-niveau als bucketbeleid ✓.
- Alle inputs gevalideerd met Zod vóór DB-schrijfacties ✓.
- `SUPABASE_SECRET_KEY` alleen in server-side code ✓.

### Bundle
- `react-native-render-html` (~40–50 KB gzipped) toegevoegd aan `apps/mobile`. Zit op de drempel van 50 KB. Functioneel noodzakelijk voor HTML-rendering; geen lichter alternatief beschikbaar voor React Native.
- `@tiptap/*` en `isomorphic-dompurify` zijn web-only packages — geen impact op mobile bundle.

### Openstaande punten
- Aankondigingen zijn zichtbaar voor alle geauthenticeerde leden via RLS, ook zonder sportfilter op DB-niveau. Sportfiltering vindt plaats in de app-laag. Dit is conform het design; een toekomstige feature kan dit strenger maken via RLS-sport-policies.
