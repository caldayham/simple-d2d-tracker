---
phase: quick
plan: 1
subsystem: visits-demographics
tags: [demographics, database, ui]
dependency_graph:
  requires: []
  provides: [visit-demographics-fields, demographics-ui]
  affects: [recording-flow, dashboard-detail-views, edit-visit-modal]
tech_stack:
  added: []
  patterns: [pill-selector-toggle, conditional-display]
key_files:
  created:
    - supabase/migrations/005_visit_demographics.sql
  modified:
    - src/lib/types.ts
    - src/actions/visits.ts
    - src/components/recording/ResultPicker.tsx
    - src/app/record/page.tsx
    - src/components/dashboard/VisitDetail.tsx
    - src/components/dashboard/MobileVisitDetail.tsx
    - src/components/dashboard/EditVisitModal.tsx
    - src/components/dashboard/DashboardShell.tsx
decisions:
  - Pill toggle pattern for gender/age-range/occupancy with deselect on re-tap
  - Demographics placed below notes textarea in ResultPicker
  - Display format "Name - Gender, Age Range, Occupancy" with null parts omitted
metrics:
  duration: 3min
  completed: "2026-03-19T02:05:00Z"
---

# Quick Task 1: Add Gender and Age Range Fields to Knock Summary

Demographics fields (contact_name, gender, age_range, occupancy) added to visit data model with full CRUD support and UI in both recording and dashboard flows.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add demographics columns and update types/actions | 405e91e | migration, types.ts, visits.ts |
| 2 | Add demographics UI to ResultPicker, EditVisitModal, and dashboard | 6c2eef7 | ResultPicker, EditVisitModal, VisitDetail, MobileVisitDetail |

## What Was Built

1. **Database migration** (`005_visit_demographics.sql`): Adds 4 nullable columns to visits table - `contact_name` (TEXT), `gender` (TEXT with CHECK constraint), `age_range` (TEXT with CHECK constraint), `occupancy` (TEXT with CHECK constraint).

2. **Type updates**: Visit type now includes `contact_name`, `gender`, `age_range`, `occupancy` as `string | null`.

3. **Server actions**: `updateVisitResult` accepts optional demographics parameter. `updateVisit` and `createManualVisit` accept demographics fields.

4. **ResultPicker UI**: After result tag buttons and notes textarea, shows: name text input, gender pill row (Male/Female/Unknown), age range pill row (<30/30-50/50-70/>70), occupancy pill row (Homeowner/Renter/Unknown). Pills toggle on tap with white-on-black selected state.

5. **EditVisitModal**: Same demographics fields added between Result and Notes sections for editing existing visits or adding new ones.

6. **Dashboard detail views**: Both VisitDetail (desktop) and MobileVisitDetail (mobile) conditionally display demographics with User icon when any field is present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added occupancy field everywhere**
- **Found during:** Task 1
- **Issue:** Constraints required occupancy (Homeowner/Renter/Unknown) alongside gender and age_range
- **Fix:** Added occupancy column to migration, types, actions, ResultPicker, EditVisitModal, and dashboard detail views
- **Files modified:** All files in both tasks

**2. [Rule 2 - Missing critical functionality] Added demographics to EditVisitModal and DashboardShell**
- **Found during:** Task 2
- **Issue:** Constraints required EditVisitModal to support demographics editing, not just ResultPicker
- **Fix:** Added demographics fields to EditVisitModal and updated DashboardShell's handleSaveVisit to pass them through
- **Files modified:** EditVisitModal.tsx, DashboardShell.tsx

## Decisions Made

1. **Pill toggle UX**: Tapping an already-selected pill deselects it (returns to null), matching the plan's toggle behavior.
2. **Demographics display format**: "Name - Gender, Age Range, Occupancy" with null parts omitted and entire row hidden when all fields are null.
3. **Demographics export type**: Created a reusable `Demographics` type exported from ResultPicker for use in record page.

## Self-Check: PASSED
