create table if not exists public.notification_preferences (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  wedstrijd   boolean     not null default true,
  bardienst   boolean     not null default true,
  training    boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(profile_id)
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.handle_updated_at();

create index notification_preferences_profile_id_idx
  on public.notification_preferences(profile_id);

alter table public.notification_preferences enable row level security;

-- Gebruikers beheren alleen hun eigen voorkeuren
create policy "users_manage_own_notification_preferences"
  on public.notification_preferences for all
  using (auth.uid() = profile_id);
