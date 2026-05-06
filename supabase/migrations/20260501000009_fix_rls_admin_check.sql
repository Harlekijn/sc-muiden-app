-- Fix: infinite recursion in RLS policies that check admin role.
--
-- Root cause: every policy that does
--   exists (select 1 from public.profiles where id = auth.uid() and role in (...))
-- causes Postgres to evaluate the profiles RLS policies for that inner SELECT,
-- which include `admins_select_all_profiles` — which itself queries profiles.
--
-- Fix: replace all inline admin checks with a security-definer function that reads
-- profiles without going through RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer   -- bypasses RLS on profiles
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('beheerder', 'commissielid')
      and deleted_at is null
  );
$$;

-- ── profiles ────────────────────────────────────────────────────────────────

drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_admin());

-- ── teams ───────────────────────────────────────────────────────────────────

drop policy if exists "admins_manage_teams" on public.teams;
create policy "admins_manage_teams"
  on public.teams for all
  to authenticated
  using (public.is_admin());

drop policy if exists "admins_manage_team_members" on public.team_members;
create policy "admins_manage_team_members"
  on public.team_members for all
  to authenticated
  using (public.is_admin());

-- ── activities ───────────────────────────────────────────────────────────────

drop policy if exists "admins_manage_activities" on public.activities;
create policy "admins_manage_activities"
  on public.activities for all
  to authenticated
  using (public.is_admin());

drop policy if exists "admins_manage_bar_assignments" on public.bar_assignments;
create policy "admins_manage_bar_assignments"
  on public.bar_assignments for all
  to authenticated
  using (public.is_admin());

-- ── notifications ────────────────────────────────────────────────────────────

drop policy if exists "admins_manage_notifications" on public.notifications;
create policy "admins_manage_notifications"
  on public.notifications for all
  to authenticated
  using (public.is_admin());

-- ── members / family linking (migration 007 + 008) ──────────────────────────

drop policy if exists "members_admin_all" on public.members;
create policy "members_admin_all"
  on public.members for all
  to authenticated
  using (public.is_admin());

drop policy if exists "family_links_admin_all" on public.user_family_members;
create policy "family_links_admin_all"
  on public.user_family_members for all
  to authenticated
  using (public.is_admin());

drop policy if exists "requests_admin_all" on public.family_link_requests;
create policy "requests_admin_all"
  on public.family_link_requests for all
  to authenticated
  using (public.is_admin());

-- ── members_select_own_and_family: inline admin check ────────────────────────
-- The inline exists(...) in this policy also triggers the recursion chain once
-- it evaluates profiles RLS. Replace with is_admin().

drop policy if exists "members_select_own_and_family" on public.members;
create policy "members_select_own_and_family"
  on public.members for select
  to authenticated
  using (
    deleted_at is null
    and (
      id in (
        select member_id from public.profiles
         where id = auth.uid() and member_id is not null
        union
        select member_id from public.user_family_members
         where profile_id = auth.uid()
      )
      or public.is_admin()
    )
  );
