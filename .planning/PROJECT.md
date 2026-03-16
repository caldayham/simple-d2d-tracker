# Canvassing Companion

## What This Is

A door-to-door canvassing companion app for a Palo Alto carpentry/handyman business. Mobile interface for recording audio conversations and auto-capturing house locations during canvassing sessions. Desktop dashboard for reviewing conversations, seeing visited houses on a map, and optionally processing audio (transcription, data extraction). Built as a Next.js web app with Supabase backend.

## Core Value

One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Start/stop canvassing sessions that group house visits
- [ ] One-tap audio recording with automatic GPS location capture
- [ ] Auto-associate recordings with nearest house address (reverse geocoding)
- [ ] Upload audio files to cloud storage (Supabase Storage)
- [ ] Mobile-optimized UI for in-field use on iPhone
- [ ] Desktop dashboard with map view (pins for visited houses)
- [ ] Desktop dashboard with list view (chronological, toggle with map)
- [ ] Click any house to see details and play back audio
- [ ] On-demand audio transcription from dashboard
- [ ] Single user, no auth complexity needed (simple login)

### Out of Scope

- Multi-user / team features — just one user for now
- Automated data extraction (name, notes, follow-up) — future enhancement, manual for now
- Route optimization or suggested walking paths
- CRM features (pipeline stages, deal tracking)
- Native iOS app — using mobile web (PWA if possible)
- Real-time transcription during recording
- AI conversation analysis / pattern detection — future, after audio corpus is built

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
*Last updated: 2026-03-16 after initialization*
