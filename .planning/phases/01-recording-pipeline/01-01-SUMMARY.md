---
phase: 01-recording-pipeline
plan: 01
subsystem: infra
tags: [nextjs, supabase, pwa, typescript, tailwind, auth]

requires:
  - phase: none
    provides: "First plan - no prior dependencies"
provides:
  - "Next.js 15 App Router project scaffold"
  - "Supabase browser + server clients with @supabase/ssr"
  - "Auth middleware with token refresh and login redirect"
  - "Login page with email/password auth"
  - "PWA manifest and service worker for iOS installability"
  - "Database schema (sessions + visits tables with RLS)"
  - "Shared TypeScript types (Session, Visit)"
  - "Audio MIME type detection utility"
  - "Session server actions (create/end)"
affects: [01-02, 01-03, 01-04]

tech-stack:
  added: [next@16.1.7, react@19, "@supabase/supabase-js", "@supabase/ssr", date-fns, lucide-react, sonner, tailwindcss@4]
  patterns: [app-router, server-actions, supabase-ssr-cookies, pwa-manifest-ts]

key-files:
  created:
    - src/lib/types.ts
    - src/lib/audio.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - src/app/login/page.tsx
    - src/app/manifest.ts
    - src/app/record/page.tsx
    - src/app/record/layout.tsx
    - src/actions/sessions.ts
    - src/components/shared/InstallPrompt.tsx
    - public/sw.js
    - supabase/migrations/001_schema.sql
  modified: []

key-decisions:
  - "Used getUser() instead of getSession() for all server-side auth checks (security requirement)"
  - "PWA manifest uses Next.js built-in app/manifest.ts -- no third-party PWA library"
  - "Minimal service worker (install + activate only) -- no offline caching since app requires network"
  - "Added .env.local.example exclusion to .gitignore for template tracking"

patterns-established:
  - "Supabase SSR pattern: createBrowserClient for client, createServerClient with cookies for server"
  - "Auth middleware: updateSession helper refreshes tokens, redirects unauthenticated to /login"
  - "Server actions: 'use server' directive, getUser() auth check, typed returns"
  - "Mobile-first: min-h-[48px] touch targets, viewport-fit cover"

requirements-completed: [MOB-02, MOB-03]

duration: 5min
completed: 2026-03-16
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 15 scaffold with Supabase SSR auth, PWA manifest + service worker, database schema with RLS, and shared types/utilities**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T23:14:04Z
- **Completed:** 2026-03-16T23:19:14Z
- **Tasks:** 2 (1 auto + 1 checkpoint auto-approved)
- **Files modified:** 34

## Accomplishments
- Full Next.js 15 project with App Router, TypeScript, Tailwind CSS
- Supabase auth flow: middleware token refresh, login page, protected routes
- PWA-ready: manifest.ts, service worker, iOS install prompt, apple-touch-icon
- Database migration with sessions/visits tables and row-level security
- All shared types and utilities ready for downstream plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with Supabase, types, auth, and PWA** - `3522efb` (feat)
2. **Task 2: Verify scaffold and auth flow** - auto-approved checkpoint (no commit)

## Files Created/Modified
- `src/lib/types.ts` - Session and Visit TypeScript types
- `src/lib/audio.ts` - MIME type detection (getBestAudioMimeType) and file extension mapping
- `src/lib/supabase/client.ts` - Browser Supabase client (createBrowserClient)
- `src/lib/supabase/server.ts` - Server Supabase client with cookie-based sessions
- `src/lib/supabase/middleware.ts` - Auth token refresh helper (updateSession)
- `src/middleware.ts` - Route protection middleware using getUser()
- `src/app/login/page.tsx` - Email/password login form with large touch targets
- `src/app/manifest.ts` - PWA manifest (standalone, red theme, app icons)
- `src/app/record/page.tsx` - Placeholder recording page
- `src/app/record/layout.tsx` - Mobile-optimized layout with InstallPrompt
- `src/app/layout.tsx` - Root layout with Toaster, service worker registration, viewport meta
- `src/app/page.tsx` - Redirect to /record
- `src/actions/sessions.ts` - createSession and endSession server actions
- `src/components/shared/InstallPrompt.tsx` - iOS Add-to-Home-Screen prompt
- `public/sw.js` - Minimal service worker (skipWaiting + clients.claim)
- `public/icon-192x192.png` - PWA icon (192x192 red placeholder)
- `public/icon-512x512.png` - PWA icon (512x512 red placeholder)
- `supabase/migrations/001_schema.sql` - Sessions + visits tables with RLS policies
- `.env.local.example` - Template for Supabase environment variables

## Decisions Made
- Used getUser() not getSession() for server-side auth (security: getSession doesn't revalidate)
- PWA uses built-in Next.js manifest.ts rather than third-party PWA library
- Minimal service worker -- only install/activate handlers for installability, no offline caching
- Updated .gitignore to allow .env.local.example while blocking actual .env files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] .gitignore blocks .env.local.example**
- **Found during:** Task 1 (git staging)
- **Issue:** Default create-next-app .gitignore pattern `.env*` blocked `.env.local.example`
- **Fix:** Added `!.env.local.example` exclusion to .gitignore
- **Files modified:** .gitignore
- **Verification:** File staged and committed successfully
- **Committed in:** 3522efb (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor .gitignore fix, no scope creep.

## Issues Encountered
None

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- Supabase project creation and env vars
- User account creation for login
- Private audio storage bucket creation
- Database migration execution

## Next Phase Readiness
- All shared types, Supabase clients, and auth infrastructure ready for Plan 01-02 (recording hooks) and Plan 01-03 (upload/geocoding pipeline)
- Recording page placeholder ready for Plan 01-04 to replace with full UI

---
*Phase: 01-recording-pipeline*
*Completed: 2026-03-16*
