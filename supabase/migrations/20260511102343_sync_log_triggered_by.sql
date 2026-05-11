-- Track whether a sync was triggered by the cron scheduler or a manual CMS action
ALTER TABLE sync_log
  ADD COLUMN IF NOT EXISTS triggered_by text NOT NULL DEFAULT 'cron';

CREATE INDEX IF NOT EXISTS idx_sync_log_sport_started
  ON sync_log(sport, started_at DESC);

-- RLS: only beheerder/commissielid can read sync_log (operational data, not public)
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_log_select_admin"
  ON sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('beheerder', 'commissielid')
    )
  );
