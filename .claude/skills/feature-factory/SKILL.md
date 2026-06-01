---
name: feature-factory
description: >
  Orchestrates a full feature build from idea to PR-ready code using the
  seven specialist subagents: codebase-researcher, story-writer, spec-writer,
  backend-builder, frontend-builder, test-verifier, and implementation-validator.
  Trigger with phrases like "build a feature", "ship a feature",
  "feature factory", or "run the full chain".
---

You are running the feature-factory chain. Orchestrate the seven specialist
subagents in the order below. Accumulate each agent's output and pass it
forward to every subsequent agent that needs it. Never skip a step.

---

## Inputs you need before starting

Ask the user for these if they have not been provided:
- A feature description (one sentence is enough to start)
- The area of the codebase it affects (optional — codebase-researcher will
  discover this, but a hint speeds things up)

---

## Step 1 — codebase-researcher

Invoke the `codebase-researcher` agent with:
- The feature description
- A request to map all relevant files, tables, types, hooks, components,
  edge functions, and scenario docs for this feature area

Save the full output as **researcher-findings**. Pass it to every
subsequent agent that takes it as input.

---

## Step 2 — story-writer

Invoke the `story-writer` agent with:
- The feature description
- researcher-findings in full

Save the output as **draft-story**.

---

## Step 3 — Human approval: story

Present **draft-story** to the user in full, then ask:

> "Story ready. Do you approve this story, want changes, or want to stop?"

Handle the three outcomes:

**Approved** → save as **approved-story** and continue to Step 4.

**Changes requested** → re-invoke `story-writer` with:
- The original feature description
- researcher-findings
- The current draft story
- The user's exact feedback

Present the revised story and repeat this approval step. Keep iterating
until the user approves or rejects. State the revision number each round
("Revision 2 of the story — does this work?").

**Rejected** → stop the chain entirely. Report:
- What was explored (researcher-findings summary)
- What was attempted (story drafts and rejection reasons)
- A suggestion for what the user could do next

Do not proceed further after rejection.

---

## Step 4 — spec-writer

Invoke the `spec-writer` agent with:
- approved-story in full
- researcher-findings in full

Ask the spec-writer to produce a technical brief covering: data model
changes, API contract, migration and RLS requirements, edge function
changes, frontend changes, and acceptance criteria mapped 1:1 to the story.

Save the output as **draft-brief**.

---

## Step 5 — Human approval: technical brief

Present **draft-brief** to the user in full, then ask:

> "Technical brief ready. Do you approve, want changes, or want to stop?"

Handle the three outcomes:

**Approved** → save as **approved-brief** and continue to Step 6.

**Changes requested** → re-invoke `spec-writer` with:
- approved-story
- researcher-findings
- The current draft brief
- The user's exact feedback

Present the revised brief and repeat this approval step until approved or
rejected.

**Rejected** → stop the chain. Report:
- The **approved-story** is preserved (tell the user explicitly)
- What technical approaches were tried and why each was rejected
- A note that the user can resume from Step 4 with a different approach
  without redoing the story

Do not proceed further after rejection.

---

## Step 6 — backend-builder

Invoke the `backend-builder` agent with:
- approved-story
- approved-brief
- researcher-findings

The agent implements backend code: migrations, RLS policies, edge functions,
API routes or Supabase queries, and unit tests.

Save the full output as **backend-summary**. The API contract section
(endpoints, request/response shapes, error codes) is the source of truth
for the frontend builder.

---

## Step 7 — frontend-builder

Invoke the `frontend-builder` agent with:
- approved-story
- approved-brief
- researcher-findings
- backend-summary (especially the API contract section)

The agent implements screens, components, hooks, and component tests.

Save the full output as **frontend-summary**.

---

## Step 8 — test-verifier

Invoke the `test-verifier` agent with:
- approved-story (every acceptance criterion must map to at least one test)
- approved-brief
- backend-summary
- frontend-summary

The agent writes acceptance tests for every criterion in the story.

Save the full output as **test-verifier-report**.

---

## Step 9 — implementation-validator

Invoke the `implementation-validator` agent with:
- approved-story
- approved-brief
- test-verifier-report

The agent produces a gap report grouped by severity: **critical**,
**important**, **minor**.

Save the output as **validator-report**.

---

## Step 10 — Handle critical and important findings

If the validator report contains **critical or important** findings:

1. Split findings by ownership: backend, frontend, or both.
2. **For backend findings:** re-invoke `backend-builder` with:
   - approved-story, approved-brief, researcher-findings
   - The specific critical/important findings that are backend-owned
3. **For frontend findings:** re-invoke `frontend-builder` with:
   - approved-story, approved-brief, researcher-findings, backend-summary
   - The specific critical/important findings that are frontend-owned
4. Update backend-summary and/or frontend-summary with the new outputs.
5. Re-invoke `test-verifier` with the updated summaries.
6. Re-invoke `implementation-validator` with the updated test-verifier report.
7. If critical or important findings remain, repeat this loop up to **two
   more times** (three attempts total). After three failed attempts, stop
   and escalate: present the remaining findings to the user and ask how to
   proceed before doing anything further.

Once no critical or important findings remain, continue to Step 11.

---

## Step 11 — Final human review before PR

Present a concise summary:

- **Feature implemented:** one-line description
- **Files changed:** list from backend-summary + frontend-summary
- **Tests written:** list from test-verifier-report
- **Validator findings:**
  - Critical: (count) — all resolved
  - Important: (count) — all resolved
  - Minor: (list remaining minor findings with file paths)

Then ask:

> "Implementation complete. Minor findings are listed above — some may be
> acceptable as-is. Do you want to open a PR, address any findings first,
> or review the code before deciding?"

Wait for the user's answer. Do not open a PR, push any branch, or run any
destructive command until the user explicitly instructs you to do so.
