# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.
**Current focus:** Phase 1 — Recording Pipeline

## Current Position

Phase: 1 of 2 (Recording Pipeline)
Plan: 0 of 4 in current phase
Status: Ready to plan
Last activity: 2026-03-16 — Roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All iOS pitfalls (Wake Lock, chunked recording, MIME detection, GPS accuracy gate, PWA eviction) must be resolved in Phase 1 — not retrofittable
- Audio goes client-to-Supabase-Storage directly via signed URLs — never through Next.js server body (1MB limit)
- Reverse geocoding is non-blocking: coordinates saved immediately, address resolves async via Nominatim
- Opus codec at 32-64kbps for voice — extends Supabase free tier 4-8x vs. default bitrate

### Pending Todos

None yet.

### Blockers/Concerns

- Nominatim address quality for Palo Alto residential streets is unverified — test early in Phase 1; Geoapify (3,000 free req/day) is ready fallback
- Wake Lock API behavior in Safari PWA context has edge cases when app is backgrounded (not screen-locked) — validate on physical hardware in Phase 1
- Supabase free tier (1GB storage) will not survive sustained canvassing — build storage usage tracking in Phase 1 and plan Pro upgrade ($25/mo) before first canvassing week

## Session Continuity

Last session: 2026-03-16
Stopped at: Roadmap created, REQUIREMENTS.md traceability updated. Ready to plan Phase 1.
Resume file: None
