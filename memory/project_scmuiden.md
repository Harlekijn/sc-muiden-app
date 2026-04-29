---
name: SC Muiden App Project
description: Mobile app and web CMS for SC Muiden football/hockey club in Muiden, Netherlands
type: project
---

SC Muiden is a local sports club (voetbal + hockey) in Muiden, Noord-Holland. The user is building a member-facing iOS/Android app with a web CMS for club administration.

**Why:** Club needs a single app for members/parents/volunteers to track training, matches, bar service, and club activities. Includes family profile concept so parents can see obligations for all their children in one view.

**Stack:** React Native + Expo (mobile), Next.js (CMS), Supabase (DB/auth/realtime), Expo Push Notifications, KNVB API (football), KNHB HockeyWeerelt API (hockey), pnpm monorepo + Turborepo.

**Key docs created 2026-04-29:**
- CLAUDE.md — project guide for Claude Code
- docs/TECH_STACK.md — full stack decisions and rationale
- docs/ROADMAP_V1.md — 7-phase, 26-week roadmap to launch

**How to apply:** All UI copy is Dutch. Design system in DESIGN-SYSTEM.md is the visual baseline. Family model: family members are sub-profiles under one account login. Federation data syncs via Supabase Edge Functions on a daily cron — app never calls KNVB/KNHB directly.
