---
name: csv-import-pattern
description: "Established CSV import wizard pattern — both member and teams import use identical 4-step wizard shape, state management, and API integration"
metadata:
  type: project
---

The CMS CSV import feature follows a consistent pattern established by the member import and confirmed by teams import.

**Wizard state shape** (`useState`):
- `step`: `'upload' | 'mapping' | 'preview' | 'done'`
- `csvHeaders`: `string[]` — parsed from row 0
- `csvRows`: `Record<string, string>[]` — parsed data rows (teams import) or `string[][]` (member import)
- `mapping`: `Record<number, string>` — column index → app field name (teams uses index key; member import uses header-name key — prefer index key for safety)
- `previewRows`: `CsvImportTeamRow[]` / `CsvImportRow[]` — from analyse endpoint
- `selectedConflicts`: `Set<number>` — row indices of conflicts user selected
- `importResult`: result type or null
- `analysing`, `importing`: boolean loading flags
- `fileError`, `importError`: string | null

**parseCsv helper:** split on `/\r?\n/`, take row 0 as headers, split each line on `,`, strip surrounding quotes. Returns `{ headers, rows }`. No RFC 4180 support (no commas in field values).

**AUTO_MAP:** flat Record keyed by lowercased CSV header strings → app field name. Cover English and Dutch aliases for each field.

**Column mapping:** teams import uses `Record<number, string>` (column index → field), assembled in `handleAnalyse` as:
```ts
csvHeaders.forEach((header, i) => {
  const field = mapping[i];
  if (field) obj[field] = row[header] ?? '';
});
```

**Soft-delete revival:** backend embeds revival note in `conflictReason` text when `deleted_at IS NOT NULL`. Frontend uses `conflictReason` directly as tooltip title — do NOT re-append revival text on the frontend (would duplicate).

**Back button resets ALL state** via a `resetState()` function — not just step.

**Styling:** `const s: Record<string, React.CSSProperties>` at bottom of file, all CSS custom properties, no hardcoded hex.

**Why:** Consistency with member import established this pattern; teams import follows it exactly.

**How to apply:** Any future CSV import (matches, activities, etc.) should use the same wizard shape, parseCsv helper, AUTO_MAP approach, and `resetState()` reset pattern. See [[csv-import-pattern]] in project memory for auth guard/DB patterns.
