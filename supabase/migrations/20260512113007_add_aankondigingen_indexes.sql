-- FK-index op announcements.author_id (ontbrak in originele migratie)
CREATE INDEX IF NOT EXISTS announcements_author_id_idx
  ON public.announcements(author_id);
