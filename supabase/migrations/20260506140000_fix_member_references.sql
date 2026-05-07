-- Add ON DELETE CASCADE to matches.activity_id so that deleting an activity
-- automatically removes its linked match row.
-- (The team_members / bar_assignments member_id fixes were already applied
--  in migration 20260430000008_update_references.sql.)

alter table public.matches
  drop constraint if exists matches_activity_id_fkey;

alter table public.matches
  add constraint matches_activity_id_fkey
    foreign key (activity_id) references public.activities(id) on delete cascade;
