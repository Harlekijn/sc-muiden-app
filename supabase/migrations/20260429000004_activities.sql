create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('training','wedstrijd','bardienst','clubactiviteit')),
  sport       text check (sport in ('voetbal','hockey')),
  team_id     uuid references public.teams(id),
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index activities_starts_at_idx on public.activities(starts_at);
create index activities_team_id_idx on public.activities(team_id);

create trigger activities_updated_at
  before update on public.activities
  for each row execute procedure public.handle_updated_at();

create table public.matches (
  id                    uuid primary key default gen_random_uuid(),
  activity_id           uuid references public.activities(id),
  federation_match_id   text,
  home_team             text not null,
  away_team             text not null,
  score_home            int,
  score_away            int,
  status                text not null default 'gepland'
                          check (status in ('gepland','live','gespeeld','afgelast')),
  played_at             timestamptz,
  federation_source     text check (federation_source in ('knvb','knhb')),
  raw_data              jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger matches_updated_at
  before update on public.matches
  for each row execute procedure public.handle_updated_at();

create table public.bar_assignments (
  id               uuid primary key default gen_random_uuid(),
  activity_id      uuid not null references public.activities(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id),
  confirmed_at     timestamptz,
  created_at       timestamptz not null default now()
);

create index bar_assignments_activity_id_idx on public.bar_assignments(activity_id);

alter table public.activities enable row level security;
alter table public.matches enable row level security;
alter table public.bar_assignments enable row level security;

-- Activities visible to own team members or club-wide (null team_id)
create policy "users_select_own_activities"
  on public.activities for select
  using (
    deleted_at is null
    and (
      team_id is null
      or exists (
        select 1 from public.team_members tm
          join public.family_members fm on fm.id = tm.family_member_id
        where tm.team_id = activities.team_id
          and fm.account_id = auth.uid()
          and tm.deleted_at is null
          and fm.deleted_at is null
      )
    )
  );

create policy "staff_manage_activities"
  on public.activities for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid', 'trainer', 'coach', 'teammanager')
    )
  );

create policy "authenticated_select_matches"
  on public.matches for select
  using (auth.role() = 'authenticated');

create policy "admins_manage_matches"
  on public.matches for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );

create policy "users_select_own_bar_assignments"
  on public.bar_assignments for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.id = family_member_id
        and fm.account_id = auth.uid()
    )
  );

create policy "users_update_own_bar_assignments"
  on public.bar_assignments for update
  using (
    exists (
      select 1 from public.family_members fm
      where fm.id = family_member_id
        and fm.account_id = auth.uid()
    )
  );

create policy "admins_manage_bar_assignments"
  on public.bar_assignments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid', 'teammanager')
    )
  );
