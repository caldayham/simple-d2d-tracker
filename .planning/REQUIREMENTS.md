# Requirements: Canvassing Companion

**Defined:** 2026-03-16
**Core Value:** One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.

## v1.0 Requirements (Complete)

### Recording & Capture

- [x] **REC-01**: User can start a canvassing session with one tap
- [x] **REC-02**: User can stop/end a canvassing session
- [x] **REC-03**: User can start audio recording with one tap (auto-captures GPS location)
- [x] **REC-04**: User can stop audio recording with one tap
- [x] **REC-05**: Recording auto-associates with nearest house address via reverse geocoding
- [x] **REC-06**: Audio file uploads to Supabase Storage after recording stops
- [x] **REC-07**: Recording continues reliably when iPhone screen locks (Wake Lock + chunked recording)

### Mobile Interface

- [x] **MOB-01**: Mobile-optimized UI with large tap targets for one-handed use
- [x] **MOB-02**: Single user authentication (simple login)
- [x] **MOB-03**: PWA-installable to prevent Safari storage eviction

### Dashboard

- [x] **DASH-01**: Map view showing visited houses as colored rectangles (not pins)
- [x] **DASH-02**: Rectangles color-coded by outcome status or canvassing session
- [x] **DASH-03**: Chronological list view of all visits
- [x] **DASH-04**: Click any house to see detail view with address, timestamp, and audio playback
- [x] **DASH-05**: Filter map and list by canvassing session
- [x] **DASH-06**: Desktop-optimized layout (map + list + detail)

## v1.1 Requirements — Planned Routes

Requirements for milestone v1.1. Each maps to roadmap phases.

### Route Planning

- [ ] **PLAN-01**: User can draw points and lines on the dashboard map to define a canvassing area
- [ ] **PLAN-02**: User can connect points into a polygon to select a neighborhood boundary
- [ ] **PLAN-03**: App auto-populates house addresses within the drawn area from a geocoding API
- [ ] **PLAN-04**: App auto-sorts populated knocks into a walking order (down one side of street, back on the other)
- [ ] **PLAN-05**: User can manually reorder knocks after auto-sort by dragging
- [ ] **PLAN-06**: User can save a planned route with a name
- [ ] **PLAN-07**: Planned route displays stats: door count and estimated time (4min/door)

### Route Data Model

- [ ] **DATA-01**: Planned routes and executed runs share the same database structure (sessions table)
- [ ] **DATA-02**: Planned knocks are stored as visit/knock records with null audio, time, and date fields
- [ ] **DATA-03**: Session has a "started" flag — false for planned routes, true once execution begins
- [ ] **DATA-04**: Planned knocks persist as unvisited markers until executed

### Route Execution (Mobile)

- [ ] **EXEC-01**: User can browse and select a planned route to execute from a list
- [ ] **EXEC-02**: Selected route shows the first house address to drive to
- [ ] **EXEC-03**: User taps "start run" to begin execution (timer starts, session marked as started)
- [ ] **EXEC-04**: Mobile view shows current expected house number/address
- [ ] **EXEC-05**: Mini map displays user's GPS position relative to upcoming houses on the route
- [ ] **EXEC-06**: Progress indicator shows doors completed vs remaining and elapsed time
- [ ] **EXEC-07**: Tapping record snapshots GPS coordinates and starts audio recording
- [ ] **EXEC-08**: After stopping recording, existing notes/status flow applies — then advances to next house

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Processing & Search

- **PROC-01**: User can trigger on-demand transcription of any recording
- **PROC-02**: User can search across transcribed conversations (full-text)
- **PROC-03**: AI extracts structured data from transcriptions (name, notes, follow-up date)

### Enhanced Capture

- **ECAP-01**: Quick-tag status on houses (interested, not home, declined) with one tap
- **ECAP-02**: User can manually correct reverse-geocoded address

### Analytics

- **ANLY-01**: Neighborhood heat map of interest levels
- **ANLY-02**: Response rate analytics by area/session

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / team features | Single user only; brother not canvassing independently |
| CRM pipeline / deal stages | Solo operator doesn't need pipeline management |
| Real-time transcription | Adds cost/complexity; user needs to focus on conversation |
| Photo capture at doors | Breaks zero-friction UX; can use regular camera app if needed |
| Offline-first with background sync | Palo Alto has excellent cell coverage; handle retries instead |
| Custom forms / survey builder | Every form field increases friction; audio captures everything |
| Notification / reminder system | User has existing follow-up workflow |
| Native iOS app | Web app covers mobile + desktop; PWA sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REC-01 | Phase 1 | Complete |
| REC-02 | Phase 1 | Complete |
| REC-03 | Phase 1 | Complete |
| REC-04 | Phase 1 | Complete |
| REC-05 | Phase 1 | Complete |
| REC-06 | Phase 1 | Complete |
| REC-07 | Phase 1 | Complete |
| MOB-01 | Phase 1 | Complete |
| MOB-02 | Phase 1 | Complete |
| MOB-03 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 2 | Complete |
| DASH-04 | Phase 2 | Complete |
| DASH-05 | Phase 2 | Complete |
| DASH-06 | Phase 2 | Complete |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 4 | Pending |
| PLAN-05 | Phase 4 | Pending |
| PLAN-06 | Phase 4 | Pending |
| PLAN-07 | Phase 4 | Pending |
| EXEC-01 | Phase 5 | Pending |
| EXEC-02 | Phase 5 | Pending |
| EXEC-03 | Phase 5 | Pending |
| EXEC-04 | Phase 5 | Pending |
| EXEC-05 | Phase 5 | Pending |
| EXEC-06 | Phase 5 | Pending |
| EXEC-07 | Phase 5 | Pending |
| EXEC-08 | Phase 5 | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19/19
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-18 after roadmap creation for v1.1*
