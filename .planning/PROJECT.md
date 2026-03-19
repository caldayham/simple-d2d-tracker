# Canvassing Companion

## What This Is

A door-to-door canvassing companion app for a Palo Alto carpentry/handyman business. Mobile interface for recording audio conversations and auto-capturing house locations during canvassing sessions. Desktop dashboard for reviewing conversations, seeing visited houses on a map, and optionally processing audio (transcription, data extraction). Built as a Next.js web app with Supabase backend.

## Core Value

One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Start/stop canvassing sessions that group house visits — v1.0
- ✓ One-tap audio recording with automatic GPS location capture — v1.0
- ✓ Auto-associate recordings with nearest house address (reverse geocoding) — v1.0
- ✓ Upload audio files to cloud storage (Supabase Storage) — v1.0
- ✓ Mobile-optimized UI for in-field use on iPhone — v1.0
- ✓ Desktop dashboard with map view (pins for visited houses) — v1.0
- ✓ Desktop dashboard with list view (chronological, toggle with map) — v1.0
- ✓ Click any house to see details and play back audio — v1.0
- ✓ Single user, no auth complexity needed (simple login) — v1.0

### Active

<!-- Current scope: v1.1 — Planned Routes -->

- [ ] Planning tab on dashboard for creating planned routes
- [ ] Draw points/polygons on map to define canvassing areas
- [ ] Auto-populate house addresses within drawn area from geocoding API
- [ ] Auto-sort knocks into walking order (down one side, back the other)
- [ ] Manual reorder of planned knocks after auto-sort
- [ ] Planned route stats (door count, estimated time at 4min/door)
- [ ] Mobile: load and execute a planned route
- [ ] Mobile: guided knock-by-knock execution with current house display
- [ ] Mobile: mini map showing position and upcoming houses
- [ ] Mobile: progress indicator (doors done/remaining, elapsed time)
- [ ] Planned knocks stored in existing visits/knocks data model
- [ ] Unvisited planned knocks persist as markers until executed

### Out of Scope

- Multi-user / team features — just one user for now
- Automated data extraction (name, notes, follow-up) — deferred to v1.2+
- On-demand audio transcription — deferred to v1.2+
- CRM features (pipeline stages, deal tracking)
- Native iOS app — using mobile web (PWA if possible)
- Real-time transcription during recording
- AI conversation analysis / pattern detection — future, after audio corpus is built

## Current Milestone: v1.1 Planned Routes

**Goal:** Enable pre-planned canvassing runs — scout areas on a map, auto-generate house knock lists, and execute routes with guided mobile UI.

**Target features:**
- Planning tab with polygon/point drawing and address auto-population
- Smart route ordering with manual adjustment
- Guided mobile execution with mini map and progress tracking
- Route stats (door count, estimated time)

## Context

- Owner runs cf.design, a carpentry/handyman business in Palo Alto with his brother
- 50+ jobs completed, zero unsatisfied clients, 6 five-star Google reviews
- Original Nextdoor organic strategy lost effectiveness after a break
- Pivoting to door-to-door canvassing to leverage in-person strengths
- Owner is comfortable with Next.js and Supabase ecosystem
- Currently uses iPad for manual notes mid-conversation; iPhone will run this app
- Preserving original audio is critical — future AI models will extract more signal (tone, intonation, hard-to-transcribe words)
- Business context document at `BUSINESS-CONTEXT.md` in repo root

## Constraints

- **Tech stack**: Next.js + Supabase (owner's comfort zone)
- **Budget**: Near-zero — Supabase free tier, no paid APIs required for core functionality
- **Device**: Must work well on iPhone Safari (mobile web)
- **Audio storage**: Original audio files must be preserved in cloud, never discarded after processing
- **Privacy**: Audio recording only starts after verbal consent from the person at the door

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js web app over native iOS | Owner is comfortable with Next.js, faster to ship, works on both mobile and desktop | — Pending |
| Supabase for backend + storage | Owner's preferred infrastructure, free tier sufficient for early use | — Pending |
| Cloud-first audio storage | Accessible from any device, Supabase Storage handles it | — Pending |
| Session-based grouping | Natural unit for "a morning of canvassing" — groups visits together | — Pending |
| Single user, simple auth | Only one person using it, avoid unnecessary complexity | — Pending |
| Transcription on-demand, not automatic | Saves cost, preserves simplicity, user processes when they need to | — Pending |

---
*Last updated: 2026-03-18 after milestone v1.1 start*
