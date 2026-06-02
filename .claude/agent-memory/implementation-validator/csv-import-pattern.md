---
name: csv-import-pattern
description: Wizard pattern for CSV import features (teams and members); 4-step flow, beheerder-only, dbFoutmelding helper, soft-delete revival
metadata:
  type: project
---

Both `leden/importeren` and `teams/importeren` follow a 4-step wizard pattern: upload → mapping → preview → done.

- Auth guard: both server-side (layout redirects unauthenticated) and API-level (401/403).
- dbFoutmelding helper: per-domain, translates Postgres error codes to Dutch strings. Not shared — each route defines its own with domain-appropriate messages.
- Soft-delete revival: conflict detection includes `deleted_at IS NOT NULL` rows; import sets `deleted_at = NULL`.
- Per-row isolation: each row is try/catched independently; failures go to `failed[]`, no rollback.
- The `csvImportTeamRowDataSchema` Zod schema does NOT normalize sport case — the API route does `toLowerCase()` before validation.

**Why:** Established by the member import feature; teams import follows the same pattern.
**How to apply:** When validating future import features, check that all five elements (auth, schema, dbFoutmelding, soft-delete, per-row isolation) are present.
