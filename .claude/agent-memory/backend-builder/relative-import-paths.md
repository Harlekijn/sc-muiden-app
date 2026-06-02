---
name: relative-import-paths
description: How to compute relative import paths from nested Next.js API routes to apps/web/lib/
metadata:
  type: project
---

The `lib/` directory lives at `apps/web/lib/`. When writing API routes, count directory levels from the route file back to `apps/web/` and then descend into `lib/`.

Reference: the member import route at `apps/web/app/api/cms/import/route.ts` uses `../../../../lib/` (4 levels up → reaches `apps/web/`).

For teams import at `apps/web/app/api/cms/teams/import/route.ts` (one extra `teams/` nesting), use `../../../../../lib/` (5 levels).

For analyse at `apps/web/app/api/cms/teams/import/analyse/route.ts` (two extra levels), use `../../../../../../lib/` (6 levels).

**Why:** Getting this wrong causes a module-not-found error that only surfaces at runtime or typecheck, not at write time.

**How to apply:** Count every directory segment in the route's path from `apps/web/` and use that many `../` prefixes to get back to `apps/web/`, then append the target subdirectory.
