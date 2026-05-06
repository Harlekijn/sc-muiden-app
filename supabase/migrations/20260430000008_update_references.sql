-- Replace family_members references with members in team_members and bar_assignments.
-- Drop old family_members table.

-- 1. team_members: drop old FK + unique, rename column, add new FK + unique + index
alter table public.team_members drop constraint team_members_family_member_id_fkey;
alter table public.team_members drop constraint team_members_team_id_family_member_id_key;
drop index if exists public.team_members_family_member_id_idx;

-- Drop old RLS policy that references family_members
drop policy if exists "users_select_own_team_memberships" on public.team_members;

alter table public.team_members rename column family_member_id to member_id;

alter table public.team_members
  add constraint team_members_member_id_fkey
    foreign key (member_id) references public.members(id) on delete cascade;

alter table public.team_members
  add constraint team_members_team_id_member_id_key
    unique (team_id, member_id);

create index team_members_member_id_idx on public.team_members(member_id);

-- Restore RLS policy using members instead of family_members
create policy "users_select_own_team_memberships"
  on public.team_members for select
  using (
    exists (
      select 1 from public.user_family_members ufm
      where ufm.member_id = team_members.member_id
        and ufm.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.member_id = team_members.member_id
    )
  );

-- 2. bar_assignments: drop old FK, rename column, add new FK
alter table public.bar_assignments drop constraint bar_assignments_family_member_id_fkey;

-- Drop old RLS policies that reference family_members
drop policy if exists "users_select_own_bar_assignments" on public.bar_assignments;
drop policy if exists "users_update_own_bar_assignments" on public.bar_assignments;

alter table public.bar_assignments rename column family_member_id to member_id;

alter table public.bar_assignments
  add constraint bar_assignments_member_id_fkey
    foreign key (member_id) references public.members(id);

-- Restore RLS policies using members instead of family_members
create policy "users_select_own_bar_assignments"
  on public.bar_assignments for select
  using (
    exists (
      select 1 from public.user_family_members ufm
      where ufm.member_id = bar_assignments.member_id
        and ufm.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.member_id = bar_assignments.member_id
    )
  );

create policy "users_update_own_bar_assignments"
  on public.bar_assignments for update
  using (
    exists (
      select 1 from public.user_family_members ufm
      where ufm.member_id = bar_assignments.member_id
        and ufm.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.member_id = bar_assignments.member_id
    )
  );

-- 3. activities RLS: update policy that references family_members
drop policy if exists "users_select_own_activities" on public.activities;

create policy "users_select_own_activities"
  on public.activities for select
  using (
    deleted_at is null
    and (
      team_id is null
      or exists (
        select 1 from public.team_members tm
        where tm.team_id = activities.team_id
          and tm.deleted_at is null
          and (
            exists (
              select 1 from public.user_family_members ufm
              where ufm.member_id = tm.member_id and ufm.profile_id = auth.uid()
            )
            or exists (
              select 1 from public.profiles p
              where p.id = auth.uid() and p.member_id = tm.member_id
            )
          )
      )
    )
  );

-- 4. Drop the old family_members table (cascade drops its FK constraints and indexes)
drop table if exists public.family_members cascade;
