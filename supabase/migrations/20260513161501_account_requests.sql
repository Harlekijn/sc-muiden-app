-- Tabel voor account aanvragen ingediend via de mobiele app (pre-auth)
create table if not exists public.account_requests (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  email        text not null,
  birth_date   date,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  admin_notes  text,
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Max. één actieve aanvraag per e-mailadres (herindiening na afwijzing is toegestaan)
create unique index if not exists account_requests_active_email_unique
  on public.account_requests (lower(email))
  where status in ('pending', 'approved');

-- Index voor admin-query: pending bovenaan, gesorteerd op datum
create index if not exists account_requests_status_created_idx
  on public.account_requests (status, created_at desc);

-- Index op FK
create index if not exists account_requests_reviewed_by_idx
  on public.account_requests (reviewed_by)
  where reviewed_by is not null;

-- updated_at trigger
create trigger update_account_requests_updated_at
  before update on public.account_requests
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.account_requests enable row level security;

-- Anonieme gebruikers mogen een aanvraag indienen (app-registratie is pre-auth)
create policy account_requests_insert_anon
  on public.account_requests
  for insert
  with check (true);

-- Alleen admins mogen aanvragen lezen en bijwerken
create policy account_requests_admin_all
  on public.account_requests
  for all
  using (public.is_admin());
