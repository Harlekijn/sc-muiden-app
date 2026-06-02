---
name: teams-import-patterns
description: Patterns discovered while writing teams-import acceptance tests — CSV upload, wizard navigation, API-driven DB-error testing
metadata:
  type: project
---

## File upload via Playwright

Use `fileInput.setInputFiles({ name, mimeType, buffer })` to attach an in-memory CSV. The wizard's file input has `type="file"` and is hidden; `setInputFiles` works even on hidden inputs.

```ts
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles({
  name: 'test.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(csvContent, 'utf-8'),
});
```

## Wizard navigation helper

```ts
async function advanceToPreview(page, csvContent, filename = 'test.csv') {
  await page.goto('/dashboard/teams/importeren');
  await uploadCsvContent(page, csvContent, filename);
  await expect(page.getByText('Kolomkoppeling')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Analyseren' }).click();
  await expect(page.getByText('Importpreview')).toBeVisible({ timeout: 15_000 });
}
```

## AC-8 pattern: testing per-row DB errors without rollback

The wizard UI cannot produce a "DB error during import" scenario (analyse detects conflicts before import). To test per-row error isolation (AC-8), send a crafted import payload via `page.request.post` that includes a row with `status='new'` and a `federation_team_id` that is already in the DB. The endpoint inserts row 0 (success), hits the unique constraint on row 1 (failure), and returns `{ inserted: 1, failed: [{...}] }` without rolling back.

Pre-seed the colliding team before the API call, clean it up afterward.

## Conflict tooltip location

The "Conflict" badge in the preview table has `title={conflictReason}` directly on the `<span>`. Assert with:
```ts
const conflictSpan = page.locator('span[title*="Zelfde federatie-ID"]').first();
```

## Dutch error messages to assert

| Scenario | Dutch text |
|---|---|
| Missing name | `Teamnaam is verplicht` |
| Invalid sport | `Sport is verplicht (voetbal of hockey)` |
| Wrong extension | `Alleen CSV-bestanden zijn toegestaan.` |
| File too large | `Bestand mag niet groter zijn dan 5 MB.` |
| Unauthenticated | `Niet ingelogd.` |
| Wrong role | `Geen toegang.` |
| DB unique constraint | `Teamnaam of federatie-ID bestaat al in de database.` |
| Soft-deleted conflict reason | contains `eerder verwijderd en wordt hersteld` |
| Composite match reason | `Zelfde naam, sport en seizoen` |

**Why:** These strings come from the implementation files and must be exact for assertions.
