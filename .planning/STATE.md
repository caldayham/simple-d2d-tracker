# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.
**Current focus:** Phase 3 — Route Data & Area Selection (v1.1 Planned Routes)

## Current Position

Phase: 3 of 5 (Route Data & Area Selection)
Plan: Ready to plan
Status: Ready to plan
Last activity: 2026-03-18 — Roadmap created for v1.1 milestone

Progress: [██████░░░░] 58% (v1.0 complete, v1.1 not started)

## Performance Metrics

**Velocity:**
- Total plans completed: 7 (v1.0)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Recording Pipeline | 4 | — | — |
| 2. Desktop Dashboard | 3 | — | — |

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- Nominatim address quality for Palo Alto residential streets is unverified — test early; Geoapify (3,000 free req/day) is ready fallback
- Address auto-population within drawn polygons requires a geocoding/address API that returns individual house addresses — needs research
- Supabase free tier (1GB storage) will not survive sustained canvassing — plan Pro upgrade ($25/mo) before first canvassing week

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Add gender, age range, name, and occupancy fields to knocks | 2026-03-19 | 6c2eef7 | [1-add-gender-and-age-range-fields-to-knock](./quick/1-add-gender-and-age-range-fields-to-knock/) |

## Session Continuity

Last session: 2026-03-18
Stopped at: Roadmap created for v1.1 — ready to plan Phase 3
Resume file: None
