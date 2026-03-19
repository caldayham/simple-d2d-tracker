# Roadmap: Canvassing Companion

## Milestones

- ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-17)
- 🚧 **v1.1 Planned Routes** - Phases 3-5 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-2) - SHIPPED 2026-03-17</summary>

- [x] **Phase 1: Recording Pipeline** - Mobile web app that reliably records audio + GPS on iPhone Safari and uploads to Supabase
- [x] **Phase 2: Desktop Dashboard** - Review interface with Leaflet map, list view, and audio playback for recorded visits

### Phase 1: Recording Pipeline
**Goal**: A canvassing session can be captured reliably on an iPhone — every doorstep conversation recorded, located, and uploaded to the cloud with zero data loss
**Depends on**: Nothing (first phase)
**Requirements**: REC-01, REC-02, REC-03, REC-04, REC-05, REC-06, REC-07, MOB-01, MOB-02, MOB-03
**Success Criteria** (what must be TRUE):
  1. User can log in and access the mobile recording UI from iPhone Safari
  2. User can start a canvassing session and stop it; sessions persist in Supabase
  3. User can tap once to start recording and once to stop; recording continues when the phone screen locks
  4. Each completed recording appears in Supabase Storage with the correct address auto-resolved from GPS coordinates
  5. App is installable to iPhone home screen and does not lose stored data after 7 days of inactivity
**Plans**: 4/4 complete

Plans:
- [x] 01-01: Project scaffold (Next.js 15 + Supabase, schema, auth, PWA)
- [x] 01-02: Recording hooks (chunked MediaRecorder + Wake Lock + geolocation)
- [x] 01-03: Upload + geocoding pipeline (signed URLs, Nominatim reverse geocoding)
- [x] 01-04: Mobile recording UI (session controls, record button, full flow)

### Phase 2: Desktop Dashboard
**Goal**: Recorded visits are reviewable from a desktop browser — visible on a map, browsable in a list, and playable with full detail per house
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. User can open the dashboard and see all visited houses as colored rectangles on a Leaflet map
  2. Rectangles are color-coded by canvassing session so different sessions are visually distinct
  3. User can view a chronological list of all visits alongside or toggled with the map
  4. User can click any house to see its address, timestamp, and play back the audio recording
  5. User can filter both map and list to show only visits from a selected canvassing session
**Plans**: 3/3 complete

Plans:
- [x] 02-01: Dashboard foundation (layout, server data fetching, component shell)
- [x] 02-02: Leaflet map with session-colored house rectangles
- [x] 02-03: Session filter, visit list, detail panel with audio playback

</details>

### v1.1 Planned Routes

**Milestone Goal:** Enable pre-planned canvassing runs — scout areas on a map, auto-generate house knock lists, and execute routes with guided mobile UI.

**Phase Numbering:**
- Integer phases (3, 4, 5): Planned milestone work
- Decimal phases (3.1, 3.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 3: Route Data & Area Selection** - Data model for planned routes plus map drawing and address auto-population
- [ ] **Phase 4: Route Building** - Auto-sort knocks into walking order, manual reorder, save routes with stats
- [ ] **Phase 5: Guided Execution** - Mobile interface for loading and executing planned routes knock-by-knock

## Phase Details

### Phase 3: Route Data & Area Selection
**Goal**: User can draw an area on the map and get a list of house addresses within it, backed by a data model that unifies planned and executed routes
**Depends on**: Phase 2 (existing dashboard with map)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, PLAN-01, PLAN-02, PLAN-03
**Success Criteria** (what must be TRUE):
  1. User can draw points and connect them into a polygon on the dashboard map to outline a neighborhood
  2. After drawing a polygon, house addresses within the area appear as a list of planned knocks
  3. Planned knocks appear as distinct markers on the dashboard map (visually different from executed visits)
  4. Planned routes use the existing sessions/visits tables — sessions have a "started" flag (false for planned, true for executed) and planned knocks are visit records with null audio/time fields
**Plans**: TBD

### Phase 4: Route Building
**Goal**: User can refine a populated route into an optimized, named plan ready for execution
**Depends on**: Phase 3
**Requirements**: PLAN-04, PLAN-05, PLAN-06, PLAN-07
**Success Criteria** (what must be TRUE):
  1. After area selection, knocks are auto-sorted into a logical walking order (down one side of the street, back on the other)
  2. User can drag to reorder knocks after the auto-sort
  3. User can save a route with a name and see it in a list of saved routes
  4. Saved route displays door count and estimated time (calculated at 4 minutes per door)
**Plans**: TBD

### Phase 5: Guided Execution
**Goal**: User can load a planned route on mobile and execute it knock-by-knock with navigation and progress tracking
**Depends on**: Phase 4
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08
**Success Criteria** (what must be TRUE):
  1. User can browse saved routes and select one to execute, seeing the first house address to drive to
  2. User taps "start run" and sees the current house address with a mini map showing their GPS position relative to upcoming houses
  3. Progress indicator shows doors completed vs remaining and elapsed time throughout the run
  4. Tapping record captures GPS coordinates, records audio, and after stopping the existing notes/status flow applies before advancing to the next house
  5. Completed knocks update the visit records in place — planned knock becomes an executed visit with audio, timestamp, and coordinates

## Progress

**Execution Order:**
Phases execute in numeric order: 3 → 4 → 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Recording Pipeline | v1.0 | 4/4 | Complete | 2026-03-17 |
| 2. Desktop Dashboard | v1.0 | 3/3 | Complete | 2026-03-17 |
| 3. Route Data & Area Selection | v1.1 | 0/TBD | Not started | - |
| 4. Route Building | v1.1 | 0/TBD | Not started | - |
| 5. Guided Execution | v1.1 | 0/TBD | Not started | - |
