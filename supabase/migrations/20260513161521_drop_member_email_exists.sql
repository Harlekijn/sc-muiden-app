-- Verwijder de member_email_exists RPC functie
-- De registratieflow gebruikt nu account_requests in plaats van een directe check op members
drop function if exists public.member_email_exists(text);
