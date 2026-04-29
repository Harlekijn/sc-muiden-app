create table public.family_members (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.profiles(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  birth_date      date,
  sport           text[] not null default '{}',
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index family_members_account_id_idx on public.family_members(account_id);

alter table public.family_members enable row level security;

create policy "users_manage_own_family_members"
  on public.family_members for all
  using (auth.uid() = account_id);

create policy "admins_select_all_family_members"
  on public.family_members for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );
