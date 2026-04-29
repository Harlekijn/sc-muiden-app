create table public.teams (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  sport               text not null check (sport in ('voetbal', 'hockey')),
  age_category        text,
  season              text,
  federation_team_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create trigger teams_updated_at
  before update on public.teams
  for each row execute procedure public.handle_updated_at();

create table public.team_members (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references public.teams(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  role             text not null default 'speler'
                     check (role in ('speler','trainer','coach','teammanager')),
  jersey_number    int,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (team_id, family_member_id)
);

create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_family_member_id_idx on public.team_members(family_member_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "authenticated_select_teams"
  on public.teams for select
  using (auth.role() = 'authenticated' and deleted_at is null);

create policy "admins_manage_teams"
  on public.teams for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );

create policy "users_select_own_team_memberships"
  on public.team_members for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.id = family_member_id
        and fm.account_id = auth.uid()
        and fm.deleted_at is null
    )
  );

create policy "admins_manage_team_members"
  on public.team_members for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );
