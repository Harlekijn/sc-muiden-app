alter table public.notifications
  add column if not exists activity_id uuid references public.activities(id) on delete set null,
  add column if not exists type        text check (type in (
    'wedstrijd_herinnering',
    'bardienst_herinnering',
    'training_herinnering',
    'aankondiging'
  ));

-- Voorkomt dubbele herinneringen bij cron-retry
create unique index if not exists notifications_dedup_idx
  on public.notifications(recipient_profile_id, activity_id, type)
  where activity_id is not null;

create index if not exists notifications_activity_id_idx
  on public.notifications(activity_id);
