-- R-03: vervang announcements.teams uuid[] door junction-tabel announcement_teams
-- Geeft referentiële integriteit, B-tree index op team_id, en per-team RLS.

create table public.announcement_teams (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  team_id         uuid not null references public.teams(id)         on delete cascade,
  primary key (announcement_id, team_id)
);

create index announcement_teams_team_id_idx on public.announcement_teams(team_id);

-- Backfill vanuit bestaande array (als de kolom data bevat)
insert into public.announcement_teams (announcement_id, team_id)
select id, unnest(teams)
from   public.announcements
where  teams is not null
  and  array_length(teams, 1) > 0;

alter table public.announcement_teams enable row level security;

-- Authentieke gebruikers mogen teams lezen van gepubliceerde aankondigingen
create policy "authenticated_select_announcement_teams"
  on public.announcement_teams for select
  using (
    exists (
      select 1 from public.announcements a
      where  a.id          = announcement_id
        and  a.deleted_at  is null
        and  a.published_at is not null
        and  a.published_at <= now()
    )
  );

-- Admins beheren de koppeling (insert/update/delete)
create policy "admins_manage_announcement_teams"
  on public.announcement_teams for all
  using (
    exists (
      select 1 from public.profiles p
      where  p.id   = auth.uid()
        and  p.role in ('beheerder', 'commissielid')
    )
  );

-- Verwijder de oude uuid[]-kolom
alter table public.announcements drop column teams;
