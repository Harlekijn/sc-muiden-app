-- Fix: team_members and bar_assignments used family_member_id → family_members,
-- but the canonical data model (shared types, hooks) expects member_id → members.
-- The family_members table is an app-side concept (user-created sub-profiles);
-- team assignments and bar duty belong to canonical club members.

-- ── team_members ─────────────────────────────────────────────────────────────

alter table public.team_members
  drop constraint if exists team_members_family_member_id_fkey;

alter table public.team_members
  drop constraint if exists team_members_team_id_family_member_id_key;

alter table public.team_members
  rename column family_member_id to member_id;

alter table public.team_members
  add constraint team_members_member_id_fkey
    foreign key (member_id) references public.members(id) on delete cascade;

alter table public.team_members
  add constraint team_members_team_id_member_id_key
    unique (team_id, member_id);

alter index if exists team_members_family_member_id_idx
  rename to team_members_member_id_idx;

-- ── bar_assignments ───────────────────────────────────────────────────────────

alter table public.bar_assignments
  drop constraint if exists bar_assignments_family_member_id_fkey;

alter table public.bar_assignments
  rename column family_member_id to member_id;

alter table public.bar_assignments
  add constraint bar_assignments_member_id_fkey
    foreign key (member_id) references public.members(id);

-- Add cascade so deleting an activity cleans up its match row too.
alter table public.matches
  drop constraint if exists matches_activity_id_fkey;

alter table public.matches
  add constraint matches_activity_id_fkey
    foreign key (activity_id) references public.activities(id) on delete cascade;

-- ── RLS: activities ───────────────────────────────────────────────────────────

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
              select 1 from public.profiles p
              where p.id = auth.uid() and p.member_id = tm.member_id
            )
            or exists (
              select 1 from public.user_family_members ufm
              where ufm.profile_id = auth.uid() and ufm.member_id = tm.member_id
            )
          )
      )
    )
  );

-- ── RLS: team_members ─────────────────────────────────────────────────────────

drop policy if exists "users_select_own_team_memberships" on public.team_members;

create policy "users_select_own_team_memberships"
  on public.team_members for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.member_id = team_members.member_id
          or exists (
            select 1 from public.user_family_members ufm
            where ufm.profile_id = auth.uid() and ufm.member_id = team_members.member_id
          )
        )
    )
  );

-- ── RLS: bar_assignments ──────────────────────────────────────────────────────

drop policy if exists "users_select_own_bar_assignments" on public.bar_assignments;

create policy "users_select_own_bar_assignments"
  on public.bar_assignments for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.member_id = bar_assignments.member_id
          or exists (
            select 1 from public.user_family_members ufm
            where ufm.profile_id = auth.uid() and ufm.member_id = bar_assignments.member_id
          )
        )
    )
  );

drop policy if exists "users_update_own_bar_assignments" on public.bar_assignments;

create policy "users_update_own_bar_assignments"
  on public.bar_assignments for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.member_id = bar_assignments.member_id
          or exists (
            select 1 from public.user_family_members ufm
            where ufm.profile_id = auth.uid() and ufm.member_id = bar_assignments.member_id
          )
        )
    )
  );
