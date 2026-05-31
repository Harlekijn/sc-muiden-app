<!-- generated: 2026-05-31 -->
# R-03 — `announcement_teams` junction table

## Context

Technische refactor uit `docs/REFACTOR_BACKLOG.md`. Vervangt `announcements.teams uuid[]` (geen FK-integriteit) door een junction-tabel `announcement_teams(announcement_id, team_id)` met volledige referentiële integriteit.

## Use cases

- **UC-01** — Beheerder kan een aankondiging aan specifieke teams koppelen zodat team-gebaseerde filtering mogelijk is
- **UC-02** — Systeem garandeert referentiële integriteit bij verwijdering van een team

## Technisch design

### Database wijzigingen

```sql
create table public.announcement_teams (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  team_id         uuid not null references public.teams(id)         on delete cascade,
  primary key (announcement_id, team_id)
);
create index announcement_teams_team_id_idx on public.announcement_teams(team_id);
-- Backfill vanuit announcements.teams uuid[]
-- Drop announcements.teams kolom
```

### RLS

| Policy | Operatie | Voorwaarde |
|---|---|---|
| `authenticated_select_announcement_teams` | SELECT | Aankondiging is gepubliceerd en niet verwijderd |
| `admins_manage_announcement_teams` | ALL | `profiles.role in ('beheerder', 'commissielid')` |

### Types (`packages/shared/src/types/app.types.ts`)

- `Announcement.teams` verwijderd
- `AnnouncementTeam` interface toegevoegd

### Schema (`packages/shared/src/schemas/announcement.schema.ts`)

- `announcementSchema.teams` verwijderd
- `createAnnouncementSchema.teams` verwijderd

## Implementatievolgorde

1. Migratie: `20260531000001_announcement_teams_junction.sql`
2. `supabase db reset` + `supabase gen types typescript --local`
3. Shared types/schema bijwerken
4. Tests bijwerken
5. `pnpm typecheck` + `pnpm test`

## GDPR

| Criterium | Beoordeling | Actie vereist |
|---|---|---|
| Persoonsgegevens verwerkt? | nee — alleen team-koppelingen | — |
| Wettelijke grondslag | n.v.t. | — |
| Data van kinderen? | nee | — |
| Bewaartermijn | cascade delete bij team-verwijdering | — |
| Toegang beperkt via RLS? | ja | Policies geschreven |
| PII in logs vermeden? | ja | — |
| Data binnen EU? | ja | — |
| DSAR mogelijk? | n.v.t. | — |

## SRE Notes

**Datum:** 31-05-2026

### Logging

Geen nieuwe edge functions of API routes toegevoegd — geen logging-wijzigingen nodig.

### Monitoring

- `announcement_teams_team_id_idx` aangemaakt op `team_id` (FK-kolom)
- `announcement_id` is onderdeel van de primary key (automatisch geïndexeerd)
- RLS-select policy gebruikt PK-subquery op `announcements.id` — geen full table scan

### Foutafhandeling

Geen UI-wijzigingen in deze refactor. Bestaande foutafhandeling in CMS en mobiel onveranderd.

### Beveiliging

- `authenticated_select_announcement_teams`: volgt bestaand patroon van `authenticated_select_published_announcements` — gepubliceerde data zichtbaar voor alle ingelogde leden (consistent en intentioneel)
- `admins_manage_announcement_teams`: checkt `auth.uid()` via profiles-join
- Geen `USING (true)` op persoonlijke data
- Geen nieuwe API routes of geheimen toegevoegd

### Bundle

Geen nieuwe packages — geen impact op bundle.

### Openstaande punten

- Na deployment: `supabase gen types typescript --local` draaien voor bijgewerkte `db.types.ts`
- Mobile- en web-queries die team-filtering nodig hebben, moeten worden aangepast om via join op `announcement_teams` te filteren (was nog niet geïmplementeerd met de oude `uuid[]`)
