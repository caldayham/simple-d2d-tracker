# Phase 2: Desktop Dashboard - Research

**Researched:** 2026-03-17
**Domain:** Desktop review UI — Leaflet map with house rectangles, list view, audio playback, session filtering
**Confidence:** HIGH

## Summary

Phase 2 builds a desktop-optimized dashboard for reviewing canvassing visits. The existing codebase already has Leaflet (`leaflet@1.9.4`) and react-leaflet (`react-leaflet@5.0.0`) installed and working in the mobile recording view. The data model (`sessions`, `visits` tables) is fully built and populated by Phase 1. The dashboard needs to: (1) fetch all visits with their sessions from Supabase server-side, (2) render house locations as colored rectangles on a Leaflet map, (3) show a chronological list alongside the map, (4) play audio via Supabase signed download URLs, and (5) filter by canvassing session.

The core technical challenge is modest — this is a read-only data display layer over existing infrastructure. The main decisions are around layout structure (side-by-side panels vs. toggleable views), rectangle sizing for house markers, session color assignment, and audio URL signing strategy.

**Primary recommendation:** Build as a new `/dashboard` route group with server component data fetching, a two-panel desktop layout (map left, list+detail right), and client-side interactivity for map clicks, filtering, and audio playback.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Map view showing visited houses as colored rectangles (not pins) | Leaflet Rectangle via react-leaflet `<Rectangle>` component; create small bounds from visit lat/lng with ~0.00005 degree offset (~5m) |
| DASH-02 | Rectangles color-coded by outcome status or canvassing session | Assign each session a color from a fixed palette via `pathOptions={{ fillColor, color }}`; index by session order |
| DASH-03 | Chronological list view of all visits | Server-side query with `.order('recorded_at', { ascending: false })`; render in scrollable panel |
| DASH-04 | Click any house to see detail view with address, timestamp, and audio playback | Rectangle `eventHandlers={{ click }}` sets selected visit; detail panel shows metadata + `<audio>` element with signed download URL |
| DASH-05 | Filter map and list by canvassing session | Client-side filter state; session selector dropdown; both map rectangles and list filter by selected session ID |
| DASH-06 | Desktop-optimized layout (map + list + detail) | Two-column layout: map (left, ~60%), list+detail (right, ~40%); full viewport height; responsive but desktop-first |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-leaflet | 5.0.0 | React wrapper for Leaflet map | Already in use for mobile map; `<Rectangle>`, `<MapContainer>`, `<TileLayer>` components |
| leaflet | 1.9.4 | Map rendering engine | Already installed; Rectangle, LatLngBounds APIs |
| @supabase/ssr | 0.9.x | Server-side Supabase client | Already used for auth + data fetching in server actions |
| @supabase/supabase-js | 2.99.x | Supabase client | Already used for storage uploads; reuse for signed download URLs |
| date-fns | 4.1.0 | Date formatting | Already installed; use `format()` for visit timestamps |
| lucide-react | 0.577.x | Icons | Already installed; use for UI chrome (filter, play, list icons) |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/dynamic | 16.1.7 | Dynamic import with SSR disabled | Required for Leaflet components (already pattern in codebase) |
| sonner | 2.0.7 | Toast notifications | Already installed; use for error states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet Rectangle | L.rectangle (raw Leaflet) | Already using react-leaflet pattern; stay consistent |
| Server-side data fetch | Client-side useEffect fetch | Server components avoid loading spinners, better for initial data |
| Side-by-side layout | Tab toggle (map/list) | Side-by-side is better for desktop; tabs better for mobile but not required |

**Installation:**
```bash
# No new packages needed — everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Server component: fetch data, render layout
│   │   └── layout.tsx         # Dashboard-specific layout (full viewport, no scroll)
│   ├── record/                # Existing mobile recording UI
│   └── page.tsx               # Root redirect (update to detect device?)
├── components/
│   ├── dashboard/
│   │   ├── DashboardMap.tsx   # Client: Leaflet map with rectangles (dynamic import)
│   │   ├── VisitList.tsx      # Client: scrollable chronological visit list
│   │   ├── VisitDetail.tsx    # Client: selected visit detail + audio player
│   │   ├── SessionFilter.tsx  # Client: session selector dropdown
│   │   └── AudioPlayer.tsx    # Client: <audio> element with signed URL
│   └── recording/             # Existing mobile components
├── actions/
│   ├── dashboard.ts           # Server actions for dashboard data fetching
│   ├── sessions.ts            # Existing
│   ├── storage.ts             # Existing (add signed download URL action)
│   └── visits.ts              # Existing
└── lib/
    └── colors.ts              # Session color palette utility
```

### Pattern 1: Server Component Data Fetching
**What:** Fetch all sessions and visits in the dashboard page server component, pass as props to client components.
**When to use:** Initial page load — avoids loading spinners and client-side fetch waterfalls.
**Example:**
```typescript
// src/app/dashboard/page.tsx (server component)
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });

  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .order('recorded_at', { ascending: false });

  return (
    <DashboardShell sessions={sessions ?? []} visits={visits ?? []} />
  );
}
```

### Pattern 2: Rectangle Bounds from Point Coordinates
**What:** Convert a visit's lat/lng point into a small rectangular bounds for Leaflet Rectangle.
**When to use:** Every visit marker on the map.
**Example:**
```typescript
// Create a ~10m x 10m rectangle centered on the visit location
function visitToBounds(lat: number, lng: number): L.LatLngBoundsExpression {
  const offset = 0.00005; // ~5 meters at Palo Alto latitude
  return [
    [lat - offset, lng - offset],
    [lat + offset, lng + offset],
  ];
}
```

### Pattern 3: Dynamic Import for Leaflet (existing pattern)
**What:** Use `next/dynamic` with `ssr: false` for any component that imports Leaflet.
**When to use:** All map components — Leaflet accesses `window` object.
**Example:**
```typescript
// Already used in src/app/record/page.tsx
const DashboardMap = dynamic(() => import('@/components/dashboard/DashboardMap'), {
  ssr: false,
  loading: () => <div className="bg-zinc-900 animate-pulse" />,
});
```

### Pattern 4: Signed Download URL for Audio Playback
**What:** Generate a time-limited signed URL for audio file playback from Supabase Storage.
**When to use:** When user selects a visit to play its audio recording.
**Example:**
```typescript
// Server action
export async function getAudioUrl(audioPath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(audioPath, 3600); // 1 hour expiry
  if (error) throw new Error(`Failed to get audio URL: ${error.message}`);
  return data.signedUrl;
}

// Client usage
<audio controls src={signedUrl} />
```

### Pattern 5: Session Color Assignment
**What:** Assign deterministic colors to sessions so the same session always gets the same color.
**When to use:** Map rectangle coloring and list badges.
**Example:**
```typescript
const SESSION_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

function getSessionColor(sessionIndex: number): string {
  return SESSION_COLORS[sessionIndex % SESSION_COLORS.length];
}
```

### Anti-Patterns to Avoid
- **Fetching audio URLs eagerly for all visits:** Only fetch signed URL when user clicks to play. Signed URLs expire and bulk-fetching wastes quota.
- **Rendering hundreds of Rectangles without bounds checking:** For now visit count will be small (tens to low hundreds), so this is not yet a concern. If it grows, use Leaflet's built-in viewport culling.
- **Using `useEffect` for initial data fetch:** The dashboard page should be a server component. Don't replicate the mobile pattern of client-side-only state for read-only data.
- **Hardcoding Palo Alto coordinates:** Use the actual visit data bounds to set initial map view via `map.fitBounds()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map rectangles | Custom SVG overlays | react-leaflet `<Rectangle>` | Handles projection, zoom, click events automatically |
| Audio playback | Custom audio player with canvas waveform | Native `<audio controls>` | HTML5 audio element is sufficient for v1; no waveform needed |
| Date formatting | Manual date string manipulation | `date-fns format()` | Already installed; handles timezones, locales correctly |
| Session color palette | Random color generation | Fixed palette with modulo indexing | Deterministic, visually distinct, accessible |
| Map bounds fitting | Manual zoom/center calculation | `map.fitBounds(allVisitBounds)` | Leaflet handles padding, aspect ratio automatically |

**Key insight:** This phase is a read-only display layer. The data model and backend are complete from Phase 1. Resist the urge to add edit/delete/update features — those are out of scope.

## Common Pitfalls

### Pitfall 1: Leaflet SSR Crash
**What goes wrong:** Importing Leaflet in a server-rendered component crashes because Leaflet accesses `window` and `document`.
**Why it happens:** Next.js server components run in Node.js where browser globals don't exist.
**How to avoid:** Always use `dynamic(() => import(...), { ssr: false })` for any component tree that touches Leaflet. This pattern is already established in `src/app/record/page.tsx`.
**Warning signs:** `ReferenceError: window is not defined` during build or server render.

### Pitfall 2: Signed URL Expiration During Long Sessions
**What goes wrong:** User opens dashboard, walks away, comes back — audio URLs have expired and playback fails silently.
**Why it happens:** Signed URLs have a fixed TTL (e.g., 1 hour).
**How to avoid:** Fetch signed URL on-demand when user clicks play (not pre-fetched). Use generous TTL (3600s). If playback fails, show error toast and re-fetch URL.
**Warning signs:** Audio element shows error state or doesn't play after page has been open for a while.

### Pitfall 3: Rectangle Size at Different Zoom Levels
**What goes wrong:** Rectangles that look good at zoom 16 are invisible at zoom 12 or massive at zoom 19.
**Why it happens:** Geographic coordinates don't scale with pixel zoom.
**How to avoid:** Use a fixed geographic offset (~0.00005 degrees, roughly 5m). At neighborhood zoom levels (15-18) this produces visible but small rectangles. At lower zooms, rectangles cluster naturally — acceptable for v1.
**Warning signs:** Rectangles disappear or overlap excessively.

### Pitfall 4: Empty State on First Dashboard Visit
**What goes wrong:** Dashboard loads with an empty map and blank list, confusing the user.
**Why it happens:** No visits recorded yet, or all visits are in a different session.
**How to avoid:** Show explicit empty state messages ("No visits recorded yet. Start a canvassing session from your phone."). Default to "All Sessions" filter, not a specific session.
**Warning signs:** Blank white map centered on default coordinates.

### Pitfall 5: Map Container Height Collapse
**What goes wrong:** Leaflet map renders as 0px height.
**Why it happens:** Leaflet requires an explicit height on its container. CSS `height: 100%` only works if all parent elements also have explicit heights.
**How to avoid:** Use `h-screen` or `h-full` with a flex layout that gives the map container a definite height. The existing mobile map uses `absolute inset-0` which works; the dashboard will need a flex-based approach.
**Warning signs:** Map container exists in DOM but nothing visible.

## Code Examples

### Dashboard Data Fetching (Server Action)
```typescript
// src/actions/dashboard.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import type { Session, Visit } from '@/lib/types';

export async function getDashboardData(): Promise<{
  sessions: Session[];
  visits: Visit[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [sessionsRes, visitsRes] = await Promise.all([
    supabase.from('sessions').select('*').order('started_at', { ascending: false }),
    supabase.from('visits').select('*').order('recorded_at', { ascending: false }),
  ]);

  return {
    sessions: (sessionsRes.data ?? []) as Session[],
    visits: (visitsRes.data ?? []) as Visit[],
  };
}
```

### Signed Download URL (Server Action)
```typescript
// Add to src/actions/storage.ts
export async function createSignedDownloadUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUrl(filePath, 3600);

  if (error) throw new Error(`Failed to create download URL: ${error.message}`);
  return data.signedUrl;
}
```

### React-Leaflet Rectangle with Click Handler
```typescript
// Inside DashboardMap.tsx
import { Rectangle, MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

function VisitRectangle({ visit, color, isSelected, onClick }: {
  visit: Visit;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const bounds: LatLngBoundsExpression = [
    [visit.latitude - 0.00005, visit.longitude - 0.00005],
    [visit.latitude + 0.00005, visit.longitude + 0.00005],
  ];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: isSelected ? '#fff' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.6,
        weight: isSelected ? 3 : 1,
      }}
      eventHandlers={{ click: onClick }}
    />
  );
}
```

### Desktop Two-Panel Layout
```typescript
// src/app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-4 shrink-0">
        <h1 className="font-semibold">Canvassing Companion</h1>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}

// src/app/dashboard/page.tsx renders:
// <div className="flex-1 relative"> <!-- map --> </div>
// <div className="w-[400px] border-l flex flex-col"> <!-- list + detail --> </div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-leaflet v3 class components | react-leaflet v5 hooks + function components | v4 (2022) | Use `<Rectangle>` component, not `withLeaflet()` HOC |
| Next.js pages router `getServerSideProps` | Next.js 16 app router server components | Next.js 13+ (2023) | Fetch data directly in page.tsx, no API routes needed |
| Supabase `createSignedUrl` on client | Server action for signed URL | Current best practice | Keep Supabase service key server-side; client only gets the signed URL |

**Deprecated/outdated:**
- `react-leaflet` v3 patterns (class-based, `withLeaflet` HOC) — use v5 component API
- Next.js `getServerSideProps` / `getStaticProps` — use server components in app router

## Open Questions

1. **Map auto-bounds vs. fixed center**
   - What we know: Visits are all in Palo Alto area; `map.fitBounds()` can auto-frame all visible visits
   - What's unclear: Should the map reset bounds when session filter changes?
   - Recommendation: Use `fitBounds` on initial load and when filter changes. This ensures the map always shows relevant data.

2. **Rectangle size for overlapping visits**
   - What we know: Multiple visits to the same or adjacent houses will produce overlapping rectangles
   - What's unclear: How common is this in practice?
   - Recommendation: Use small rectangles (0.00005 degree offset). Accept overlap for v1 — the color coding still makes sessions distinguishable. Cluster/aggregate is a v2 concern.

3. **Navigation between mobile and desktop**
   - What we know: Root `/` currently redirects to `/record`. Desktop users should reach `/dashboard`.
   - What's unclear: Should we auto-detect device or add a simple nav link?
   - Recommendation: Add a nav link on the `/record` page to dashboard and vice versa. Avoid auto-detection — user might want either view on any device.

## Sources

### Primary (HIGH confidence)
- react-leaflet official docs (https://react-leaflet.js.org/docs/api-components/) — Rectangle component API, pathOptions, eventHandlers
- Leaflet reference (https://leafletjs.com/reference.html#rectangle) — Rectangle bounds, styling options
- Supabase Storage docs (https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) — createSignedUrl API
- Supabase Storage docs (https://supabase.com/docs/reference/javascript/storage-from-createsignedurls) — createSignedUrls batch API
- Existing codebase — LocationMap.tsx, visits.ts, sessions.ts, storage.ts patterns

### Secondary (MEDIUM confidence)
- Supabase download guide (https://supabase.com/docs/guides/storage/serving/downloads) — signed URL usage for browser media playback

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use in Phase 1; no new dependencies
- Architecture: HIGH — straightforward server component data fetch + client-side Leaflet rendering; follows established codebase patterns
- Pitfalls: HIGH — well-known Leaflet SSR issues already solved in codebase; signed URL patterns are standard Supabase

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable stack, no fast-moving dependencies)
