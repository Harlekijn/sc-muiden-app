-- Verwijder jeugdlid als geldig lidtype.
-- Bestaande jeugdleden worden niet-spelend-lid.

update public.members
   set lid_type = 'niet-spelend-lid'
 where lid_type = 'jeugdlid';

alter table public.members
  drop constraint if exists members_lid_type_check;

alter table public.members
  add constraint members_lid_type_check
    check (lid_type in ('niet-spelend-lid','trainingslid','spelend-lid','relatie'));
