-- Phase 1: Introduce members as the canonical club member entity.
-- Users (profiles) link to members by email. Family linking requires admin approval.

-- 1. members table
create table public.members (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  birth_date    date,
  email         text,
  phone         text,
  sport         text[] not null default '{}',
  role          text not null default 'lid'
                  check (role in ('lid','ouder','trainer','coach','teammanager','commissielid','beheerder')),
  clubbase_id   text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index members_email_idx on public.members(email) where email is not null;

create trigger members_updated_at
  before update on public.members
  for each row execute procedure public.handle_updated_at();

alter table public.members enable row level security;

-- 2. user_family_members: approved links between a profile and a member
create table public.user_family_members (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  member_id   uuid not null references public.members(id) on delete cascade,
  linked_at   timestamptz not null default now(),
  unique (profile_id, member_id)
);

alter table public.user_family_members enable row level security;

-- 3. family_link_requests: pending admin approval
create table public.family_link_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  birth_date  date,
  member_id   uuid references public.members(id),
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger family_link_requests_updated_at
  before update on public.family_link_requests
  for each row execute procedure public.handle_updated_at();

alter table public.family_link_requests enable row level security;

-- 4. Alter profiles: add member_id link
alter table public.profiles
  add column member_id uuid references public.members(id);

-- 5. Replace handle_new_user to auto-link member by email on registration
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_member_id uuid;
  v_member_role text;
begin
  select id, role
    into v_member_id, v_member_role
    from public.members
   where email = new.email
     and deleted_at is null
   limit 1;

  insert into public.profiles (id, email, display_name, role, member_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(v_member_role, 'lid'),
    v_member_id
  );
  return new;
end;
$$ language plpgsql security definer;

-- 6. RLS policies

-- members: users can see their own member + approved family members; admins see all
create policy "members_select_own_and_family"
  on public.members for select
  to authenticated
  using (
    deleted_at is null
    and (
      id in (
        select member_id from public.profiles where id = auth.uid() and member_id is not null
        union
        select member_id from public.user_family_members where profile_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('beheerder', 'commissielid')
      )
    )
  );

create policy "members_admin_all"
  on public.members for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('beheerder', 'commissielid')
    )
  );

-- user_family_members: users see their own links; admins manage all
create policy "family_links_select_own"
  on public.user_family_members for select
  to authenticated
  using (profile_id = auth.uid());

create policy "family_links_admin_all"
  on public.user_family_members for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('beheerder', 'commissielid')
    )
  );

-- family_link_requests: users create and view their own; admins manage all
create policy "requests_insert_own"
  on public.family_link_requests for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "requests_select_own"
  on public.family_link_requests for select
  to authenticated
  using (profile_id = auth.uid());

create policy "requests_admin_all"
  on public.family_link_requests for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('beheerder', 'commissielid')
    )
  );
