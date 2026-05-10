-- Registration gate: allow unauthenticated users to check whether an email
-- address exists in the members table without exposing member data.
--
-- The function runs as security definer (bypasses RLS) and returns only a
-- boolean, so no member details leak to anonymous callers.

create or replace function public.member_email_exists(p_email text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(p_email)
      and deleted_at is null
  );
$$;

grant execute on function public.member_email_exists(text) to anon;
