# Project Research Summary

**Project:** Canvassing Companion (Simple Conversation Location Tracker)
**Domain:** Mobile field recording app with GPS location capture and desktop review dashboard
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

Canvassing Companion is a solo-operator field tool for door-to-door recording of doorstep conversations with automatic GPS location tagging. Unlike the crowded team-oriented canvassing SaaS market (SalesRabbit, Spotio, Knockio — all $25-99/user/month), this product targets radical simplicity: one-tap record, automatic location, zero forms. No competitor offers audio-first capture or on-demand transcription, making this a genuine differentiator in a space built around typed form entry. The recommended implementation is a Next.js 15 web app backed by Supabase for database, storage, and auth — the owner's comfort zone, with no new technology risk.

The architecture follows a clear two-surface pattern: a touch-optimized mobile recording interface used one-handed at doorsteps, and an information-dense desktop dashboard for session review. These are separate route groups in the same Next.js app, sharing a Supabase backend. Audio never transits the Next.js server — it goes directly from the browser to Supabase Storage via signed URLs, bypassing server body size limits. Location capture uses the Browser Geolocation API with accuracy gating via `watchPosition()`, and reverse geocoding resolves to street addresses asynchronously via Nominatim (free, no API key).

The most critical risks are iOS-specific and must be addressed in Phase 1, not retrofitted. Safari suspends background JavaScript when the screen locks, silently killing recordings mid-conversation. Safari also evicts all local storage after 7 days of non-use unless the app is installed as a PWA. Both risks require upfront architectural decisions (chunked recording with `timeslice`, Wake Lock API, eager upload queue, PWA manifest) that are expensive to add later. A second category of risk is the Supabase free tier — at 30 conversations/day averaging 3 minutes each, the 1GB storage limit is exhausted in under two weeks. Plan for Supabase Pro ($25/month) from launch or set audio bitrate low enough (32-64kbps Opus for voice) to extend the free tier meaningfully.

## Key Findings

### Recommended Stack

The stack is deliberately minimal and leverages free-tier services throughout. Next.js 15 with App Router and React 19 provides the full-stack framework. Supabase handles database (PostgreSQL with Row Level Security), file storage (private bucket, signed URLs), and auth (email/password, single user). Leaflet with OpenStreetMap tiles provides map rendering with zero API key requirements. All browser APIs — MediaRecorder, Geolocation, Wake Lock — are used natively without libraries. TypeScript throughout, Tailwind CSS 4.x for styling, `@supabase/ssr` (not the deprecated auth-helpers) for server-side session management.

**Core technologies:**
- Next.js 15.x (App Router): Full-stack framework — owner's comfort zone, handles both mobile and desktop surfaces in one codebase
- Supabase (PostgreSQL + Storage + Auth): Backend-as-a-service — free tier covers MVP; single SDK for all backend operations
- `@supabase/ssr`: Server-side Supabase for Next.js — required for App Router; replaces deprecated `@supabase/auth-helpers-nextjs`
- Leaflet + react-leaflet: Map rendering — free, no API key, sufficient for pin-based dashboard; must use `next/dynamic` with `ssr: false`
- Browser MediaRecorder API: Audio capture — built into iPhone Safari 14.5+; use `isTypeSupported()` for cross-browser format detection
- Browser Geolocation API: GPS capture — built-in; use `watchPosition()` with accuracy gating, not `getCurrentPosition()`
- Nominatim (OpenStreetMap): Reverse geocoding — free, no key; 1 req/sec rate limit (fine for door-to-door pace)
- OpenAI Whisper API ($0.006/min): On-demand transcription — deferred to v1.x; call via Supabase Edge Function to keep API key server-side

### Expected Features

Research compared against SalesRabbit, Spotio, Lead Scout, Knockio, Knockbase, and Ecanvasser. Audio-first capture and on-demand transcription are absent from all competitors — they are genuine differentiators, not table stakes.

**Must have (table stakes for v1):**
- One-tap audio recording with automatic GPS capture — core interaction loop; must start in under 2 seconds
- Reverse geocoding to street address — raw coordinates are meaningless to the user
- Audio upload to Supabase Storage — cloud persistence for cross-device access
- Session grouping (start/stop a canvassing run) — natural unit for reviewing a day's work
- Mobile-optimized recording UI — large tap targets, one-handed use at a doorstep
- Desktop map view with visit pins — Leaflet + OpenStreetMap tiles
- Desktop list view (chronological) — alternative to map for quick scanning
- House detail view with audio playback — click a pin to hear the conversation
- Simple email/password auth — single user, nothing more

**Should have (add after validating MVP, v1.x):**
- On-demand transcription via Whisper — convert audio to searchable text when needed; trigger: "I wish I could read this without replaying"
- Quick-tag status on houses (interested / not home / declined) — trigger: "I want to filter by outcome"
- Session filtering on map and list — trigger: "Show me just Tuesday's visits"
- Conversation full-text search — trigger: 20+ transcriptions make manual scanning slow

**Defer (v2+):**
- AI data extraction from transcriptions — needs 50+ conversations to understand what patterns matter
- Neighborhood analytics and heat maps — needs months of data
- Export to CRM or spreadsheet — no CRM exists yet; premature integration
- PWA offline-first with full background sync — Palo Alto has good coverage; validate mobile web first

### Architecture Approach

The system is split into four layers: Presentation (mobile recording UI + desktop dashboard, both in Next.js App Router), Browser API (MediaRecorder, Geolocation, Wake Lock), Service (Next.js server actions for all mutations, server components for dashboard data fetching), and Data (Supabase PostgreSQL for metadata, Supabase Storage for audio blobs). The two critical data flow decisions are: audio uploads go client-to-Storage directly via signed URLs (bypasses 1MB server body limit), and reverse geocoding is non-blocking — coordinates are saved immediately, address resolves asynchronously and updates the record. These are non-negotiable architectural constraints discovered in research; violating either causes hard failures.

**Major components:**
1. `useAudioRecorder` hook — wraps MediaRecorder API with format detection, chunked capture via `timeslice`, and Wake Lock; no UI coupling
2. `useGeolocation` hook — wraps `watchPosition()` with accuracy gating (wait for `coords.accuracy < 20m`); no UI coupling
3. Server actions (`actions/`) — all database mutations, signed URL generation, and reverse geocoding; keeps service role key server-side
4. Mobile recording UI (`app/record/`) — touch-optimized session controls and record button; consumes hooks + server actions
5. Desktop dashboard (`app/dashboard/`) — server component data fetch, Leaflet map (dynamic import, SSR false), list view, audio playback via signed download URLs
6. Supabase (DB + Storage + Auth) — `sessions` and `visits` tables with RLS policies; private `audio` bucket

**Database schema (two tables):**
- `sessions`: id, user_id, started_at, ended_at, notes
- `visits`: id, session_id, latitude, longitude, address, audio_path, audio_mime_type, audio_duration_seconds, transcript, notes, recorded_at

### Critical Pitfalls

1. **iOS Safari kills recording on screen lock** — Implement chunked recording with `MediaRecorder.timeslice` (every 10s), store chunks to IndexedDB as they arrive, use Wake Lock API (`navigator.wakeLock.request('screen')`) during active recording, and finalize on `visibilitychange`. This is Phase 1, not optional.

2. **Safari 7-day storage eviction deletes local audio** — Guide user through PWA Add-to-Home-Screen during onboarding (home screen PWAs are exempt from eviction). Treat IndexedDB as a temporary upload queue only; upload to Supabase Storage eagerly on connectivity. Never rely on local storage as permanent. This is Phase 1.

3. **MediaRecorder audio format mismatch breaks playback** — Safari produces `audio/mp4` (AAC) while Chrome produces `audio/webm;codecs=opus`. Use `MediaRecorder.isTypeSupported()` at recording time, store the detected MIME type in the `visits` table, and pass it to the audio element for playback. Hardcoding any MIME type causes silent failures.

4. **GPS accuracy returns the wrong house** — iPhone Safari often provides WiFi/cell-tower position with 50-100m accuracy, enough to point to the house across the street. Use `watchPosition()` and wait for `coords.accuracy < 20m` before associating coordinates with a visit. Display the resolved address on screen with a one-tap "wrong address, fix it" correction option.

5. **Supabase free tier storage exhausted in under two weeks** — At 30 conversations/day averaging 3 minutes at 128kbps, storage fills in ~11 days. Use Opus codec at 32-64kbps (excellent for speech) to extend 4-8x. Plan for Supabase Pro ($25/month) before launch or during first canvassing week. Bandwidth egress (5GB/month free) runs out even faster if the dashboard streams audio frequently.

## Implications for Roadmap

Based on the dependency chain in ARCHITECTURE.md and the phase-mapping in PITFALLS.md, all five critical pitfalls must be addressed in Phase 1. There is no safe shortcut: the recording pipeline must be production-ready before the dashboard has anything to display, and the data loss risks (screen lock, storage eviction) are unrecoverable.

### Phase 1: Foundation + Recording Pipeline

**Rationale:** The entire app is worthless without reliable audio capture. All five critical pitfalls are in this phase. Recording must work end-to-end on an actual iPhone before any dashboard work begins — there is no value in reviewing data that was never correctly captured. Architecture research explicitly states: "Build the capture pipeline first, then the review interface."
**Delivers:** A working mobile web app that records audio, captures GPS, uploads to cloud, and resolves addresses. A solo canvassing session can be captured reliably.
**Addresses:** Session start/stop, one-tap audio recording + GPS, reverse geocoding, audio upload, mobile recording UI, simple auth, PWA manifest + Add-to-Home-Screen onboarding
**Avoids:** iOS screen-lock kill (chunked recording + Wake Lock), Safari 7-day eviction (PWA install + eager upload), audio format mismatch (runtime MIME detection), GPS inaccuracy (watchPosition + accuracy gate), storage exhaustion (Opus compression + storage projection)

### Phase 2: Desktop Dashboard

**Rationale:** The dashboard has no value until recordings exist. Phase 1 must produce real data from at least 1-2 canvassing sessions before the dashboard is meaningful to build or validate. Dashboard complexity (Leaflet dynamic import, server-side data fetching, audio playback via signed URLs) is entirely independent of the recording pipeline.
**Delivers:** Desktop review interface: Leaflet map with visit pins, chronological list view, house detail page with audio playback.
**Uses:** Leaflet + react-leaflet (dynamic import, SSR false), Supabase server client, signed download URLs for audio playback
**Implements:** Dashboard architecture component (server component data fetch + client component map/list/detail split)
**Avoids:** Loading all audio into memory (stream via signed URLs), re-geocoding on display (use cached addresses from DB), map pins without clustering (add Leaflet.markercluster from the start)

### Phase 3: Enhanced Capture + Filtering

**Rationale:** After 2-3 canvassing sessions the owner will have feedback on what friction remains. Quick-tag status and session filtering are low-complexity additions that make the existing data more useful without changing the core capture flow.
**Delivers:** Quick-tag (interested/not home/declined) on house records, session filtering on map and list views, address correction UI ("wrong address, fix it").
**Addresses:** v1.x features from FEATURES.md: quick-tag, session filtering, address correction

### Phase 4: Transcription + Search

**Rationale:** On-demand transcription requires audio to exist in Supabase Storage (Phase 1) and the dashboard to exist for triggering it (Phase 2). Conversation search requires transcriptions to exist (Phase 4). Natural dependency chain means this cannot come earlier.
**Delivers:** On-demand transcription via Whisper API (triggered from house detail page), full-text search across transcribed conversations.
**Uses:** OpenAI Whisper API ($0.006/min) via Supabase Edge Function; Supabase full-text search on `transcript` column
**Implements:** API route for transcription (not a server action — longer processing time); transcript storage in `visits.transcript`

### Phase Ordering Rationale

- Phase 1 before Phase 2: No dashboard value without data; all unrecoverable data loss risks are in capture, not review
- Phase 3 after Phase 2: Filtering and tagging UX depends on seeing the dashboard first — the owner will know what to filter after using it
- Phase 4 last: Hard dependency chain — transcription requires audio in storage, search requires transcriptions; also cost management (don't build transcription billing before validating core loop)
- AI extraction / analytics deferred to v2: Needs data corpus that doesn't exist yet; building too early is waste

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (iOS PWA + Wake Lock):** Wake Lock API behavior in Safari PWA vs. browser context has community-reported edge cases. Needs hands-on testing on physical hardware before finalizing implementation.
- **Phase 1 (Nominatim accuracy, Palo Alto):** Nominatim data quality varies by region. Research notes uncertainty about Palo Alto residential address quality specifically. Verify early; fallback to Geoapify or Google Geocoding if quality is poor.
- **Phase 4 (Whisper API via Edge Function):** Edge Function setup for Supabase + streaming audio from Storage to Whisper API has limited prior art. May need spike/prototype.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Leaflet dashboard):** react-leaflet + Next.js dynamic import is a well-documented, solved pattern. Multiple tutorials and official docs cover it.
- **Phase 2 (Supabase server components):** Official Supabase + Next.js App Router quickstart covers this exact pattern.
- **Phase 3 (quick-tags + filtering):** Standard CRUD operations on existing schema, no new technology.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified against official docs. Version compatibility explicitly checked (Next.js 15, @supabase/ssr, react-leaflet ^4.2, Node.js 20+). Alternatives documented with clear tradeoff rationale. |
| Features | MEDIUM | Competitor analysis is solid; the novel audio-first approach means less prior art for validating feature assumptions. MVP scope is well-reasoned but untested against real canvassing usage. |
| Architecture | HIGH | Patterns are drawn from official Supabase and Next.js documentation. Signed URL upload pattern and server action boundaries are explicitly documented with code examples. |
| Pitfalls | HIGH | iOS Safari limitations are verified against official WebKit blog posts, MDN, and WebKit Storage Policy documentation. Supabase limits verified against official pricing docs. |

**Overall confidence:** HIGH

### Gaps to Address

- **Nominatim address quality for Palo Alto residential streets:** Cannot verify without testing in the actual deployment area. Plan to test in Phase 1 before building the full dashboard. Have Geoapify (3,000 free requests/day) as a ready fallback.
- **Wake Lock API behavior in Safari PWA context:** Community sources agree it works in Safari 16.4+, but behavior when the app is backgrounded (not screen-locked) has edge cases. Validate on actual hardware in Phase 1.
- **Supabase Pro upgrade timing:** The free tier will not survive sustained canvassing. The exact trigger point depends on actual recording lengths and frequency — build storage usage tracking into Phase 1 to monitor and upgrade before hitting limits.
- **Audio bitrate vs. Whisper transcription accuracy tradeoff:** Lowering bitrate to 32kbps Opus (recommended to extend free tier) may impact transcription accuracy. Validate Whisper output quality on compressed files before committing to the compression level in Phase 1.

## Sources

### Primary (HIGH confidence)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — MediaRecorder browser standard, format support
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API) — Browser geolocation reference
- [WebKit MediaRecorder Blog](https://webkit.org/blog/11353/mediarecorder-api/) — Official Safari MediaRecorder documentation
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) — Official 7-day eviction policy documentation
- [Supabase Storage docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads) — Upload methods and limits
- [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — Next.js App Router setup
- [Supabase pricing](https://supabase.com/pricing) — Free tier limits (1GB storage, 5GB bandwidth, 500MB database)
- [Supabase Storage signed upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) — Signed URL pattern
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) — Rate limits and User-Agent requirement
- [Next.js 15 release](https://nextjs.org/blog/next-15) — Version details and App Router

### Secondary (MEDIUM confidence)
- [iPhone Safari MediaRecorder guide](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription) — Practical format detection on iPhone
- [react-leaflet on Next.js 15](https://xxlsteve.net/blog/react-leaflet-on-next-15/) — Dynamic import pattern for App Router
- [PWA iOS Limitations guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — Comprehensive iOS PWA constraints
- [iPhone geolocation watchPosition accuracy](https://www.thedotproduct.org/posts/how-to-get-an-accurate-geo-location-from-apple-iphone-using-navigatorgeolocationwatchposition.html) — Accuracy gating pattern
- [OpenAI Whisper API pricing](https://brainstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed) — $0.006/min confirmed
- [Competitor analysis: SalesRabbit, Spotio, Lead Scout, Knockio, Knockbase, Ecanvasser](https://gitnux.org/best/sales-canvassing-software/) — Feature and pricing comparison

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
