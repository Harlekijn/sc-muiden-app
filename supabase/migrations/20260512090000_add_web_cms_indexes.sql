-- Phase 5: Web CMS — missing indexes for CMS query patterns.

-- 1. profiles.member_id: used in rollen page JOIN and RLS on member tables.
create index if not exists profiles_member_id_idx
  on public.profiles(member_id)
  where member_id is not null;

-- 2. members(first_name, last_name, birth_date): used by CSV import duplicate detection.
create index if not exists members_name_birthdate_idx
  on public.members(first_name, last_name, birth_date)
  where deleted_at is null;

-- 3. bar_assignments.member_id: used in RLS policies and bar assignment queries.
create index if not exists bar_assignments_member_id_idx
  on public.bar_assignments(member_id);
