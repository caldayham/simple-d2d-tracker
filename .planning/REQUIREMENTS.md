# Requirements: Canvassing Companion

**Defined:** 2026-03-16
**Core Value:** One-tap audio recording with automatic location capture — so every doorstep conversation is logged to the right house with zero friction while canvassing.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Recording & Capture

- [ ] **REC-01**: User can start a canvassing session with one tap
- [ ] **REC-02**: User can stop/end a canvassing session
- [x] **REC-03**: User can start audio recording with one tap (auto-captures GPS location)
- [x] **REC-04**: User can stop audio recording with one tap
- [x] **REC-05**: Recording auto-associates with nearest house address via reverse geocoding
- [x] **REC-06**: Audio file uploads to Supabase Storage after recording stops
- [x] **REC-07**: Recording continues reliably when iPhone screen locks (Wake Lock + chunked recording)

### Mobile Interface

- [ ] **MOB-01**: Mobile-optimized UI with large tap targets for one-handed use
- [x] **MOB-02**: Single user authentication (simple login)
- [x] **MOB-03**: PWA-installable to prevent Safari storage eviction

### Dashboard

- [ ] **DASH-01**: Map view showing visited houses as colored rectangles (not pins)
- [ ] **DASH-02**: Rectangles color-coded by outcome status or canvassing session
- [ ] **DASH-03**: Chronological list view of all visits
- [ ] **DASH-04**: Click any house to see detail view with address, timestamp, and audio playback
- [ ] **DASH-05**: Filter map and list by canvassing session
- [ ] **DASH-06**: Desktop-optimized layout (map + list + detail)

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
| Route optimization | Walks neighborhoods organically, not optimized delivery |
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
| REC-01 | Phase 1 | Pending |
| REC-02 | Phase 1 | Pending |
| REC-03 | Phase 1 | Complete |
| REC-04 | Phase 1 | Complete |
| REC-05 | Phase 1 | Complete |
| REC-06 | Phase 1 | Complete |
| REC-07 | Phase 1 | Complete |
| MOB-01 | Phase 1 | Pending |
| MOB-02 | Phase 1 | Complete |
| MOB-03 | Phase 1 | Complete |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| DASH-05 | Phase 2 | Pending |
| DASH-06 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
