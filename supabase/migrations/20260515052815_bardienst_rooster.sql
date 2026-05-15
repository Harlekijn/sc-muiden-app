-- Bardienst Rooster Generator
--
-- Wijzigingen:
--  1. Nieuwe tabel bar_day_slots — configureert welke dagen bardienst nodig zijn
--  2. activities: voeg bar_day_slot_id kolom toe (tracering van auto-gegenereerde diensten)

-- ── 1. bar_day_slots ──────────────────────────────────────────────────────────

create table if not exists public.bar_day_slots (
  id         uuid        primary key default gen_random_uuid(),
  date       date        not null,
  starts_at  time        not null,
  ends_at    time        not null,
  sport      text        check (sport in ('voetbal', 'hockey')), -- null = club-breed
  season     text        not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint bar_day_slots_times_check check (ends_at > starts_at)
);

alter table public.bar_day_slots enable row level security;

-- Alleen beheerders mogen day-slots lezen en beheren
create policy "bar_day_slots_admin_all"
  on public.bar_day_slots
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists bar_day_slots_date_idx
  on public.bar_day_slots (date);

create index if not exists bar_day_slots_season_idx
  on public.bar_day_slots (season);

create index if not exists bar_day_slots_deleted_idx
  on public.bar_day_slots (deleted_at)
  where deleted_at is null;

create trigger bar_day_slots_updated_at
  before update on public.bar_day_slots
  for each row execute procedure public.handle_updated_at();

-- ── 2. activities.bar_day_slot_id ────────────────────────────────────────────

alter table public.activities
  add column if not exists bar_day_slot_id uuid
    references public.bar_day_slots(id) on delete set null;

create index if not exists activities_bar_day_slot_id_idx
  on public.activities (bar_day_slot_id)
  where bar_day_slot_id is not null;
