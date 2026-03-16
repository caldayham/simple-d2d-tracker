---
phase: 01-recording-pipeline
plan: 02
subsystem: hooks
tags: [react, mediarecorder, wakelock, geolocation, ios-safari]

requires:
  - phase: 01-recording-pipeline/01
    provides: "lib/audio.ts getBestAudioMimeType utility"
provides:
  - "useAudioRecorder hook with chunked recording, Wake Lock, MIME detection"
  - "useGeolocation hook with watchPosition and 20m accuracy gating"
affects: [01-04]

tech-stack:
  added: []
  patterns: [chunked-mediarecorder, wakelock-api, accuracy-gated-gps, visibility-auto-stop]

key-files:
  created:
    - src/hooks/useAudioRecorder.ts
    - src/hooks/useGeolocation.ts
  modified: []

key-decisions:
  - "10-second timeslice for chunked recording — balances data safety vs chunk overhead"
  - "visibilitychange auto-stops recording to prevent silent data loss on iOS"
  - "useGeolocation is passive — no auto-start to avoid unnecessary battery drain"

patterns-established:
  - "Hook refs for non-rendering state (chunks, watchId, wakeLock, timers)"
  - "Accuracy gating: position only updates when coords.accuracy < 20m"
  - "Graceful Wake Lock: try/catch with console.warn fallback"

requirements-completed: [REC-03, REC-04, REC-07]

duration: 1min
completed: 2026-03-16
---

# Phase 1 Plan 02: Recording Hooks Summary

**useAudioRecorder with chunked MediaRecorder + Wake Lock + visibilitychange auto-stop, and useGeolocation with 20m accuracy gating**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T23:21:11Z
- **Completed:** 2026-03-16T23:22:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- useAudioRecorder handles all iOS Safari recording pitfalls: chunked timeslice, Wake Lock, visibility auto-stop
- useGeolocation gates on <20m accuracy before accepting position, preventing wrong-house association
- Both hooks compile cleanly with full TypeScript types and no `any`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAudioRecorder hook** - `6226a0b` (feat)
2. **Task 2: Create useGeolocation hook** - `63c7d41` (feat)

## Files Created/Modified
- `src/hooks/useAudioRecorder.ts` - Chunked recording with Wake Lock, MIME detection, visibility handling
- `src/hooks/useGeolocation.ts` - GPS tracking with 20m accuracy gate and error mapping

## Decisions Made
- 10-second timeslice balances data safety against chunk overhead
- visibilitychange handler auto-stops recording when page goes hidden (iOS Safari battery policy)
- useGeolocation passive by default — no auto-start to avoid unnecessary battery drain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both hooks ready for Plan 01-04 (recording UI) to consume
- Hook APIs match the interfaces specified in Plan 01-04

---
*Phase: 01-recording-pipeline*
*Completed: 2026-03-16*
