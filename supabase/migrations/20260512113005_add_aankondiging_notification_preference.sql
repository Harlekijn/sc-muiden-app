-- Voeg aankondiging-voorkeur toe aan notification_preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS aankondiging boolean NOT NULL DEFAULT true;

-- GIN-index voor efficiënte dedup-query in announcement-push edge function
CREATE INDEX IF NOT EXISTS notifications_data_announcement_idx
  ON public.notifications USING GIN (data)
  WHERE type = 'aankondiging';
