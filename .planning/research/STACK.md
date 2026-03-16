# Stack Research

**Domain:** Mobile field recording app with location tracking and desktop review dashboard
**Researched:** 2026-03-16
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (stable) | Full-stack framework | Owner's comfort zone. App Router with React 19. Version 16 exists but 15.x is battle-tested and has wider ecosystem compatibility. Use App Router exclusively. |
| React | 19.x | UI library | Ships with Next.js 15. Server Components for dashboard, Client Components for recording UI. |
| TypeScript | 5.x | Type safety | Non-negotiable for any production app. Next.js has first-class TS support. |
| @supabase/supabase-js | ^2.99 | Supabase client | Isomorphic client for database, storage, and auth. Latest v2 series. |
| @supabase/ssr | latest | Server-side Supabase | Required for App Router. Creates server/client Supabase instances with cookie-based sessions. Replaces deprecated auth-helpers. |
| Tailwind CSS | 4.x | Styling | Ships with Next.js scaffolding. Utility-first is ideal for rapid prototyping a single-developer project. |

### Database & Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase PostgreSQL | - | Primary database | Sessions, visits, addresses, transcriptions. Row Level Security for simple auth. Free tier: 500MB database. |
| Supabase Storage | - | Audio file storage | Direct upload from client via signed URLs. Free tier: 1GB storage, 50MB max file size. Audio files at ~128kbps AAC are roughly 1MB/min, so 1GB holds ~16 hours of recordings before needing Pro ($25/mo for 100GB). |

### Map & Location

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Leaflet | ^1.9 | Map rendering | Free, open-source, no API key needed. Sufficient for pin-based dashboard maps. Use with OpenStreetMap tiles (free, no account required). |
| react-leaflet | ^4.2 | React wrapper for Leaflet | Thin React abstraction over Leaflet. Must use `next/dynamic` with `ssr: false` because Leaflet requires `window`. |
| Browser Geolocation API | Web standard | GPS capture | Built into all browsers. Use `getCurrentPosition()` with `enableHighAccuracy: true`. No library needed. |
| Nominatim API | Public API | Reverse geocoding | Free, no API key. Converts lat/lng to street address. Rate limit: 1 request/second (fine for door-to-door pace). Must set User-Agent header per usage policy. |

### Audio Recording

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| MediaRecorder API | Web standard | Audio capture | Built into iPhone Safari 14.5+. No library needed. Use `MediaRecorder.isTypeSupported()` to detect format (Safari prefers AAC/MP4, Chrome prefers WebM/Opus). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.x | Date formatting | Session timestamps, visit display. Lightweight, tree-shakeable. |
| lucide-react | latest | Icons | Clean icon set, works well with Tailwind. |
| sonner | latest | Toast notifications | Recording status, upload confirmations. Lightweight toast library. |

### Future / On-Demand (Not in MVP)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| OpenAI Whisper API | - | Audio transcription | On-demand from dashboard. $0.006/min ($0.36/hour). Call via Supabase Edge Function to keep API key server-side. NOT needed for MVP launch. |
| GPT-4o Mini Transcribe | - | Budget transcription | $0.003/min alternative. Half the cost of Whisper, good accuracy. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Dev server bundler | Ships with Next.js 15. Use `next dev --turbopack` for fast HMR. |
| Supabase CLI | Local development | `supabase init` + `supabase start` for local Postgres + Storage. Essential for testing RLS policies. |
| Supabase Dashboard | Database management | Web UI for schema, storage buckets, RLS policies. |

## Installation

```bash
# Scaffold
npx create-next-app@latest canvassing-companion --typescript --tailwind --eslint --app --src-dir

# Core Supabase
npm install @supabase/supabase-js @supabase/ssr

# Map
npm install leaflet react-leaflet
npm install -D @types/leaflet

# UI utilities
npm install date-fns lucide-react sonner

# Dev tools
npm install -D supabase
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Leaflet + OpenStreetMap | Mapbox GL JS + react-map-gl | If you need 3D maps, custom vector styling, or terrain. Mapbox free tier is 50K map loads/month which is generous, but requires API key signup and has proprietary license since v2. Overkill for pin markers on a dashboard. |
| Leaflet + OpenStreetMap | MapLibre GL JS | If you need vector tiles and WebGL rendering without Mapbox licensing. Open-source fork of Mapbox GL v1. More complex setup than Leaflet for simple use cases. |
| Nominatim (public) | Google Geocoding API | If Nominatim address quality is poor for Palo Alto area. Google gives 10K requests/month free but has restrictive storage terms (can't permanently store results unless displayed on Google Maps). Test Nominatim first. |
| Nominatim (public) | Geoapify Geocoding | If you need higher rate limits than Nominatim's 1/sec. Free tier: 3,000 requests/day. Good middle ground. |
| Browser MediaRecorder | RecordRTC library | If you hit cross-browser edge cases with raw MediaRecorder. RecordRTC wraps MediaRecorder with fallbacks. Try native first -- it works on modern Safari. |
| OpenAI Whisper API | Deepgram API | If you want real-time streaming transcription later. Deepgram has a generous free tier ($200 credit). But for on-demand batch transcription, Whisper API is simpler. |
| Supabase Storage | Cloudflare R2 | If you exceed Supabase free tier and want cheaper bulk storage. R2 has no egress fees. But adds infrastructure complexity -- stick with Supabase until cost forces a move. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Google Maps JavaScript API | Requires billing account, restrictive ToS, overkill for pin markers | Leaflet + OpenStreetMap (free, open) |
| next-pwa (shadowwalker) | Unmaintained since 2022, incompatible with App Router | Manual service worker or @ducanh09/next-pwa fork if PWA needed |
| @supabase/auth-helpers-nextjs | Deprecated. Supabase themselves say to migrate to @supabase/ssr | @supabase/ssr |
| Native iOS app (React Native, Swift) | Owner wants web stack, single codebase for mobile + desktop | Next.js responsive web app |
| Web Audio API for recording | Lower-level than MediaRecorder, more code for same result | MediaRecorder API (higher-level, sufficient) |
| Prisma / Drizzle ORM | Adds complexity layer over Supabase client which already handles queries. Single-developer project doesn't need ORM abstraction | @supabase/supabase-js direct queries |
| NextAuth / Auth.js | Supabase Auth is built-in, simpler for single-user. No need for a separate auth library | Supabase Auth (email/password, simple) |

## Stack Patterns by Variant

**If audio files exceed 50MB (recordings longer than ~50 minutes):**
- Use TUS resumable uploads via Supabase Storage (supported on Pro plan)
- Or split recordings into chunks client-side before upload
- Free tier caps individual files at 50MB

**If Nominatim address quality is insufficient for Palo Alto suburbs:**
- Switch to Geoapify reverse geocoding (3,000 free requests/day, better data in some US areas)
- Or use Google Geocoding API with the understanding that stored results must display on Google Maps

**If offline recording is needed (no cell signal while canvassing):**
- Store audio in IndexedDB via browser
- Queue uploads for when connectivity returns
- This is a Phase 2 enhancement, not MVP

**If transcription volume grows beyond occasional use:**
- Move from per-call OpenAI API to Supabase Edge Function with Whisper
- Or consider Deepgram for volume pricing

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15.x | React 19, Node.js 20+ | Requires Node.js 20+. Don't use Node 18. |
| @supabase/supabase-js ^2.79+ | Node.js 20+ | Dropped Node 18 support in v2.79.0 |
| react-leaflet ^4.2 | Leaflet ^1.9, React 18/19 | Must dynamically import with `ssr: false` in Next.js |
| @supabase/ssr | @supabase/supabase-js ^2.x | Requires middleware.ts for auth token refresh |

## Key Constraints & Budget Notes

| Resource | Free Tier Limit | Implication |
|----------|-----------------|-------------|
| Supabase Storage | 1GB files, 50MB per file | ~16 hours of AAC audio at 128kbps. Sufficient for weeks of canvassing before upgrade. |
| Supabase Database | 500MB | More than enough for metadata (sessions, visits, addresses). |
| Supabase Bandwidth | 5GB/month | Playback of audio files counts. ~80 hours of audio streaming before limit. |
| Nominatim | 1 req/sec, ~2,500/day | At door-to-door pace (1 house per 2-5 min), this is unlimited in practice. |
| OpenStreetMap Tiles | Fair use policy | No hard limit for reasonable usage. Dashboard map loads are fine. |
| OpenAI Whisper | $0.006/min (no free tier) | A 5-minute conversation costs $0.03. 100 transcriptions = ~$1.50. Negligible. |

## Sources

- [MediaRecorder API Safari support](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription) -- iPhone Safari MediaRecorder compatibility (MEDIUM confidence)
- [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) -- Web standard reference (HIGH confidence)
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API) -- Browser geolocation reference (HIGH confidence)
- [Supabase Storage docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads) -- Upload methods and limits (HIGH confidence)
- [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Next.js App Router setup (HIGH confidence)
- [Supabase pricing](https://supabase.com/pricing) -- Free tier limits (HIGH confidence)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) -- Rate limits and requirements (HIGH confidence)
- [Nominatim reverse geocoding](https://nominatim.org/release-docs/latest/api/Reverse/) -- API reference (HIGH confidence)
- [react-leaflet on Next.js 15](https://xxlsteve.net/blog/react-leaflet-on-next-15/) -- Dynamic import pattern (MEDIUM confidence)
- [Mapbox GL JS pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/) -- 50K free loads/month (HIGH confidence)
- [OpenAI Whisper API pricing](https://brasstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed) -- $0.006/min (MEDIUM confidence)
- [Next.js 15 release](https://nextjs.org/blog/next-15) -- Version details (HIGH confidence)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- Official PWA documentation (HIGH confidence)

---
*Stack research for: Canvassing Companion (field recording + location tracking + review dashboard)*
*Researched: 2026-03-16*
