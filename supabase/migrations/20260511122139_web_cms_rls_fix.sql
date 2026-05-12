-- Phase 5: Web CMS — fix recurring_rules RLS recursion, add profile update policy, add index.

-- 1. Fix recurring_rules: replace inline admin check with is_admin() to prevent RLS recursion.
drop policy if exists "staff_manage_recurring_rules" on public.recurring_rules;

create policy "admins_manage_recurring_rules"
  on public.recurring_rules for all
  to authenticated
  using (public.is_admin());

-- 2. Allow admins to update profiles (required for role assignment in CMS).
drop policy if exists "admins_update_profiles" on public.profiles;

create policy "admins_update_profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Index on activities.starts_at for calendar and dashboard queries.
create index if not exists activities_starts_at_idx
  on public.activities(starts_at)
  where deleted_at is null;
