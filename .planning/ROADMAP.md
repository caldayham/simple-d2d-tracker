# Roadmap: Canvassing Companion

## Overview

Two phases to a working field tool. Phase 1 builds the recording pipeline — the entire reason this app exists. Every iOS Safari pitfall lives here and must be solved before touching the dashboard. Phase 2 builds the desktop review interface that makes recorded data useful. The app has no value until recordings are reliable, so the phases are strictly ordered: capture first, then review.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Recording Pipeline** - Mobile web app that reliably records audio + GPS on iPhone Safari and uploads to Supabase
- [x] **Phase 2: Desktop Dashboard** - Review interface with Leaflet map, list view, and audio playback for recorded visits (completed 2026-03-17)

## Phase Details

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
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold: Next.js 15 + Supabase setup, database schema, auth, PWA manifest
- [ ] 01-02-PLAN.md — Recording hooks: useAudioRecorder (chunked MediaRecorder + Wake Lock + MIME detection) and useGeolocation (watchPosition + accuracy gate)
- [ ] 01-03-PLAN.md — Upload + geocoding pipeline: signed URL upload, Nominatim reverse geocoding server actions
- [ ] 01-04-PLAN.md — Mobile recording UI: session controls, record button, GPS status, address display, full flow wiring

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
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Dashboard foundation: layout, server data fetching, component shell with stubs
- [ ] 02-02-PLAN.md — Leaflet map with session-colored house rectangles, click-to-select, auto-fit bounds
- [ ] 02-03-PLAN.md — Session filter, chronological visit list, detail panel with audio playback

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Recording Pipeline | 0/4 | Not started | - |
| 2. Desktop Dashboard | 3/3 | Complete   | 2026-03-17 |
