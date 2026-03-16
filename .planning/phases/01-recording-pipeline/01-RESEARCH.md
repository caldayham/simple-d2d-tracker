# Phase 1: Recording Pipeline - Research

**Researched:** 2026-03-16
**Domain:** Mobile audio recording + GPS capture on iPhone Safari, Supabase backend, PWA
**Confidence:** HIGH

## Summary

Phase 1 builds the entire recording pipeline: a Next.js 15 mobile web app that records audio with GPS location on iPhone Safari, uploads to Supabase Storage, and reverse-geocodes addresses via Nominatim. This phase contains ALL five critical iOS pitfalls identified in project research -- screen lock killing recordings, Safari 7-day storage eviction, audio format mismatch, GPS inaccuracy, and Supabase storage limits. Every one of these must be solved here; none can be deferred.

The technical approach is well-validated: Next.js 15 App Router with `@supabase/ssr` for auth, chunked MediaRecorder with `timeslice` for resilient recording (timeslice support confirmed fixed in Safari 14+, WebKit bug 202233), Wake Lock API for screen-on during recording (confirmed working in PWA context on iOS 18.4+, WebKit bug 254545), signed upload URLs to bypass the 1MB server action body limit, and non-blocking reverse geocoding via Nominatim. The PWA manifest uses Next.js built-in `app/manifest.ts` support -- no third-party PWA library needed.

The biggest runtime risk is Wake Lock in PWA context: it was broken in Home Screen Web Apps until iOS 18.4 (March 2025). The user's iPhone MUST be on iOS 18.4+ for Wake Lock to work in the installed PWA. If on an older iOS, the fallback is a prominent "keep screen on" warning during recording.

**Primary recommendation:** Build the four plans in strict dependency order -- scaffold first, then recording hooks, then UI, then upload pipeline. Test on a physical iPhone after each plan.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REC-01 | User can start a canvassing session with one tap | Server action creates session row in `sessions` table; session state managed in React state |
| REC-02 | User can stop/end a canvassing session | Server action updates `ended_at` on session row |
| REC-03 | User can start audio recording with one tap (auto-captures GPS) | `useAudioRecorder` hook starts MediaRecorder + `useGeolocation` hook captures position via `watchPosition()` |
| REC-04 | User can stop audio recording with one tap | `useAudioRecorder` hook stops MediaRecorder, assembles chunks into Blob |
| REC-05 | Recording auto-associates with nearest house address via reverse geocoding | Server action calls Nominatim `/reverse` endpoint with captured lat/lng; address written to `visits.address` asynchronously |
| REC-06 | Audio file uploads to Supabase Storage after recording stops | Signed upload URL from server action; client uploads Blob directly to private `audio` bucket |
| REC-07 | Recording continues reliably when iPhone screen locks | Chunked recording via `timeslice` (10s intervals), Wake Lock API prevents auto-lock, `visibilitychange` handler saves on suspension |
| MOB-01 | Mobile-optimized UI with large tap targets for one-handed use | Tailwind CSS responsive utilities; minimum 48px touch targets; single-column layout |
| MOB-02 | Single user authentication (simple login) | Supabase Auth email/password; `@supabase/ssr` middleware for token refresh |
| MOB-03 | PWA-installable to prevent Safari storage eviction | `app/manifest.ts` with Next.js built-in support; service worker for installability; iOS install prompt component |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | Full-stack framework | App Router, React 19, server actions for all mutations |
| React | 19.x | UI library | Ships with Next.js 15; client components for recording UI |
| TypeScript | 5.x | Type safety | First-class Next.js support |
| @supabase/supabase-js | ^2.99 | Supabase client | Isomorphic client for DB, storage, and auth |
| @supabase/ssr | latest | Server-side Supabase | Cookie-based auth for App Router; replaces deprecated auth-helpers |
| Tailwind CSS | 4.x | Styling | Ships with create-next-app; utility-first for rapid prototyping |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.x | Date formatting | Session timestamps, visit display |
| lucide-react | latest | Icons | Recording controls, GPS indicator, session badges |
| sonner | latest | Toast notifications | Upload status, recording interruption alerts |

### Browser APIs (No Libraries)

| API | Purpose | Key Details |
|-----|---------|-------------|
| MediaRecorder | Audio capture | Safari 14.5+; `timeslice` param supported since Safari 14.0.2; use `isTypeSupported()` for format detection |
| Geolocation | GPS capture | `watchPosition()` with `enableHighAccuracy: true`; accuracy gate at <20m |
| Wake Lock | Prevent screen lock | `navigator.wakeLock.request('screen')`; works in Safari 16.4+ browser, PWA context fixed in iOS 18.4+ |
| Vibration | Haptic feedback | `navigator.vibrate()` for record start/stop; not supported on iOS Safari (graceful no-op) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw MediaRecorder | RecordRTC library | Adds dependency; raw API works fine on modern Safari; only consider if hitting edge cases |
| Nominatim | Geoapify (3,000 free/day) | Better accuracy in some US areas; use as fallback if Nominatim quality is poor for Palo Alto |
| Manual PWA manifest | Serwist / @ducanh09/next-pwa | Next.js has built-in manifest.ts support; only need Serwist if adding offline caching |

**Installation:**
```bash
# Scaffold
npx create-next-app@latest canvassing-companion --typescript --tailwind --eslint --app --src-dir

# Core Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI utilities
npm install date-fns lucide-react sonner

# Dev tools
npm install -D supabase
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── manifest.ts             # PWA manifest (Next.js built-in)
│   ├── page.tsx                # Redirect to /record or /login
│   ├── login/
│   │   └── page.tsx            # Email/password login
│   └── record/                 # Mobile recording interface
│       ├── layout.tsx          # Mobile-optimized layout (viewport meta)
│       └── page.tsx            # Session + recording UI
├── components/
│   ├── recording/
│   │   ├── RecordButton.tsx    # One-tap record toggle (large, pulsing)
│   │   ├── SessionControls.tsx # Start/stop canvassing session
│   │   ├── GpsStatus.tsx       # GPS accuracy indicator
│   │   ├── AddressDisplay.tsx  # Resolved address with loading state
│   │   └── UploadStatus.tsx    # Pending uploads indicator
│   └── shared/
│       └── InstallPrompt.tsx   # iOS Add-to-Home-Screen guide
├── hooks/
│   ├── useAudioRecorder.ts     # MediaRecorder + chunked recording + Wake Lock
│   └── useGeolocation.ts       # watchPosition + accuracy gating
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client (createBrowserClient)
│   │   ├── server.ts           # Server Supabase client (createServerClient)
│   │   └── middleware.ts        # Auth token refresh helper
│   ├── audio.ts                # MIME type detection, file extension mapping
│   ├── geocoding.ts            # Nominatim reverse geocoding helper
│   └── types.ts                # Shared TypeScript types (Session, Visit)
├── actions/
│   ├── sessions.ts             # createSession, endSession
│   ├── visits.ts               # createVisit, updateVisitAddress
│   └── storage.ts              # createSignedUploadUrl
├── middleware.ts                # Supabase auth middleware (token refresh + redirect)
└── public/
    ├── sw.js                   # Minimal service worker (required for PWA installability)
    ├── icon-192x192.png        # PWA icon
    └── icon-512x512.png        # PWA icon
```

### Pattern 1: Signed URL Upload (Audio Never Touches Server)

**What:** Server action generates a signed upload URL; client uploads audio Blob directly to Supabase Storage.
**When to use:** Every audio upload. Server actions have a 1MB body size limit by default.
**Example:**
```typescript
// actions/storage.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createSignedUploadUrl(filePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUploadUrl(filePath)
  if (error) throw error
  return data // { signedUrl, path, token }
}

// Client-side upload
async function uploadAudio(blob: Blob, visitId: string, mimeType: string) {
  const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
  const filePath = `recordings/${visitId}.${ext}`
  const { token } = await createSignedUploadUrl(filePath)

  const supabase = createBrowserClient(...)
  await supabase.storage
    .from('audio')
    .uploadToSignedUrl(filePath, token, blob, {
      contentType: mimeType,
    })
  return filePath
}
```

### Pattern 2: Chunked Recording with Wake Lock

**What:** MediaRecorder with `timeslice` parameter fires `ondataavailable` every N seconds. Chunks accumulate in an array. Wake Lock prevents screen auto-lock. On `visibilitychange`, finalize whatever exists.
**When to use:** Every recording session on mobile.
**Example:**
```typescript
// hooks/useAudioRecorder.ts (simplified core logic)
const chunks: Blob[] = []
let wakeLock: WakeLockSentinel | null = null

async function startRecording(stream: MediaStream) {
  const mimeType = getBestAudioMimeType()
  const recorder = new MediaRecorder(stream, { mimeType })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  // Wake Lock - prevent screen lock during recording
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch (err) {
    console.warn('Wake Lock not available:', err)
  }

  // timeslice = 10000ms -> ondataavailable fires every 10s
  recorder.start(10000)

  // Handle page visibility change (screen lock, app switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && recorder.state === 'recording') {
      recorder.stop() // Triggers final ondataavailable + onstop
    }
  })
}

function stopRecording(): Blob {
  recorder.stop()
  wakeLock?.release()
  const mimeType = recorder.mimeType
  return new Blob(chunks, { type: mimeType })
}
```

### Pattern 3: GPS Accuracy Gating with watchPosition

**What:** Use `watchPosition()` to get progressively refined GPS. Wait for `accuracy < 20m` before using coordinates.
**When to use:** Every recording start. iPhone Safari often returns coarse WiFi-based position first.
**Example:**
```typescript
// hooks/useGeolocation.ts
function useGeolocation() {
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null)
  const [accuracy, setAccuracy] = useState<number>(Infinity)
  const watchIdRef = useRef<number | null>(null)

  const startWatching = useCallback(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setAccuracy(pos.coords.accuracy)
        if (pos.coords.accuracy < 20) {
          setPosition(pos.coords)
        }
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return { position, accuracy, startWatching, stopWatching }
}
```

### Pattern 4: Non-Blocking Reverse Geocoding

**What:** Save visit with raw coordinates immediately. Resolve address asynchronously via server action calling Nominatim.
**When to use:** After every recording. Never block the UI on geocoding.
**Example:**
```typescript
// actions/visits.ts
'use server'
export async function resolveAndUpdateAddress(visitId: string, lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { 'User-Agent': 'CanvassingCompanion/1.0 (contact@example.com)' } }
  )
  const data = await res.json()
  const address = data.display_name

  const supabase = await createClient()
  await supabase.from('visits').update({ address }).eq('id', visitId)
  return address
}
```

### Pattern 5: Supabase SSR Auth with Middleware

**What:** `@supabase/ssr` uses cookie-based sessions. Middleware refreshes expired tokens on every request. Use `getUser()` (or `getClaims()` on latest SDK) for server-side auth checks -- never `getSession()`.
**When to use:** All authenticated routes.
**Example:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|icon-.*\\.png|manifest\\.json).*)'],
}
```

### Anti-Patterns to Avoid

- **Routing audio through server actions:** Server actions have a 1MB body limit. Audio files are 5-50MB. Always use signed upload URLs.
- **Blocking on reverse geocoding:** Nominatim has 200ms-2s latency and 1 req/sec rate limit. Save coordinates immediately; resolve address async.
- **Hardcoding audio MIME type:** Safari produces `audio/mp4`, Chrome produces `audio/webm;codecs=opus`. Use `isTypeSupported()` at runtime.
- **Using `getCurrentPosition()` for recording GPS:** Returns coarse WiFi-based position. Use `watchPosition()` and wait for `accuracy < 20m`.
- **Using `getSession()` for server-side auth:** Not guaranteed to revalidate. Use `getUser()` or `getClaims()`.
- **Public Storage bucket:** Even for single-user, use private bucket with RLS. Signed URLs for all access.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio recording | Custom Web Audio API recorder | Browser MediaRecorder API | MediaRecorder handles encoding, chunking, format negotiation natively |
| Auth system | Custom JWT/session management | Supabase Auth + @supabase/ssr | Cookie management, token refresh, RLS integration all built-in |
| File upload security | Custom token generation | Supabase `createSignedUploadUrl` | 2-hour expiry, path-scoped, handles auth automatically |
| Reverse geocoding | Custom address DB | Nominatim API | Free, global coverage, 1 req/sec is fine for door-to-door pace |
| PWA manifest generation | Build-time manifest plugin | Next.js `app/manifest.ts` | Built-in framework support, type-safe, no build config needed |
| Service worker | Serwist / workbox config | Manual `public/sw.js` | Minimal SW needed (just installability); full offline caching not required |

**Key insight:** This phase uses zero third-party libraries beyond Supabase SDK and UI utilities. All recording, geolocation, and wake lock functionality is native browser API.

## Common Pitfalls

### Pitfall 1: iOS Safari Kills Recording on Screen Lock
**What goes wrong:** iOS suspends all web page JS when the page is not in foreground. Recording silently stops.
**Why it happens:** iOS battery preservation policy -- web apps get zero background execution.
**How to avoid:** (1) Wake Lock API prevents auto-lock during recording. (2) Chunked recording with `timeslice` means only the current 10s chunk is lost if suspension occurs. (3) `visibilitychange` listener immediately finalizes recording on suspension.
**Warning signs:** Audio files consistently shorter than actual conversation duration; `onstop` callback never fires.
**CRITICAL:** Wake Lock works in Safari 16.4+ browser. In PWA (Home Screen) context, it was BROKEN until iOS 18.4. Require iOS 18.4+ for full reliability.

### Pitfall 2: Safari 7-Day Storage Eviction
**What goes wrong:** iOS Safari evicts ALL script-writable storage (IndexedDB, localStorage, Cache API) after 7 days of browser non-use.
**Why it happens:** Apple ITP policy since iOS 13.4 / Safari 13.1.
**How to avoid:** (1) Make app a PWA installed to Home Screen -- exempt from eviction. (2) Upload audio eagerly -- never rely on local storage as permanent. (3) Show pending upload count so user knows if data hasn't synced.
**Warning signs:** User reports "recordings disappeared" after returning to app after a break.

### Pitfall 3: Audio MIME Type Mismatch
**What goes wrong:** Hardcoded `audio/webm` fails on Safari (which produces `audio/mp4` on older iOS). Playback fails silently.
**Why it happens:** Different browsers support different codecs. Safari 18.4+ supports WebM/Opus but older versions only support MP4/AAC.
**How to avoid:** Use `MediaRecorder.isTypeSupported()` at recording time. Store detected MIME in `visits.audio_mime_type`. Map to correct file extension.

### Pitfall 4: GPS Returns Wrong House
**What goes wrong:** Web geolocation returns 50-100m accuracy (WiFi/cell), associating the recording with the house across the street.
**Why it happens:** Safari may not engage full GPS hardware for initial web requests.
**How to avoid:** Use `watchPosition()` with accuracy gate (<20m). Display resolved address to user so they can spot errors. Store raw lat/lng for re-geocoding.

### Pitfall 5: Supabase Free Tier Exhausted in 2 Weeks
**What goes wrong:** 30 conversations/day at 3 min each = ~90MB/day. 1GB storage limit hit in ~11 days.
**Why it happens:** Audio files are large in aggregate; developers underestimate cumulative storage.
**How to avoid:** Target Opus at 32-64kbps for voice. Track storage usage in-app. Plan Supabase Pro ($25/mo) upgrade before first canvassing week. Display storage usage indicator.

### Pitfall 6: Nominatim User-Agent Requirement
**What goes wrong:** Nominatim silently throttles or blocks requests without a proper User-Agent header.
**Why it happens:** Nominatim usage policy requires identifying your application.
**How to avoid:** Always set `User-Agent: CanvassingCompanion/1.0 (contact@example.com)` header. Call from server action (not client) to control headers.

## Code Examples

### PWA Manifest (Next.js Built-in)
```typescript
// Source: https://nextjs.org/docs/app/guides/progressive-web-apps
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Canvassing Companion',
    short_name: 'Canvass',
    description: 'One-tap audio recording with automatic location capture',
    start_url: '/record',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#dc2626', // Red to match recording theme
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

### MIME Type Detection
```typescript
// Source: MDN MediaRecorder.isTypeSupported + Safari WebKit blog
// lib/audio.ts
export function getBestAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',   // Best quality-to-size for voice
    'audio/mp4;codecs=aac',     // Safari fallback
    'audio/mp4',                // Safari further fallback
    'audio/webm',               // Generic webm
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return '' // Let browser choose default
}

export function getFileExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'bin'
}
```

### Database Schema
```sql
-- Source: Project architecture research
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  audio_path TEXT,
  audio_mime_type TEXT,
  audio_duration_seconds INTEGER,
  transcript TEXT,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

-- Storage bucket (created via Supabase Dashboard or CLI)
-- Name: audio
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: audio/*
```

### iOS Install Prompt Component
```typescript
// Source: https://nextjs.org/docs/app/guides/progressive-web-apps
// components/shared/InstallPrompt.tsx
'use client'
import { useState, useEffect } from 'react'

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  if (isStandalone || !isIOS) return null

  return (
    <div className="fixed bottom-0 inset-x-0 bg-blue-50 p-4 border-t text-center">
      <p className="text-sm text-blue-900">
        Install this app: tap Share then "Add to Home Screen"
        for reliable recording.
      </p>
    </div>
  )
}
```

### Minimal Service Worker
```javascript
// public/sw.js
// Minimal service worker for PWA installability
// No offline caching -- app requires network for upload
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Must use SSR package; auth-helpers is deprecated |
| `getSession()` server-side | `getUser()` or `getClaims()` | 2024-2025 | Security: getSession() doesn't revalidate JWT |
| next-pwa (shadowwalker) | Manual manifest.ts + sw.js | 2024+ | next-pwa unmaintained since 2022; Next.js has built-in manifest support |
| Wake Lock broken in PWA | Wake Lock works in PWA | iOS 18.4 (Mar 2025) | WebKit bug 254545 fixed; requires iOS 18.4+ for Home Screen apps |
| MediaRecorder timeslice ignored in Safari | timeslice works | Safari 14.0.2 (2020) | WebKit bug 202233 fixed; chunked recording reliable on all modern Safari |
| Safari only supports MP4/AAC recording | Safari 18.4+ also supports WebM/Opus | Safari 18.4 (2025) | Still detect at runtime with isTypeSupported(); can't assume WebM yet |

## Open Questions

1. **Nominatim address quality for Palo Alto residential streets**
   - What we know: Nominatim uses OpenStreetMap data; quality varies by region
   - What's unclear: Whether Palo Alto residential addresses resolve correctly to individual house numbers
   - Recommendation: Test with 5-10 real Palo Alto addresses in Plan 01-04. If quality is poor, switch to Geoapify (3,000 free/day) as fallback

2. **Audio bitrate vs. transcription accuracy**
   - What we know: Opus at 32kbps is excellent for speech; extends free tier 4x
   - What's unclear: Whether Whisper transcription accuracy degrades at 32kbps Opus
   - Recommendation: Default to 64kbps as safe middle ground; test 32kbps quality in Phase 4 before optimizing further

3. **Wake Lock on iOS versions below 18.4**
   - What we know: Wake Lock in Safari browser works since 16.4; PWA context broken until 18.4
   - What's unclear: What iOS version the user's iPhone runs
   - Recommendation: Detect iOS version; if <18.4, show persistent "keep screen on" warning during recording instead of relying on Wake Lock

4. **Supabase `getClaims()` vs `getUser()` for auth**
   - What we know: `getClaims()` is newer, faster (local JWT validation); `getUser()` makes a server round-trip
   - What's unclear: Whether `getClaims()` is stable in the current `@supabase/ssr` release
   - Recommendation: Use `getUser()` for now (proven pattern); migrate to `getClaims()` later if performance matters

## Sources

### Primary (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official manifest.ts, service worker, install prompt patterns
- [Supabase SSR + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Official middleware, createClient setup
- [Supabase createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) - Signed URL API reference
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) - Web standard reference
- [WebKit Bug 202233](https://bugs.webkit.org/show_bug.cgi?id=202233) - Timeslice parameter FIXED in Safari 14.0.2
- [WebKit Bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545) - Wake Lock in Home Screen PWAs FIXED in iOS 18.4
- [Nominatim Reverse API](https://nominatim.org/release-docs/latest/api/Reverse/) - Endpoint format, parameters
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) - 1 req/sec, User-Agent required
- [WebKit Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/) - 7-day eviction documentation

### Secondary (MEDIUM confidence)
- [iPhone Safari MediaRecorder Guide](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription) - Practical format detection on iPhone
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock) - Browser support table
- [Signed URL file uploads with Next.js and Supabase](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) - Implementation pattern walkthrough
- [PWA iOS Limitations Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - Comprehensive iOS PWA constraints

### Tertiary (LOW confidence)
- [Safari PWA Limitations on iOS (2026)](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/) - Recent roundup, community source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified against official docs; versions confirmed compatible
- Architecture: HIGH - Patterns from official Supabase and Next.js documentation; signed URL pattern verified
- Browser APIs: HIGH - MediaRecorder timeslice and Wake Lock bugs confirmed FIXED via WebKit bug tracker
- Pitfalls: HIGH - iOS limitations verified against WebKit official sources; Supabase limits from pricing docs
- Nominatim quality: LOW - Cannot verify Palo Alto residential accuracy without testing

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem, 30-day window)
