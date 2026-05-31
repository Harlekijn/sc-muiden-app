# Refactor backlog — Schema & class-structure

Verzamelplaats voor structurele optimalisaties die niet aan een feature gebonden zijn. Gevonden tijdens de analyse van [docs/CLASS_STRUCTURE.md](CLASS_STRUCTURE.md) op 2026-05-27.

Elke entry bevat probleem, voorgestelde wijziging, motivatie, blast radius en status.

---

## R-01 — Trainings on-the-fly genereren uit `recurring_rules`

**Status:** in uitvoering — `feature/kalender-recurring-on-the-fly`

Zie design doc bij `docs/designs/kalender-recurring-on-the-fly.md`.

---

## R-02 — `BarDaySlot` opheffen; `Activity(type='bardienst')` is de bar-dag

**Status:** afgerond — `feature/bardienst-activity-merge`

Zie design doc bij `docs/designs/bardienst-activity-merge.md`.

### Probleem

Voor het bardienst-rooster bestaan vandaag drie lagen:

```
bar_day_slots ──► activities(type='bardienst') ──► bar_assignments
```

`BarDaySlot` houdt datum/tijd/sport/seizoen/notes vast; vervolgens wordt voor diezelfde dag óók een Activity-rij aangemaakt waar `bar_assignments` aan hangen. De Activity-rij dupliceert datum, tijd, sport en notes uit de slot.

Gevolg: twee bronnen van waarheid voor één bar-dag, twee plekken om te updaten als een dag verschuift, en een kalender-query die via `bar_day_slot_id` joint terwijl alles ook op `activities.starts_at` staat.

### Voorgestelde wijziging — Optie 2B (drop `BarDaySlot`)

`Activity(type='bardienst')` is dé bar-dag. `BarAssignment.activity_id` blijft staan (bestond al), `bar_day_slots` en `activities.bar_day_slot_id` worden verwijderd.

Velden die uniek zijn aan `bar_day_slots` migreren naar `activities`:
- `season text` → toevoegen aan `activities` (alleen relevant voor `type='bardienst'` — nullable kolom of separate `activity_metadata` JSONB)
- `sport`, `notes`, `starts_at`, `ends_at`, `date` → bestaan al op `activities`

### Migratiepad

1. Voeg `season text` toe aan `activities` (nullable).
2. Vul voor bestaande `Activity(type='bardienst')` rijen `season` vanuit hun `bar_day_slot.season`.
3. Update bardienst-roostergenerator + edit-flow om `Activity` direct te schrijven i.p.v. via `BarDaySlot`.
4. Verwijder `activities.bar_day_slot_id` FK + kolom.
5. Drop `bar_day_slots` tabel.
6. Drop `BarDaySlot` interface uit `app.types.ts`.

### Motivatie

- Eén bron van waarheid voor "wanneer is de bar open"
- Kalender-query wordt simpeler (geen UNION/join meer)
- `activities` blijft het polymorfe anker voor alle event-types — consistent met R-01

### Blast radius

- Alle code in [apps/web/app/api/cms/bardienst/](../apps/web/app/api/cms/bardienst/) en [apps/web/app/dashboard/bardienst/](../apps/web/app/dashboard/bardienst/)
- Roostergenerator-edge-function (zo aanwezig)
- Mobiele kalender-query (alleen als die rechtstreeks `bar_day_slots` leest — anders transparant)
- Migratie [20260515052815_bardienst_rooster.sql](../supabase/migrations/20260515052815_bardienst_rooster.sql) wordt deels teruggedraaid

### Risico's

- **Seizoens-aggregatie:** als de roostergenerator nu "alle bar-dagen in seizoen X" leest via `bar_day_slots.season`, moet die query verhuizen naar `activities WHERE type='bardienst' AND season=...`. Index toevoegen.
- **Roostergenerator-state:** als `BarDaySlot` ooit zonder gekoppelde `Activity` bestond (bijv. tijdens generatie), die two-phase commit verdwijnt. Onderzoek of dat wordt gebruikt.
- **`feature/bardienst-rooster` is nog open** — eerst die feature mergen voordat we deze refactor inplannen, anders dubbel werk.

### Niet-doen

- **Optie 2A** (BarAssignment direct aan BarDaySlot, drop activity_id): verworpen omdat het de Activity-abstractie ondermijnt en notificaties via `notifications.activity_id` een polymorfe FK zou maken.

---

## R-03 — `announcements.teams uuid[]` → junction table `announcement_teams`

**Status:** open — kan onafhankelijk

### Probleem

`announcements.teams` is een `uuid[]` zonder FK naar `teams`. Gevolg:
- Geen referentiële integriteit (verwijderde teams blijven als dode UUIDs in arrays)
- Filteren ("welke aankondigingen voor team X?") vereist `WHERE teams @> ARRAY[$1]::uuid[]` — niet trivial te indexeren (GIN nodig)
- Geen RLS-policy mogelijk per team (alleen "alles of niets")

### Voorgestelde wijziging

Junction-tabel:

```sql
create table announcement_teams (
  announcement_id uuid not null references announcements(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  primary key (announcement_id, team_id)
);
create index on announcement_teams (team_id);
```

Drop `announcements.teams` kolom.

### Migratiepad

1. Maak `announcement_teams` aan
2. Backfill vanuit bestaande array: `INSERT INTO announcement_teams SELECT id, unnest(teams) FROM announcements WHERE teams IS NOT NULL`
3. Update CMS create/edit flow ([apps/web/app/dashboard/aankondigingen/](../apps/web/app/dashboard/aankondigingen/)) om naar junction te schrijven
4. Update mobiele query om via join te filteren
5. Drop `announcements.teams`

### Motivatie

- Referentiële integriteit
- B-tree index op `team_id` werkt direct
- RLS kan per team beslissen

### Blast radius

- CMS aankondigingen-create/edit forms
- Mobiele aankondigingen-query
- Eventueel push-fanout edge function (`announcement-push`)

### Risico's

- **`announcements.sport text[]`** lijdt aan hetzelfde probleem maar is enum-achtig (2 mogelijke waardes) — niet noodzakelijk om nu mee te doen, kan blijven als array.

---

## Niet doorgevoerde voorstellen (vastgelegd voor de toekomst)

### Activity helemaal slopen

Verworpen — Activity is een polymorf anker voor `notifications.activity_id`, kalender-queries en soft-delete-RLS. Slopen verplaatst complexiteit naar 4 plekken.

### `Profile.member_id` droppen ten gunste van `UserFamilyMember.is_primary`

Subtiele duplicatie maar lage prioriteit. Niet urgent. Pak op als `user_family_members` om andere redenen geraakt wordt.

### `Match.played_at` vs `Activity.starts_at`

Mogelijk redundant. Onderzoeken: is `played_at` de daadwerkelijke aftrap (kan afwijken van plan) of een copy van `starts_at`? Beslissing afhankelijk van federation-data-realiteit (KNVB/KNHB updaten dit veld onafhankelijk?).
