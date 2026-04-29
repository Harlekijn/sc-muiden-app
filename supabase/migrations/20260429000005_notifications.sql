create table public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  recipient_profile_id  uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  body                  text not null,
  data                  jsonb,
  sent_at               timestamptz,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications(recipient_profile_id);

create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text not null check (platform in ('ios','android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute procedure public.handle_updated_at();

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  sport         text[],
  teams         uuid[],
  published_at  timestamptz,
  author_id     uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute procedure public.handle_updated_at();

create index announcements_published_at_idx on public.announcements(published_at);

create table public.sync_log (
  id               uuid primary key default gen_random_uuid(),
  sport            text not null check (sport in ('voetbal','hockey')),
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  records_updated  int,
  error            text,
  created_at       timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.announcements enable row level security;
alter table public.sync_log enable row level security;

-- Notifications: users see only their own; edge functions use service_role (bypasses RLS)
create policy "users_select_own_notifications"
  on public.notifications for select
  using (auth.uid() = recipient_profile_id);

create policy "users_update_own_notifications"
  on public.notifications for update
  using (auth.uid() = recipient_profile_id);

-- Push tokens: users manage their own
create policy "users_manage_own_push_tokens"
  on public.push_tokens for all
  using (auth.uid() = profile_id);

-- Announcements: published records visible to all authenticated users
create policy "authenticated_select_published_announcements"
  on public.announcements for select
  using (
    deleted_at is null
    and published_at is not null
    and published_at <= now()
  );

create policy "admins_manage_announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );

-- Sync log: read-only for admins
create policy "admins_select_sync_log"
  on public.sync_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('beheerder', 'commissielid')
    )
  );
