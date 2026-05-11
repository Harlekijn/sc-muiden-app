-- Add team_id to matches so we know which SC Muiden team played in a synced match
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_team_id       ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_fed_match_id  ON matches(federation_match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status        ON matches(status);

-- RLS: all authenticated users can read match data (public club data, not personal)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_authenticated"
  ON matches FOR SELECT
  USING (auth.role() = 'authenticated');
