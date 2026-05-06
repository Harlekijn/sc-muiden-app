# /develop — Full Development Workflow

Orchestrate the complete 4-phase SC Muiden development workflow: Design → Implement → SRE → PR Gate. Creates a feature branch, runs each phase in sequence, and pauses for confirmation between phases.

## Usage

```
/develop <feature-slug>
/develop wedstrijd-herinnering
/develop bardienst-bevestiging
```

---

## Instructions

The feature slug is: **$ARGUMENTS**

If $ARGUMENTS is empty, ask: "Welke feature wil je bouwen? Geef een kebab-case slug (bijv. `bardienst-bevestiging`)." Wait for the answer before continuing.

---

### Setup — Create feature branch

Check the current branch:
```
git branch --show-current
```

**If already on `feature/<feature-slug>`:** skip branch creation. Output: "Al op branch `feature/<feature-slug>`. Workflow hervat." Then go directly to Phase 1.

**If on any other branch:** create the feature branch:
```
git checkout main
git pull origin main
git checkout -b feature/<feature-slug>
```

If `feature/<feature-slug>` already exists locally (error: branch already exists), check it out:
```
git checkout feature/<feature-slug>
```

Output: "Branch `feature/<feature-slug>` aangemaakt. Start met Phase 1: Design."

---

## PHASE 1 — DESIGN

Read the file `.claude/commands/design.md` in full. Execute every instruction in that file exactly as written, using `<feature-slug>` as the value for $ARGUMENTS.

Do not summarize or abbreviate the design process. Follow every step, including the one-at-a-time question interview, the GDPR table, the scenario numbering, and saving the design artifact to `docs/designs/<feature-slug>.md`.

After the design artifact and scenario files are saved:

**Commit:**
```
git add docs/designs/<feature-slug>.md docs/scenarios/
git commit -m "design(<feature-slug>): add design document and scenario updates"
```

**Pause — ask the user:**

"**Phase 1 Design voltooid** en gecommit naar `feature/<feature-slug>`.

Design opgeslagen in `docs/designs/<feature-slug>.md`.

Doorgaan naar **Phase 2: Implementatie**? (ja/nee)"

Wait for the answer.
- If "ja" or any affirmative: proceed to Phase 2.
- If "nee" or any negative: output "Gestopt na Phase 1. Hervat later met `/implement <feature-slug>` of `/develop <feature-slug>`." Stop.

---

## PHASE 2 — IMPLEMENT

Read the file `.claude/commands/implement.md` in full. Execute every instruction in that file exactly as written, using `<feature-slug>` as the value for $ARGUMENTS.

Do not summarize or abbreviate. Follow every step including migrations, type generation, mobile/web/edge implementation, tests, and all three verification commands (`pnpm typecheck`, `pnpm test`, `pnpm lint`).

After all verification commands pass:

**Commit:**
```
git add <all implementation files — list them specifically>
git commit -m "feat(<feature-slug>): implement feature — migrations, types, mobile, web, tests"
```

**Pause — ask the user:**

"**Phase 2 Implementatie voltooid** en gecommit.

- Typecheck: geslaagd
- Tests: geslaagd
- Lint: geslaagd

Doorgaan naar **Phase 3: SRE audit**? (ja/nee)"

Wait for the answer.
- If "ja": proceed to Phase 3.
- If "nee": output "Gestopt na Phase 2. Hervat later met `/sre <feature-slug>` of `/develop <feature-slug>`." Stop.

---

## PHASE 3 — SRE AUDIT

Read the file `.claude/commands/sre.md` in full. Execute every instruction in that file exactly as written, using `<feature-slug>` as the value for $ARGUMENTS.

Do not summarize or abbreviate. Run all 5 checks, fix all issues inline, and append the SRE Notes section to `docs/designs/<feature-slug>.md`.

After the SRE notes are saved and `pnpm typecheck` + `pnpm test` pass:

**Commit** (only if files were changed during the audit):
```
git add docs/designs/<feature-slug>.md <any files fixed during audit>
git commit -m "sre(<feature-slug>): production-readiness audit"
```

**Pause — ask the user:**

"**Phase 3 SRE audit voltooid** en gecommit.

SRE bevindingen gedocumenteerd in `docs/designs/<feature-slug>.md`.

Doorgaan naar **Phase 4: PR Gate**? (ja/nee)"

Wait for the answer.
- If "ja": proceed to Phase 4.
- If "nee": output "Gestopt na Phase 3. Hervat later met `/pr-gate <feature-slug>` of `/develop <feature-slug>`." Stop.

---

## PHASE 4 — PR GATE

Read the file `.claude/commands/pr-gate.md` in full. Execute every instruction in that file exactly as written, using `<feature-slug>` as the value for $ARGUMENTS.

Do not summarize or abbreviate. Run all gates, fix all BLOCKERs, update project memory, create the PR, and monitor CI until all checks are green.

---

## Done

After Phase 4 completes successfully:

"**Develop workflow voltooid** voor `<feature-slug>`.

PR: <url>
Branch: `feature/<feature-slug>`
Alle CI checks: geslaagd.

De feature staat klaar voor code review."
