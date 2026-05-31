-- R-02 — Drop BarDaySlot; Activity(type='bardienst') is de bar-dag
--
-- Drop & recreate strategie (geen prod-data).
-- supabase db reset herstelt de seed.

-- 1. View activities_with_occurrences drop (afhankelijk van activities.bar_day_slot_id)
drop view if exists public.activities_with_occurrences;

-- 2. FK-index + kolom op activities verwijderen
drop index if exists activities_bar_day_slot_id_idx;
alter table public.activities drop column if exists bar_day_slot_id;

-- 3. Tabel droppen (cascade verwijdert impliciet RLS-policies, indexes en trigger)
drop table if exists public.bar_day_slots cascade;

-- 4. View opnieuw aanmaken zonder bar_day_slot_id
create or replace view public.activities_with_occurrences
with (security_invoker = true)
as
-- 4a. Alle bestaande activities-rijen
select
  a.id,
  a.type,
  a.sport,
  a.team_id,
  a.recurring_rule_id,
  a.title,
  a.starts_at,
  a.ends_at,
  a.location,
  a.notes,
  a.created_at,
  a.updated_at,
  a.deleted_at,
  false as is_generated
from public.activities a

union all

-- 4b. Gegenereerde training-occurrences uit recurring_rules
select
  public.training_occurrence_id(r.id, d::date)                  as id,
  'training'                                                    as type,
  t.sport                                                       as sport,
  r.team_id                                                     as team_id,
  r.id                                                          as recurring_rule_id,
  ('Training ' || coalesce(t.name, ''))                         as title,
  ((d::date) + r.start_time)::timestamptz                       as starts_at,
  case when r.end_time is not null
       then ((d::date) + r.end_time)::timestamptz
       else null end                                            as ends_at,
  r.location                                                    as location,
  r.notes                                                       as notes,
  r.created_at                                                  as created_at,
  r.updated_at                                                  as updated_at,
  null::timestamptz                                             as deleted_at,
  true                                                          as is_generated
from public.recurring_rules r
join public.teams t on t.id = r.team_id and t.deleted_at is null
cross join lateral generate_series(
  r.valid_from::timestamp,
  coalesce(r.valid_until, r.valid_from + interval '2 years')::timestamp,
  interval '1 day'
) as d
where r.deleted_at is null
  and extract(isodow from d) = r.day_of_week
  and not exists (
    select 1
    from public.activities ov
    where ov.recurring_rule_id = r.id
      and (ov.starts_at)::date = d::date
  );
