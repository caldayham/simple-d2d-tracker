---
phase: 04-route-building
plan: 02
subsystem: ui
tags: [drag-drop, walking-order, route-stats, react, dashboard]

requires:
  - phase: 04-route-building-01
    provides: sortKnocksWalkingOrder algorithm and reorderKnocks server action
provides:
  - Drag-reorderable PlannedKnockList with dual mode (unsaved/saved)
  - Route stats display (door count + estimated time) in RunsList and RunDetail
  - Auto-sorted walking order on polygon population
  - Dashboard query ordering by sort_order
affects: [route-execution, canvassing-workflow]

tech-stack:
  added: []
  patterns: [html-native-drag-drop, dual-mode-component-props]

key-files:
  created: []
  modified:
    - src/components/dashboard/PlannedKnockList.tsx
    - src/components/dashboard/RunsList.tsx
    - src/components/dashboard/RunDetail.tsx
    - src/components/dashboard/DashboardShell.tsx
    - src/actions/dashboard.ts

key-decisions:
  - "Used native HTML drag-and-drop instead of external library (dnd-kit/react-beautiful-dnd) for simplicity"
  - "Dual-mode PlannedKnockList accepts either unsaved knocks or saved Visit[] for reuse across Plan tab and route detail"

patterns-established:
  - "Dual-mode component: single component handles both temporary and persisted data via optional prop groups"
  - "Route time estimation: 4 minutes per door as standard canvassing rate"

requirements-completed: [PLAN-04, PLAN-05, PLAN-06, PLAN-07]

duration: 2min
completed: 2026-03-19
---

# Phase 4 Plan 2: Route Building UI Summary

**Drag-reorderable knock list with walking order auto-sort and route stats display for planned routes**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-19T06:51:00Z
- **Completed:** 2026-03-19T06:53:07Z
- **Tasks:** 3 (2 auto + 1 auto-approved checkpoint)
- **Files modified:** 5

## Accomplishments
- PlannedKnockList now supports drag-to-reorder with GripVertical handles and sequence numbers
- Planned routes show "Planned" badge, door count, and estimated time in RunsList
- RunDetail displays route stats instead of duration/timing for planned routes
- Knocks auto-sorted into walking order immediately after polygon population
- Dashboard query orders visits by sort_order for correct display

## Task Commits

Each task was committed atomically:

1. **Task 1: Drag-reorderable PlannedKnockList and sorted display** - `c528fa7` (feat)
2. **Task 2: Route stats in RunsList and RunDetail** - `a437ef0` (feat)
3. **Task 3: Verify complete route building flow** - auto-approved (no commit needed)

## Files Created/Modified
- `src/components/dashboard/PlannedKnockList.tsx` - Dual-mode drag-reorderable knock list with grip handles
- `src/components/dashboard/RunsList.tsx` - Planned badge and route stats for planned routes
- `src/components/dashboard/RunDetail.tsx` - Route stats and hidden End Run button for planned routes
- `src/components/dashboard/DashboardShell.tsx` - Walking order sort on polygon results, onReorder prop passing
- `src/actions/dashboard.ts` - Visit query ordered by sort_order then created_at

## Decisions Made
- Used native HTML drag-and-drop (draggable, onDragStart, onDragOver, onDrop) instead of a library -- keeps bundle small and complexity low for simple list reorder
- Dual-mode PlannedKnockList component accepts either `knocks` (unsaved) or `visits` (saved) props to avoid duplicating the UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route building UI is complete: draw area, auto-sort, drag reorder, save, view stats
- Phase 4 (Route Building) is fully complete
- Ready for Phase 5 if applicable

---
*Phase: 04-route-building*
*Completed: 2026-03-19*
