---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Planned Routes
status: defining_requirements
last_updated: "2026-03-18"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.
**Current focus:** Defining requirements for v1.1 — Planned Routes

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-18 — Milestone v1.1 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Visits query uses inner join on sessions to scope by user_id since visits table lacks user_id column
- DashboardMap loaded via next/dynamic with ssr:false to prevent Leaflet SSR issues
- Audio goes client-to-Supabase-Storage directly via signed URLs — never through Next.js server body (1MB limit)
- Reverse geocoding is non-blocking: coordinates saved immediately, address resolves async via Nominatim
- [Phase 02]: Used CartoDB dark_all tiles and 0.00005-degree rectangle offset for house-sized markers
- [Phase 02]: Audio URLs fetched on demand (not pre-loaded) to minimize Supabase signed URL generation
- [Phase 02]: Native HTML audio element used over custom player for reliability and accessibility

### Pending Todos

None yet.

### Blockers/Concerns

- Nominatim address quality for Palo Alto residential streets is unverified — test early; Geoapify (3,000 free req/day) is ready fallback
- Wake Lock API behavior in Safari PWA context has edge cases when app is backgrounded (not screen-locked)
- Supabase free tier (1GB storage) will not survive sustained canvassing — plan Pro upgrade ($25/mo) before first canvassing week
- Address auto-population within drawn polygons requires a geocoding/address API that returns individual house addresses — needs research

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Add gender, age range, name, and occupancy fields to knocks | 2026-03-19 | 6c2eef7 | [1-add-gender-and-age-range-fields-to-knock](./quick/1-add-gender-and-age-range-fields-to-knock/) |

## Session Continuity

Last session: 2026-03-18
Stopped at: Starting milestone v1.1 — Planned Routes
Resume file: None
