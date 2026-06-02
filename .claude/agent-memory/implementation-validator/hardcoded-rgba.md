---
name: hardcoded-rgba
description: Hardcoded rgba() values for badge backgrounds and row highlights are a recurring design-system violation in wizard/table components
metadata:
  type: feedback
---

Wizard components (e.g. `TeamsImportWizard.tsx`, `teams/page.tsx`) frequently use hardcoded `rgba()` values for:
- Row background tints (new/conflict/invalid status colors)
- Badge backgrounds
- Border colors for error containers

These should use CSS custom properties from `globals.css` (e.g. `var(--color-success-tint)`, `var(--color-warning-tint)`, `var(--color-error-tint)`) instead.

**Why:** The design system mandates CSS custom properties for all color usage. Hardcoded hex/rgba values break theming and are a PR-gate blocker per the design system tokens memory.
**How to apply:** Flag any `rgba(...)` or `#xxxxxx` in component style objects as an Important finding during validation. Check wizard step components especially — they tend to introduce these for status-color rows.
