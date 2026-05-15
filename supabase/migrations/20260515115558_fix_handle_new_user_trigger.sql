-- Fix handle_new_user trigger na leden-rollen migratie
--
-- De leden-rollen migratie verwijderde members.role maar vergat de trigger bij
-- te werken. De trigger deed SELECT id, role FROM members en gebruikte die rol
-- bij het aanmaken van het profiel. Nieuwe gebruikers beginnen altijd als 'lid';
-- beheerdersrol wordt expliciet toegewezen door een beheerder (of seed script).

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_member_id uuid;
begin
  select id
    into v_member_id
    from public.members
   where email = new.email
     and deleted_at is null
   limit 1;

  insert into public.profiles (id, email, display_name, role, member_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'lid',
    v_member_id
  );

  return new;
end;
$$ language plpgsql security definer;
