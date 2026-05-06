# /pr-gate — PR Quality Gate

Final quality gate before creating a pull request. Validates implementation completeness, test coverage, design system compliance, Dutch copy, and GDPR. Creates the PR, then monitors CI checks until they all pass.

## Usage

```
/pr-gate <feature-slug>
/pr-gate wedstrijd-herinnering
```

---

## Instructions

The feature slug is: **$ARGUMENTS**

If $ARGUMENTS is empty, ask: "Welke feature slug wil je naar review sturen? (bijv. `wedstrijd-herinnering`)" Wait for the answer.

Read `docs/designs/<feature-slug>.md`. If it does not exist, stop:
"Geen design document gevonden voor `<feature-slug>`. Voer eerst `/design <feature-slug>` uit."

Identify all files changed on this branch:
```
git diff main...HEAD --name-only
```

Run every gate below. Output each gate's result immediately after completing it.

**BLOCKER** = must be resolved before the PR is created.
**WARNING** = noted in the PR body but does not block creation.

---

### Gate 1 — Implementation completeness

Read the "Implementatieplan" section of `docs/designs/<feature-slug>.md`.

For each numbered item in the plan, verify the expected file exists in the repository. Use `find . -name "<filename>"` or `ls <path>` to confirm.

If any item is unaddressed: **BLOCKER** — implement the missing piece before continuing.

Output: "Gate 1 Volledigheid — [GESLAAGD / BLOCKER: <missing items>]"

---

### Gate 2 — Scenario test coverage

Read the "Scenario updates" section of `docs/designs/<feature-slug>.md` for the list of scenario IDs this feature introduces or modifies (format: `SNN-X`).

Search for those IDs in test files:
```
grep -r "S[0-9][0-9]-[A-Z]" apps/ packages/ supabase/ --include="*.ts" --include="*.tsx" --include="*.yaml"
```

For each scenario ID from the design doc:
- Happy path must have at least one automated test
- At least one error path must have an automated test

If any scenario has no automated test: **BLOCKER** — write the missing test.

Output: "Gate 2 Scenariodekking — [GESLAAGD / BLOCKER: <untested scenarios>]"

---

### Gate 3 — TypeScript quality

```
pnpm typecheck
```

If it fails: **BLOCKER**. Fix all errors. Re-run until it passes.

Search for type violations in files changed on this branch:
```
git diff main...HEAD --name-only | xargs grep -l ": any\|as any\|@ts-ignore" 2>/dev/null
```

For each match: check if the file was introduced by this feature (in the `git diff` output). If yes: **BLOCKER** — remove the `any` or `@ts-ignore`. Fix and re-verify.

Output: "Gate 3 TypeScript — [GESLAAGD / BLOCKER: <issues>]"

---

### Gate 4 — Test suite

```
pnpm test
```

If any test fails: **BLOCKER**. Fix the failure. Do not use `.skip`, `xtest`, or comment out tests. Re-run until all pass.

Output: "Gate 4 Tests — [GESLAAGD / BLOCKER: <failing tests>]"

---

### Gate 5 — Dutch copy

Search for English user-visible strings in new files:
```
git diff main...HEAD --name-only | xargs grep -ln "\" Error\|\"Failed\|\" Loading\|\" Success\|\" Cancel\|\" Submit\|\" Delete\|\" Confirm\|placeholder=\"[A-Z]\|label=\"[A-Z]" 2>/dev/null
```

For each match, inspect the line. Classify as:
- **User-visible string** (label, error message, button text, placeholder, toast, modal heading): **BLOCKER** if in English — replace with Dutch
- **Code comment, variable name, `console.log`**: WARNING only — note it

Output: "Gate 5 Nederlandse teksten — [GESLAAGD / BLOCKER: <English strings found>]"

---

### Gate 6 — Design system compliance

For each new `.tsx` file introduced by this feature:

```
git diff main...HEAD --name-only | grep "\.tsx$"
```

For each file, check:
- [ ] No hardcoded hex colors (`#0`, `#f`, `rgb(`, `rgba(` not from token variables) — **BLOCKER** if found
- [ ] No emoji characters in JSX — **BLOCKER** if found
- [ ] No Lucide icon imports with `-fill` suffix or `fill=` prop — **BLOCKER** if found
- [ ] Shadow styles use `rgba(1, 29, 80, ...)` — navy-tinted, not `rgba(0, 0, 0, ...)` — **WARNING** if pure black
- [ ] No CSS gradients in component styles (only permitted in dedicated hero/banner overlay components) — **BLOCKER** if found in a standard component

Fix all BLOCKERs inline.

Output: "Gate 6 Designsysteem — [GESLAAGD / BLOCKER: <violations>]"

---

### Gate 7 — Update project memory

Read all files in `/Users/gielitho/.claude/projects/-Users-gielitho-Development-sc-muiden-app/memory/`.

Determine which facts introduced by this feature are worth preserving for future conversations:
- New database tables and their purpose
- New patterns introduced (new hook pattern, new component pattern)
- Architectural decisions made during design (e.g. "push notifications voor bardienst verlopen via de push-trigger edge function")
- GDPR decisions documented

For each new fact:
- If it fits an existing memory file topic: append to that file
- If it is a distinct new topic: create a new file `<topic-slug>.md` with frontmatter (`name`, `description`, `type: project`)
- Update `MEMORY.md` index if a new file was created

Output: "Gate 7 Projectgeheugen — bijgewerkt"

---

### Gate 8 — Commit final fixes

If there are uncommitted changes from gates 1–7:

```
git status --short
```

Stage specific files (never `git add .` or `git add -A`):
```
git add <specific file paths only>
git commit -m "chore(<feature-slug>): pr-gate fixes"
```

---

### Gate 9 — Create PR

All gates must be GESLAAGD before this step.

Get the current branch:
```
git branch --show-current
```

Push if not yet pushed:
```
git push -u origin <branch>
```

Extract key sections from `docs/designs/<feature-slug>.md` to compose the PR body. Find these sections: Use Cases (UC-01…), Acceptatiecriteria, GDPR compliance table, and Scenario updates. Compose:

```
gh pr create \
  --title "feat(<feature-slug>): <one-line Dutch description of what this adds>" \
  --base main \
  --body "$(cat <<'PREOF'
## Wat is er gebouwd

<2–3 bullet points from the use cases, in Dutch>

## Acceptatiecriteria

<copy the Gegeven/Als/Dan criteria from the design doc>

## GDPR

<copy the GDPR compliance table from the design doc>

## Scenario's

<list scenario IDs and their titles, e.g. S05-A — Gebruiker maakt bardienst aan>

## SRE

<one-line summary of the SRE Notes section>

## Testplan

- [ ] Lokaal: `supabase db reset && pnpm test`
- [ ] Preview build: controleer EAS build in CI
- [ ] Handmatig: doorloop scenario's uit `docs/scenarios/`

---
🤖 Gegenereerd met [Claude Code](https://claude.ai/claude-code)
PREOF
)"
```

Note the PR URL from the output.

---

### Gate 10 — Monitor CI and fix failures

EAS Build can take 10–15 minutes. Poll with a 90-second interval. Wait up to 20 minutes for EAS Build checks before declaring a timeout.

```
gh pr checks
```

Parse the output:
- If all checks show `pass`: done. Go to Done step.
- If any check shows `fail`: proceed with fix loop below.
- If EAS Build check shows `pending` and less than 20 minutes have elapsed: wait 90 seconds and re-check.
- If EAS Build check is still `pending` after 20 minutes: output "EAS Build duurt langer dan verwacht — controleer de Expo dashboard." and continue monitoring.

**Fix loop** (for failed checks):

1. Get the run ID from the `gh pr checks` output
2. Read the failure log:
   ```
   gh run view <run-id> --log-failed
   ```
3. Identify the root cause:
   - TypeScript error → fix the type
   - Test failure → fix the test or the implementation
   - Lint error → fix the lint violation
   - Build error → fix the build configuration
4. Fix the root cause in the relevant file(s)
5. Stage and commit the fix with specific files:
   ```
   git add <specific files>
   git commit -m "fix(<feature-slug>): <short description of what was fixed>"
   git push
   ```
6. Wait 90 seconds, then run `gh pr checks` again
7. Repeat until all checks are green

**Escalation:** If the same check fails 3 consecutive times after different fix attempts, stop the loop. Output the full failure log and state clearly:
"Ik kan deze CI-fout niet automatisch oplossen. Blocker: [specific error]. Hulp nodig bij: [what specifically needs to be resolved]."

---

### Done

After all gates pass and all CI checks are green:

"PR gate voltooid voor `<feature-slug>`.

PR: <url>
Branch: <branch>
Alle CI checks: geslaagd.

De branch staat klaar voor code review."
