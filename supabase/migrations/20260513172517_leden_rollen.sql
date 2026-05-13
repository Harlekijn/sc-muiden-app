-- Ledentypes en vereenvoudigd rolsysteem
--
-- Wijzigingen:
--  1. members: voeg lid_type, is_vrijwilliger, is_barcommissie toe; verwijder role
--  2. profiles: vereenvoudig role check constraint naar ('lid', 'beheerder')
--  3. is_admin(): bijwerken naar role = 'beheerder' only
--  4. sync_log: inline RLS check vervangen door is_admin()

-- ── 1. Nieuwe kolommen op members ────────────────────────────────────────────

alter table public.members
  add column if not exists lid_type text
    check (lid_type in ('jeugdlid','niet-spelend-lid','trainingslid','spelend-lid','relatie')),
  add column if not exists is_vrijwilliger boolean not null default false,
  add column if not exists is_barcommissie boolean not null default false;

-- Verwijder de members.role kolom (team-rollen leven op team_members.role)
alter table public.members drop column if exists role;

-- ── 2. profiles.role vereenvoudigen ──────────────────────────────────────────

-- Migreer: commissielid → beheerder
update public.profiles
  set role = 'beheerder'
  where role = 'commissielid';

-- Migreer: alle overige niet-beheerder rollen (ouder, trainer, coach, teammanager) → lid
update public.profiles
  set role = 'lid'
  where role not in ('lid', 'beheerder');

-- Vervang check constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('lid', 'beheerder'));

-- ── 3. is_admin() bijwerken ───────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'beheerder'
      and deleted_at is null
  );
$$;

-- ── 4. sync_log RLS: inline check vervangen door is_admin() ──────────────────

drop policy if exists "admins_read_sync_log" on public.sync_log;
create policy "admins_read_sync_log"
  on public.sync_log for select
  to authenticated
  using (public.is_admin());

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

create index if not exists members_lid_type_idx
  on public.members (lid_type);

create index if not exists members_is_barcommissie_idx
  on public.members (is_barcommissie)
  where is_barcommissie = true;

create index if not exists members_is_vrijwilliger_idx
  on public.members (is_vrijwilliger)
  where is_vrijwilliger = true;
