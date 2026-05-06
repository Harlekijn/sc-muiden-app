-- Partial index for RLS soft-delete filter on recurring_rules.
-- The authenticated_select_recurring_rules policy filters on deleted_at IS NULL;
-- this partial index avoids a full table scan for that clause.
create index if not exists recurring_rules_active_idx
  on public.recurring_rules(id)
  where deleted_at is null;
