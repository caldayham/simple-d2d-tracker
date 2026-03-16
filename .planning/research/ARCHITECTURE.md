# Architecture Research

**Domain:** Mobile field recording app with cloud sync and desktop dashboard
**Researched:** 2026-03-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │   Mobile UI (iPhone) │    │   Desktop Dashboard UI       │   │
│  │                      │    │                              │   │
│  │  - Session controls  │    │  - Map view (Leaflet)        │   │
│  │  - Record button     │    │  - List view (chronological) │   │
│  │  - GPS indicator     │    │  - Audio playback            │   │
│  │  - Visit list        │    │  - Transcription trigger     │   │
│  └──────────┬───────────┘    └──────────────┬───────────────┘   │
│             │                               │                   │
├─────────────┴───────────────────────────────┴───────────────────┤
│                     BROWSER API LAYER                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ MediaRecorder │  │ Geolocation  │  │ Audio Element /      │   │
│  │ API          │  │ API          │  │ Web Audio API        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘   │
│         │                 │                                     │
├─────────┴─────────────────┴─────────────────────────────────────┤
│                     SERVICE LAYER (Next.js)                     │
│                                                                 │
│  ┌───────────────────┐  ┌────────────────┐  ┌───────────────┐   │
│  │ Server Actions    │  │ API Routes     │  │ App Router     │   │
│  │ - Signed URL gen  │  │ - Transcribe   │  │ - Pages/layout │   │
│  │ - Visit creation  │  │   (future)     │  │ - SSR queries  │   │
│  │ - Session mgmt    │  │                │  │                │   │
│  └────────┬──────────┘  └───────┬────────┘  └───────┬────────┘   │
│           │                     │                   │            │
├───────────┴─────────────────────┴───────────────────┴────────────┤
│                     DATA LAYER (Supabase)                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL   │  │   Storage    │  │   Auth (simple)      │   │
│  │  - sessions   │  │   - audio/   │  │   - single user      │   │
│  │  - visits     │  │     bucket   │  │   - email login      │   │
│  │  - addresses  │  │              │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     EXTERNAL SERVICES                           │
│                                                                 │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ Nominatim (OSM)      │  │ OpenStreetMap Tiles            │   │
│  │ - Reverse geocoding  │  │ - Map rendering (via Leaflet)  │   │
│  │ - 1 req/sec limit    │  │ - Free, attribution required   │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Mobile Recording UI | Audio capture, GPS capture, session management | Next.js client components with `"use client"` |
| Desktop Dashboard | Map display, list browsing, audio playback, transcription | Next.js server + client components, Leaflet map |
| MediaRecorder Hook | Wraps browser MediaRecorder API, handles format detection | Custom React hook (`useAudioRecorder`) |
| Geolocation Hook | Wraps navigator.geolocation, manages permissions | Custom React hook (`useGeolocation`) |
| Reverse Geocoder | Converts lat/lng to street address | Server action calling Nominatim API |
| Upload Service | Gets signed URL from server, uploads audio blob to Storage | Server action (signed URL) + client upload |
| Supabase Database | Sessions, visits, addresses | PostgreSQL via Supabase client |
| Supabase Storage | Audio file persistence | Private bucket with signed URL access |
| Supabase Auth | Single-user authentication | Email/password, minimal config |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout, Supabase provider
│   ├── page.tsx                # Landing / redirect logic
│   ├── login/
│   │   └── page.tsx            # Simple email login
│   ├── record/                 # Mobile recording interface
│   │   ├── page.tsx            # Session + recording UI
│   │   └── layout.tsx          # Mobile-optimized layout
│   └── dashboard/              # Desktop dashboard
│       ├── page.tsx            # Map + list dual view
│       ├── layout.tsx          # Desktop-optimized layout
│       └── [visitId]/
│           └── page.tsx        # Visit detail + audio player
├── components/
│   ├── recording/
│   │   ├── RecordButton.tsx    # One-tap record toggle
│   │   ├── SessionControls.tsx # Start/stop session
│   │   └── VisitCard.tsx       # Current visit info display
│   ├── dashboard/
│   │   ├── MapView.tsx         # Leaflet map with visit pins
│   │   ├── ListView.tsx        # Chronological visit list
│   │   ├── VisitDetail.tsx     # Detail panel with audio
│   │   └── AudioPlayer.tsx     # Playback component
│   └── shared/
│       ├── GpsIndicator.tsx    # GPS status/accuracy display
│       └── SessionBadge.tsx    # Active session indicator
├── hooks/
│   ├── useAudioRecorder.ts     # MediaRecorder wrapper
│   ├── useGeolocation.ts       # Geolocation API wrapper
│   └── useSupabase.ts          # Supabase client singleton
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── middleware.ts       # Auth middleware
│   ├── geocoding.ts            # Nominatim reverse geocoding
│   ├── audio.ts                # Audio format detection, upload
│   └── types.ts                # Shared TypeScript types
├── actions/
│   ├── sessions.ts             # Server actions: create/end session
│   ├── visits.ts               # Server actions: create visit, attach audio
│   └── storage.ts              # Server actions: signed upload URLs
└── middleware.ts                # Auth redirect middleware
```

### Structure Rationale

- **`app/record/` and `app/dashboard/`:** Separate route groups because they serve fundamentally different devices and layouts. Mobile recording UI is minimal and touch-optimized; desktop dashboard is information-dense with map rendering.
- **`hooks/`:** Browser API wrappers (MediaRecorder, Geolocation) isolated as hooks so recording logic is testable and reusable without coupling to UI components.
- **`actions/`:** Server actions for all mutations. Keeps secrets server-side (Supabase service role key for signed URLs), enforces auth, and avoids exposing write operations to the client.
- **`lib/`:** Pure utility code with no React dependencies. Supabase clients, geocoding calls, audio format helpers.

## Architectural Patterns

### Pattern 1: Signed URL Upload for Audio Files

**What:** Client records audio, requests a signed upload URL from a server action, then uploads directly to Supabase Storage from the browser. The server never handles the audio blob.
**When to use:** Always for audio uploads. Audio files can be 5-50MB per recording; routing them through a Next.js server action would hit the 1MB default body size limit and waste server resources.
**Trade-offs:** Slightly more complex than direct upload, but avoids server body size limits and keeps the server stateless.

**Example:**
```typescript
// actions/storage.ts (server action)
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createSignedUploadUrl(fileName: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUploadUrl(`recordings/${fileName}`)
  if (error) throw error
  return data
}

// hooks/useAudioRecorder.ts (client)
import { createSignedUploadUrl } from '@/actions/storage'

async function uploadRecording(blob: Blob, visitId: string) {
  const fileName = `${visitId}-${Date.now()}.webm`
  const { signedUrl, token } = await createSignedUploadUrl(fileName)
  await supabase.storage
    .from('audio')
    .uploadToSignedUrl(`recordings/${fileName}`, token, blob)
  return fileName
}
```

### Pattern 2: Record-then-Geocode (Not Real-Time)

**What:** Capture GPS coordinates at recording start via `navigator.geolocation.getCurrentPosition()`. After recording stops, resolve the address via Nominatim in a server action. Store coordinates immediately; address resolution is non-blocking.
**When to use:** Every visit creation. Reverse geocoding is a network call to an external API with rate limits (Nominatim: 1 req/sec). It must not block the recording flow.
**Trade-offs:** Address might appear a few seconds after recording ends. Acceptable UX for this use case -- the user sees coordinates first, then the resolved address fills in.

**Example:**
```typescript
// hooks/useGeolocation.ts
export function useGeolocation() {
  const getPosition = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,  // Cache for 30s (walking between houses)
      })
    })
  }, [])
  return { getPosition }
}

// actions/visits.ts (server action)
'use server'
export async function resolveAddress(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'User-Agent': 'CanvassingCompanion/1.0' } }
  )
  const data = await res.json()
  return data.display_name
}
```

### Pattern 3: MediaRecorder Format Detection

**What:** iPhone Safari supports different audio codecs than Chrome/Firefox. Use `MediaRecorder.isTypeSupported()` to detect the best available format at runtime, then store the MIME type alongside the audio file for correct playback later.
**When to use:** At recording initialization. Critical because the dashboard needs to know the MIME type to play audio back correctly.
**Trade-offs:** Must store MIME type in the database per recording. Minor overhead, prevents playback failures.

**Example:**
```typescript
// lib/audio.ts
export function getBestAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',   // Chrome, Firefox, modern Safari
    'audio/mp4;codecs=aac',     // Safari fallback
    'audio/mp4',                // Safari further fallback
    'audio/webm',               // Generic webm
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''  // Let browser choose default
}
```

## Data Flow

### Recording Flow (Mobile)

```
[User taps "Start Session"]
    │
    ▼
[Session created in Supabase DB] ──→ session_id stored in state
    │
[User taps "Record" at a door]
    │
    ├──→ [navigator.geolocation.getCurrentPosition()] ──→ lat/lng captured
    │
    ├──→ [MediaRecorder.start()] ──→ audio chunks accumulate in memory
    │
    ▼
[User taps "Stop"]
    │
    ├──→ [MediaRecorder.stop()] ──→ Blob created from chunks
    │
    ├──→ [Server Action: create visit] ──→ visit row in DB (session_id, lat, lng)
    │
    ├──→ [Server Action: signed URL] ──→ upload token returned
    │
    ├──→ [Client: upload blob to Storage] ──→ audio file stored
    │
    ├──→ [Server Action: update visit] ──→ audio_path saved to visit row
    │
    └──→ [Server Action: reverse geocode] ──→ address saved to visit row
              (async, non-blocking)
```

### Dashboard Flow (Desktop)

```
[User opens /dashboard]
    │
    ▼
[Server: fetch all sessions + visits from Supabase]
    │
    ├──→ [MapView] ──→ Leaflet renders pins for each visit
    │                    (lat/lng from visit rows)
    │
    └──→ [ListView] ──→ Chronological cards with address + session grouping
    │
[User clicks a visit]
    │
    ▼
[Server Action: create signed download URL for audio]
    │
    ▼
[AudioPlayer] ──→ plays audio from signed URL
    │
[User clicks "Transcribe"] (future)
    │
    ▼
[API Route: send audio to transcription service] ──→ text saved to visit row
```

### Key Data Flows

1. **Audio capture-to-cloud:** MediaRecorder blob -> signed URL from server action -> direct client upload to Supabase Storage -> file path stored in visits table. Audio never transits the Next.js server.

2. **Location capture-to-address:** Browser Geolocation API -> coordinates stored immediately in visits table -> server action calls Nominatim -> resolved address written back to visits table asynchronously.

3. **Dashboard data loading:** Server component fetches sessions + visits via Supabase server client -> passes to client components for map rendering and list display. Audio playback uses signed download URLs generated on demand.

## Database Schema

```sql
-- Sessions: group visits from a canvassing outing
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT
);

-- Visits: individual door interactions
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,                          -- resolved via reverse geocoding
  audio_path TEXT,                       -- path in Supabase Storage
  audio_mime_type TEXT,                  -- for correct playback
  audio_duration_seconds INTEGER,        -- UI display
  transcript TEXT,                       -- filled on-demand later
  notes TEXT,                            -- manual notes
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies: single user, keep it simple
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "User owns visits via session"
  ON visits FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = auth.uid()
  ));
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (current) | Monolithic Next.js app, Supabase free tier, Nominatim public API. No optimization needed. |
| 5-10 users | Add user_id to visits table directly for faster queries. Consider caching Nominatim responses. Still Supabase free tier. |
| 100+ users | Self-host Nominatim or switch to paid geocoding (LocationIQ). Move to Supabase Pro for storage limits. Add database indexes on session_id, recorded_at. |

### Scaling Priorities

1. **First bottleneck: Supabase Storage (500MB free tier).** At ~5MB per recording, you get ~100 recordings before hitting limits. Monitor usage; upgrade to Pro ($25/mo) when approaching limits.
2. **Second bottleneck: Nominatim rate limit (1 req/sec).** Fine for one user recording one house at a time. If batch-processing or multiple users, queue geocoding requests or switch to a paid service.

## Anti-Patterns

### Anti-Pattern 1: Routing Audio Through the Server

**What people do:** Upload audio blob to a Next.js API route, then re-upload from server to Supabase Storage.
**Why it's wrong:** Next.js server actions have a 1MB default body size limit. Audio files are 5-50MB. Even with increased limits, this doubles bandwidth usage and adds latency.
**Do this instead:** Use signed upload URLs. Server generates the URL, client uploads directly to Storage.

### Anti-Pattern 2: Blocking on Reverse Geocoding

**What people do:** Wait for Nominatim response before confirming the recording was saved.
**Why it's wrong:** Nominatim is an external service with variable latency (200ms-2s). If it times out, the user thinks their recording failed. Rate limits (1 req/sec) compound the problem.
**Do this instead:** Save the visit with coordinates immediately. Resolve the address asynchronously and update the record. Show coordinates in the UI with a "resolving address..." indicator.

### Anti-Pattern 3: Storing Audio Format Assumptions

**What people do:** Assume all recordings are `.webm` or `.mp4` and hardcode the MIME type.
**Why it's wrong:** iPhone Safari produces different formats than Chrome. Hardcoding causes playback failures when recordings from one device are played on another.
**Do this instead:** Detect MIME type at recording time with `MediaRecorder.isTypeSupported()`, store it in the database, and pass it to the audio player.

### Anti-Pattern 4: Client-Side Supabase Writes Without Server Actions

**What people do:** Use the Supabase browser client with the anon key for all database writes.
**Why it's wrong:** Exposes mutation logic to the client, makes RLS policies the only security layer, and leaks business logic into components.
**Do this instead:** Use Next.js server actions for all mutations. The browser client is fine for reads (with RLS), but writes should go through server actions that validate input and use the server client.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Nominatim (OSM) | Server-side HTTP fetch in server action | 1 req/sec rate limit. Must set custom User-Agent header. Attribution required (link to OSM). |
| OpenStreetMap Tiles | Client-side via React Leaflet | Free, no API key. Attribution required. Loaded only on dashboard pages. |
| Supabase Auth | Middleware + server/client helpers | Use `@supabase/ssr` package for Next.js App Router integration. |
| Supabase Storage | Signed URLs for upload/download | Private bucket. Server generates signed URLs; client handles transfer. |
| Future: Transcription API | API route that fetches audio from Storage, sends to service | Keep as separate API route, not server action, for longer processing times. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile UI <-> Server Actions | Direct function calls (server actions) | All mutations go through actions/. No raw Supabase writes from client. |
| Dashboard <-> Database | Server components fetch, pass to client | Map and list get data from server; only interactive bits are client components. |
| Recording hooks <-> UI components | React hooks return state + callbacks | `useAudioRecorder` and `useGeolocation` are pure hooks, no UI. Components consume them. |
| Audio Storage <-> Database | File path reference only | Database stores the Storage path string. Never stores audio data in DB. |

## Build Order (Dependency Chain)

Understanding component dependencies informs which pieces to build first:

```
1. Supabase setup (DB schema + Storage bucket + Auth)
   │
   ├──→ 2a. Geolocation hook (useGeolocation)     [no dependencies]
   ├──→ 2b. Audio recorder hook (useAudioRecorder) [no dependencies]
   │
   ├──→ 3. Server actions (sessions, visits, storage signed URLs)
   │        [depends on: Supabase setup]
   │
   ├──→ 4. Mobile recording UI
   │        [depends on: hooks + server actions]
   │
   ├──→ 5. Reverse geocoding integration
   │        [depends on: server actions + visits table]
   │
   └──→ 6. Desktop dashboard (map + list + audio playback)
            [depends on: data existing from recording flow]
            │
            └──→ 7. Transcription (future)
                     [depends on: audio in Storage + dashboard UI]
```

**Rationale:** The recording flow must work end-to-end before the dashboard matters. There is no dashboard value without recorded data. Build the capture pipeline first, then the review interface.

## Sources

- [Supabase Storage signed upload URLs](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) - Official docs (HIGH confidence)
- [Supabase Storage resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) - Official docs (HIGH confidence)
- [MediaRecorder API on WebKit/Safari](https://webkit.org/blog/11353/mediarecorder-api/) - WebKit blog (HIGH confidence)
- [MediaRecorder iPhone Safari implementation guide](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription) - Community source, verified against MDN (MEDIUM confidence)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) - Official reference (HIGH confidence)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) - Official OSM Foundation (HIGH confidence)
- [BigDataCloud free reverse geocoding](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) - Alternative geocoding option (MEDIUM confidence)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official Next.js docs (HIGH confidence)
- [React Leaflet vs Mapbox comparison](https://medium.com/visarsoft-blog/leaflet-or-mapbox-choosing-the-right-tool-for-interactive-maps-53dea7cc3c40) - Community analysis (MEDIUM confidence)
- [Supabase + Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - Official docs (HIGH confidence)

---
*Architecture research for: Canvassing Companion (mobile field recording with cloud sync and desktop dashboard)*
*Researched: 2026-03-16*
