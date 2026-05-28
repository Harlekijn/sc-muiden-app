-- Kalender — trainings on-the-fly genereren uit recurring_rules
-- Refactor R-01 (zie docs/REFACTOR_BACKLOG.md)
--
-- 1) pgcrypto + deterministische UUID-helper voor view-rijen
-- 2) Hard-delete bestaande gematerialiseerde rule-rijen die geen override zijn
-- 3) View activities_with_occurrences (UNION van activities + on-the-fly trainings)
-- 4) Indexen voor view-performance
-- 5) Drop notification_preferences.training (training-notificaties worden verwijderd)
-- 6) Drop training_herinnering uit notifications.type CHECK-constraint

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Deterministische UUID per (rule_id, date)
--
-- We gebruiken md5(text)::uuid als deterministische hash. Niet strikt UUID v5
-- (dat vereist exacte byte-manipulatie van een SHA-1) maar wel collision-vrij
-- voor onze input-ruimte (rule_id + datum) en stabiel tussen requests.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.training_occurrence_id(
  p_rule_id uuid,
  p_date date
) returns uuid
language sql
immutable
parallel safe
as $$
  select md5(
    'training-occurrence:' || p_rule_id::text || ':' || to_char(p_date, 'YYYY-MM-DD')
  )::uuid;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Hard-delete oude gematerialiseerde training-rijen die geen override zijn
--
-- Een echte override wijkt af van de rule (afwijkende start_time of locatie).
-- Heuristiek: rijen waar tijd én locatie overeenkomen met de rule worden
-- verwijderd; afwijkingen blijven staan.
-- ─────────────────────────────────────────────────────────────────────────────
delete from public.activities a
using public.recurring_rules r
where a.recurring_rule_id = r.id
  and a.type = 'training'
  and a.deleted_at is null
  and a.starts_at::time = r.start_time
  and coalesce(a.location, '') = coalesce(r.location, '');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Indexen voor view-performance
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists recurring_rules_validity_idx
  on public.recurring_rules(valid_from, valid_until)
  where deleted_at is null;

create index if not exists activities_rule_starts_at_idx
  on public.activities(recurring_rule_id, starts_at)
  where recurring_rule_id is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. View activities_with_occurrences
--
-- security_invoker = true zorgt dat RLS van onderliggende tabellen toegepast
-- wordt op basis van auth.uid() van de aanroeper, niet de view-eigenaar.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.activities_with_occurrences
with (security_invoker = true)
as
-- 4a. Alle bestaande activities-rijen, ongewijzigd
select
  a.id,
  a.type,
  a.sport,
  a.team_id,
  a.recurring_rule_id,
  a.bar_day_slot_id,
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
  null::uuid                                                    as bar_day_slot_id,
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
  -- Excludeer datums waar al een override-Activity bestaat (override = gewone activities-rij)
  and not exists (
    select 1
    from public.activities ov
    where ov.recurring_rule_id = r.id
      and (ov.starts_at)::date = d::date
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Training-notificaties volledig verwijderen
-- ─────────────────────────────────────────────────────────────────────────────

-- Eerst eventuele bestaande training-notificatie-rijen wegwerken om de
-- CHECK-constraint zonder fout te kunnen herzien
delete from public.notifications where type = 'training_herinnering';

-- CHECK-constraint op notifications.type updaten: training_herinnering verwijderd
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type is null or type in (
    'wedstrijd_herinnering',
    'bardienst_herinnering',
    'aankondiging'
  ));

-- training-toggle uit notification_preferences verwijderen
alter table public.notification_preferences
  drop column if exists training;
