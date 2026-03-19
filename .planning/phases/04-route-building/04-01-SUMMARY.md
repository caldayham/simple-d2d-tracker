---
phase: 04-route-building
plan: 01
subsystem: api
tags: [algorithm, sorting, supabase, server-actions]

requires:
  - phase: 03-route-data-area-selection
    provides: "Planned routes, addPlannedKnocks, Overpass API address data"
provides:
  - "sortKnocksWalkingOrder algorithm for serpentine street walking order"
  - "sort_order column on visits table for manual reordering"
  - "reorderKnocks server action for drag-drop reordering"
  - "Auto-sorted planned knocks at creation time"
affects: [04-route-building]

tech-stack:
  added: []
  patterns: ["serpentine street walking sort (odd ascending, even descending)"]

key-files:
  created:
    - src/lib/route-sort.ts
    - supabase/migrations/007_visit_sort_order.sql
  modified:
    - src/lib/types.ts
    - src/actions/visits.ts
    - src/actions/sessions.ts

key-decisions:
  - "Serpentine pattern: odd house numbers ascending then even descending per street"
  - "Streets ordered by average latitude north-to-south for geographic progression"
  - "sort_order nullable so existing visits are unaffected"

patterns-established:
  - "Walking order sort: group by street, order streets geographically, serpentine within street"

requirements-completed: [PLAN-04, PLAN-05]

duration: 1min
completed: 2026-03-19
---

# Phase 4 Plan 1: Walking Order Sort & Visit Ordering Summary

**Serpentine street walking algorithm with sort_order persistence and reorder server action for planned knocks**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-19T06:47:13Z
- **Completed:** 2026-03-19T06:48:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Walking order sort algorithm groups knocks by street, orders streets north-to-south, and applies serpentine pattern (odd ascending, even descending) within each street
- sort_order column added to visits table for persisting manual reorder adjustments
- addPlannedKnocks now auto-sorts knocks into walking order before database insert
- reorderKnocks server action enables future drag-drop reordering UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Walking order sort algorithm** - `b0bd376` (feat)
2. **Task 2: Visit sort_order migration and server actions** - `8281b06` (feat)

## Files Created/Modified
- `src/lib/route-sort.ts` - Pure function sorting knocks into serpentine walking order
- `supabase/migrations/007_visit_sort_order.sql` - Adds nullable sort_order column to visits
- `src/lib/types.ts` - Added sort_order field to Visit type
- `src/actions/visits.ts` - Added reorderKnocks server action
- `src/actions/sessions.ts` - Updated addPlannedKnocks to auto-sort via walking order

## Decisions Made
- Serpentine pattern: odd house numbers ascending then even descending per street for natural "down one side, back the other" canvassing
- Streets ordered by average latitude (north-to-south) so canvasser works through nearby streets sequentially
- sort_order is nullable -- existing visits get null (they don't need ordering), only planned knocks use it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Walking order algorithm and sort infrastructure ready for route list UI (plan 04-02)
- reorderKnocks action ready for drag-drop reordering component

---
*Phase: 04-route-building*
*Completed: 2026-03-19*
