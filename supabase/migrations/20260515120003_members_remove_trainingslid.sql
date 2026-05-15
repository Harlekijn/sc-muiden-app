-- Verwijder trainingslid als geldig lidtype.
-- Bestaande trainingsleden worden niet-spelend-lid.

update public.members
   set lid_type = 'niet-spelend-lid'
 where lid_type = 'trainingslid';

alter table public.members
  drop constraint if exists members_lid_type_check;

alter table public.members
  add constraint members_lid_type_check
    check (lid_type in ('niet-spelend-lid','spelend-lid','relatie'));
