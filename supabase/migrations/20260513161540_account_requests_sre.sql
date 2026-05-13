-- Verscherp de anonieme insert policy op account_requests:
-- Voorheen: with check (true) — stond anon gebruikers toe om status op 'approved' te zetten
-- Nu: alleen status='pending' toegestaan bij insert, reviewed_by en reviewed_at moeten null zijn
drop policy if exists account_requests_insert_anon on public.account_requests;

create policy account_requests_insert_anon
  on public.account_requests
  for insert
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
