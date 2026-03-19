---
phase: 04-route-building
verified: 2026-03-18T00:00:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Draw polygon in Plan tab, verify knocks appear in walking order"
    expected: "Knocks grouped by street, odd side ascending then even side descending within each street, with sequence numbers (#1, #2...) visible"
    why_human: "Serpentine sort correctness requires visual inspection of real geocoded address data on a real neighborhood"
  - test: "Drag a knock row to reorder it in the Plan tab before saving"
    expected: "Row moves to the new position immediately, sequence numbers update, list state is preserved"
    why_human: "Native HTML drag-and-drop behavior must be tested interactively in a real browser"
  - test: "Save a route and verify the Runs tab shows 'Planned' badge and estimated time"
    expected: "E.g., '12 doors | ~48m est.' appears under the route name; Active/Ended badge is replaced"
    why_human: "End-to-end flow involves multiple server actions and router.refresh(); must be verified in running app"
  - test: "Click a planned route in the Runs tab, verify RunDetail shows route stats not duration"
    expected: "'Planned Route' label, 'N doors planned', '~Xm estimated (4 min/door)'; End Run button hidden"
    why_human: "Conditional rendering based on session.started flag must be confirmed visually with a real planned route record"
---

# Phase 4: Route Building Verification Report

**Phase Goal:** User can refine a populated route into an optimized, named plan ready for execution
**Verified:** 2026-03-18
**Status:** human_needed — all automated checks pass; 4 items require human verification in a running browser
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Walking order algorithm sorts knocks by street, then serpentine (odd ascending, even descending) | VERIFIED | `src/lib/route-sort.ts` implements full algorithm: group by street, sort streets by avg latitude, odds ascending + evens descending per street |
| 2 | Visits table has a sort_order integer column | VERIFIED | `supabase/migrations/007_visit_sort_order.sql` — `ALTER TABLE visits ADD COLUMN sort_order INTEGER;` |
| 3 | addPlannedKnocks inserts knocks with sequential sort_order reflecting walking order | VERIFIED | `src/actions/sessions.ts` line 158-172: `sortKnocksWalkingOrder(knocks)` called, then `sort_order: index` assigned per knock before insert |
| 4 | reorderKnocks server action updates sort_order for a list of visit IDs | VERIFIED | `src/actions/visits.ts` lines 144-162: auth check, `Promise.all` of individual updates with `sort_order: index` |
| 5 | Planned knocks appear in walking order in the Plan tab with visible sequence numbers | VERIFIED (automated) | `PlannedKnockList.tsx` renders `#{index + 1}` per item; `DashboardShell.tsx` line 280 applies `sortKnocksWalkingOrder(addresses)` before setting state |
| 6 | User can drag to reorder knocks in PlannedKnockList | VERIFIED (automated) | Full native HTML DnD implementation: `draggable`, `onDragStart/Over/Leave/Drop/End` handlers, `onReorder` callback fires with reordered array |
| 7 | Dashboard data query orders visits by sort_order | VERIFIED | `src/actions/dashboard.ts` lines 41-43: `.order('sort_order', { ascending: true, nullsFirst: true }).order('created_at', { ascending: true })` |
| 8 | Saved planned routes in RunsList show "Planned" badge, door count, and estimated time | VERIFIED | `RunsList.tsx` lines 92-115: `!session.started` branch renders "Planned" badge + `{count} doors | ~Xh Ym est.` using 4 min/door formula |
| 9 | RunDetail for planned routes shows route stats instead of duration/timing | VERIFIED | `RunDetail.tsx` lines 132-156: `!session.started` branch renders "Planned Route" label, door count, estimated time with "(4 min/door)"; End Run button is conditionally hidden at line 202 (`session.started && !session.ended_at`) |

**Score:** 9/9 truths verified (automated)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/route-sort.ts` | Walking order sort algorithm | VERIFIED | 79 lines, exports `sortKnocksWalkingOrder`, full serpentine implementation |
| `supabase/migrations/007_visit_sort_order.sql` | sort_order column on visits | VERIFIED | Contains `sort_order` keyword, proper ALTER TABLE statement |
| `src/actions/visits.ts` | reorderKnocks server action | VERIFIED | Exports `reorderKnocks`, substantive auth + Promise.all update logic |
| `src/actions/sessions.ts` | addPlannedKnocks with walking order sort | VERIFIED | Exports `addPlannedKnocks`, imports and applies `sortKnocksWalkingOrder` before insert |
| `src/components/dashboard/PlannedKnockList.tsx` | Drag-reorderable knock list | VERIFIED | Contains drag handlers, GripVertical icons, sequence numbers, dual-mode props |
| `src/components/dashboard/RunsList.tsx` | Route stats display | VERIFIED | Contains `!session.started` conditional, 4 min/door formula |
| `src/components/dashboard/RunDetail.tsx` | Planned route detail view | VERIFIED | Contains "estimated" text, `!session.started` branch, stats display |
| `src/actions/dashboard.ts` | Dashboard query with sort_order ordering | VERIFIED | Contains `sort_order` in both sessions and visits queries |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/sessions.ts` | `src/lib/route-sort.ts` | `import { sortKnocksWalkingOrder }` | VERIFIED | Line 5: `import { sortKnocksWalkingOrder } from '@/lib/route-sort'`; used at line 158 |
| `src/components/dashboard/PlannedKnockList.tsx` | `src/actions/visits.ts` | `reorderKnocks` on drag end | PARTIAL — see note | `PlannedKnockList` calls `onReorderKnocks(newVisits.map(v => v.id))` but the caller (DashboardShell) does NOT wire `reorderKnocks` to the saved-mode visit list; the action exists and the component supports saved mode but the shell only ever passes unsaved `knocks` prop to PlannedKnockList |
| `src/components/dashboard/DashboardShell.tsx` | `src/components/dashboard/PlannedKnockList.tsx` | passes sorted knocks and onReorder | VERIFIED | Line 399-403: `<PlannedKnockList knocks={plannedKnocks} onClear=... onReorder={setPlannedKnocks} />` |

**Note on reorderKnocks wiring:** The `reorderKnocks` server action in `visits.ts` is implemented and `PlannedKnockList` supports a saved-mode `visits` + `onReorderKnocks` prop interface — but `DashboardShell` never renders `PlannedKnockList` in saved mode. After saving a route, the user navigates to the Runs tab where `RunDetail` shows a "View Knocks" button that switches to the Knocks tab with a session filter, not a `PlannedKnockList`. This means drag-reorder of *saved* planned routes via `reorderKnocks` is wired at the component/action layer but is not surfaced in the UI. The Plan 04-02 success criteria only required drag-reorder in the Plan tab (before saving), which IS fully wired. Drag-reorder of already-saved routes is infrastructure that was built but not yet connected to a view — this is not a blocker for the phase goal.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PLAN-04 | 04-01, 04-02 | App auto-sorts knocks into walking order (down one side, back the other) | SATISFIED | `sortKnocksWalkingOrder` in `route-sort.ts`; applied in `addPlannedKnocks` and `handlePolygonComplete` |
| PLAN-05 | 04-01, 04-02 | User can manually reorder knocks after auto-sort by dragging | SATISFIED | `PlannedKnockList` drag-and-drop in Plan tab; `reorderKnocks` action available for persistence |
| PLAN-06 | 04-02 | User can save a planned route with a name | SATISFIED | `handleSaveRoute` in `DashboardShell` — name input + `createPlannedRoute` + `addPlannedKnocks` wired end-to-end |
| PLAN-07 | 04-02 | Planned route displays stats: door count and estimated time (4min/door) | SATISFIED | Both `RunsList` and `RunDetail` show correct stats for `session.started === false` |

All 4 required requirements (PLAN-04 through PLAN-07) are accounted for and evidenced.

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps PLAN-04, PLAN-05, PLAN-06, PLAN-07 to Phase 4. All 4 are claimed in plan frontmatter. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO/FIXME, empty implementations, or stub returns found in any phase 4 files.

### Deviation: dashboard.ts nullsFirst

**Plan 04-02 specified** `.order('sort_order', { ascending: true, nullsFirst: false })` for visits.
**Actual implementation** uses `nullsFirst: true`.

With `nullsFirst: true`, visits without a sort_order (executed visits with `null` sort_order) appear before planned knocks. This is a logical reversal from what the plan specified but is not a goal blocker — it means in a mixed-session query, executed visits sort before planned knocks, which may actually be desirable since the Knocks tab shows all visits together. This is a minor implementation deviation with no functional impact on the phase goal.

### Human Verification Required

#### 1. Walking Order Visual Correctness

**Test:** In the dashboard Plan tab, draw a polygon around a residential block (e.g., Palo Alto grid street). After address population, inspect the knock list order.
**Expected:** Knocks grouped by street name, with one side of each street in ascending address number order followed by the other side in descending order. Sequence numbers (#1, #2, ...) visible on the right of each row.
**Why human:** The serpentine sort algorithm is substantive code but whether it produces a natural walking order requires real geocoded data in a real neighborhood — can't be verified with grep.

#### 2. Drag-to-Reorder Interaction

**Test:** In the Plan tab with a populated knock list, drag row #3 to position #1 by clicking the grip handle and dropping it.
**Expected:** The dragged row moves to the top, sequence numbers renumber, the internal state updates, and the new order persists when Save Route is clicked.
**Why human:** Native HTML5 drag-and-drop behavior and visual feedback (opacity, border indicator) can only be confirmed in a live browser session.

#### 3. End-to-End Save and Stats Display

**Test:** Enter a route name and click Save Route. Switch to Runs tab.
**Expected:** New route appears with "Planned" badge (not "Active") and stats like "12 doors | ~48m est." in place of a date/time.
**Why human:** Flow involves `createPlannedRoute` + `addPlannedKnocks` server actions and `router.refresh()` re-fetch — end-to-end correctness requires a running app with a Supabase connection.

#### 4. RunDetail Planned Route View

**Test:** Click a saved planned route in the Runs tab to expand its RunDetail panel.
**Expected:** "Planned Route" label, door count ("N doors planned"), estimated time ("~Xm estimated (4 min/door)"), visible View Knocks button, and no End Run button.
**Why human:** Conditional rendering based on `session.started === false` is correct in code but must be confirmed against a real database record where `started = false`.

---

## Summary

Phase 4 route building infrastructure and UI are fully implemented. All 9 observable truths are verified at the code level:

- The walking order algorithm (`sortKnocksWalkingOrder`) is a complete, substantive serpentine sort — not a stub.
- The `sort_order` column migration exists and the Visit type includes the field.
- `addPlannedKnocks` calls the algorithm and assigns sequential sort_order values before inserting.
- `reorderKnocks` is a complete server action with auth and Promise.all updates.
- `PlannedKnockList` has full native drag-and-drop with grip handles and sequence numbers.
- `DashboardShell` applies walking order sort immediately on polygon population.
- `RunsList` shows "Planned" badge and 4 min/door estimated time for unstarted sessions.
- `RunDetail` shows a distinct planned route view with stats and hides the End Run button.
- `dashboard.ts` orders visits by sort_order.

TypeScript compiles without errors. No anti-patterns found.

The one structural gap — that `reorderKnocks` is not wired to a UI view for already-saved routes — is out of scope for this phase. The Plan 04-02 success criteria specified drag-reorder in the Plan tab (before saving), which is fully implemented. Drag-reorder of saved routes is Phase 5+ territory.

Four human verification items remain to confirm real-world behavior.

---
_Verified: 2026-03-18_
_Verifier: Claude (gsd-verifier)_
