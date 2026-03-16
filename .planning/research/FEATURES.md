# Feature Research

**Domain:** Door-to-door canvassing companion (audio + location logging for a solo home services contractor)
**Researched:** 2026-03-16
**Confidence:** MEDIUM -- based on competitor analysis of SalesRabbit, Spotio, Knockio, Lead Scout, Knockbase, and Ecanvasser. Audio recording as a primary capture method is uncommon in this space, which makes this product's core value genuinely novel but means less prior art to reference.

## Important Context

This is NOT a SaaS field sales platform. It is a personal tool for a single Palo Alto carpentry/handyman business owner who canvasses neighborhoods door-to-door. The feature landscape below is calibrated to that use case -- a solo operator who needs zero-friction field capture, not team management or CRM pipelines.

The existing competitors (SalesRabbit at $25-99/user/month, Spotio at enterprise pricing, Knockbase, Lead Scout) are all built for sales teams with managers. They over-serve a solo operator with features like territory assignment, rep performance tracking, and team dashboards. The opportunity here is radical simplicity.

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must work on day one or the app provides no value over a notepad.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-tap audio recording | Core value prop -- the whole point of the app. Must start recording in under 2 seconds from app open | MEDIUM | MediaRecorder API on Safari has quirks; test early on actual iPhone |
| Automatic GPS capture on recording start | Every recording must be tied to a location without manual entry | LOW | Geolocation API is well-supported; need to handle permission prompts gracefully |
| Reverse geocoding to street address | Raw lat/lng is meaningless to the user; must show "123 Main St" | LOW | Nominatim (free, OpenStreetMap) or Google Geocoding API. Nominatim preferred for zero-cost constraint |
| Session grouping | Natural unit: "Tuesday morning canvassing run." Groups visits together for review | LOW | Simple parent-child relationship in database |
| Audio playback from dashboard | Recorded audio is useless if you cannot play it back easily | LOW | HTML5 audio element; ensure Supabase Storage URLs work with streaming |
| Map view of visited houses | Visual overview of where you have been; every competitor has this | MEDIUM | Mapbox GL JS or Leaflet with OpenStreetMap tiles. Leaflet preferred for zero cost |
| List view of visits (chronological) | Alternative to map for quick scanning and search | LOW | Standard sorted query from Supabase |
| House detail view | Click a pin or list item to see address, recording, timestamp, any notes | LOW | Simple detail page pulling from single record |
| Cloud audio storage | Audio must be accessible from any device (phone in field, laptop at home) | LOW | Supabase Storage handles this; upload after recording |
| Mobile-optimized UI | Used one-handed while standing at someone's doorstep; large tap targets, minimal chrome | MEDIUM | Requires careful responsive design; test on actual iPhone Safari |

### Differentiators (Competitive Advantage)

Features that make this better than competitors for this specific use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Audio-first capture (vs. text forms) | No competitor centers on audio recording. They all use forms/text notes. Audio captures tone, exact words, nuance -- things text cannot. Preserving original audio builds a corpus for future AI analysis | LOW (for recording), HIGH (for transcription) | The recording itself is simple; the downstream value (transcription, AI extraction) compounds over time |
| On-demand transcription | Convert audio to searchable text when needed, not automatically. Saves cost, lets user process selectively | MEDIUM | Whisper API or Deepgram. On-demand means no background processing cost for recordings that never get reviewed |
| Zero-friction field UX | Competitors require filling forms at each door. This app: tap record, talk, tap stop, walk to next house. Under 3 seconds of app interaction per visit | MEDIUM | UX design challenge, not technical. Must resist adding fields/forms |
| Desktop review dashboard | Field capture on phone, review on laptop. Competitors are mobile-only or require their desktop app. A web app works everywhere | LOW | Same Next.js app, responsive layout. Desktop gets map + list + detail side by side |
| Conversation search (post-transcription) | After transcribing, full-text search across all conversations. "Show me everyone who mentioned deck repair" | MEDIUM | Requires transcription first. Supabase full-text search on transcription column |
| Future AI extraction pipeline | The audio corpus becomes a gold mine: sentiment analysis, lead scoring from conversation tone, keyword extraction, follow-up suggestions | HIGH | Explicitly deferred. But the architecture must preserve original audio and store transcriptions to enable this later |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but would hurt this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| CRM pipeline / deal stages | Every competitor has it; seems like "the next step" | Massive scope increase for a solo operator. The user runs 50+ jobs mentally. Adding pipeline stages means building a CRM, which is a different product entirely | Simple tags or status on house records (e.g., "interested," "not home," "declined"). No pipeline visualization |
| Multi-user / team features | Natural scaling question | One user. Adding auth roles, team views, territory assignment, and permissions is 3x the complexity for zero current value | Single user with simple auth. Revisit only if the brother starts canvassing independently |
| Route optimization | Competitors highlight it; seems useful for planning | Requires integrating a routing engine (Google Directions API or OSRM), managing waypoints, and building a route planner UI. The user walks neighborhoods organically -- he is not a delivery driver with 40 stops | Show visited houses on map so user can visually see gaps. No algorithmic routing |
| Real-time transcription during recording | Flashy feature; feels futuristic | Requires streaming audio to a transcription API while recording, handling partial results, and managing latency. Adds cost per second of recording. The user needs to focus on the conversation, not read a transcript | On-demand transcription after the fact. User reviews when they are back at their desk |
| Lead scoring / AI prioritization | DataGrid-style "who to visit next" | Requires historical data, ML models, and a training dataset that does not exist yet. Premature optimization | Collect data first. After 100+ conversations with transcriptions, patterns will emerge that inform what scoring even means for this business |
| Notification / reminder system | "Remind me to follow up with 123 Main St" | Builds toward a task management system. The user has his own follow-up workflow. Notifications require service workers, push notification setup, and UX for managing reminders | Export or flag houses as "follow up." User manages follow-ups in his existing workflow |
| Photo capture at each house | Competitors allow photo documentation | Adds complexity to field capture flow (camera permissions, image upload, storage costs). Breaks the zero-friction "record and go" UX. Photos of houses feel invasive during canvassing | If photos are needed later, user can take them separately. Audio description of the house works better in a conversation context |
| Offline-first with background sync | Required for apps used in rural areas | Palo Alto has excellent cell coverage. Implementing robust offline-first with IndexedDB caching, conflict resolution, and background sync via service workers is HIGH complexity. Not needed for the launch environment | Handle temporary network drops gracefully (retry upload). Do not build full offline mode unless field testing reveals actual connectivity issues |
| Custom forms / survey builder | Competitors let you define data fields per door | Form builders are a product in themselves. Every field added to the door interaction increases friction and decreases the speed advantage of audio-first capture | Fixed, minimal metadata: address (auto), timestamp (auto), session (auto), optional quick-tag (one tap) |

## Feature Dependencies

```
[Audio Recording]
    |--requires--> [GPS Capture] (location grabbed at recording start)
    |--requires--> [Cloud Storage] (audio uploaded after recording)
    |--requires--> [Reverse Geocoding] (lat/lng converted to address)

[Map View]
    |--requires--> [GPS Capture] (pins need coordinates)
    |--requires--> [House Records] (data to display)

[House Detail View]
    |--requires--> [Audio Playback] (play recording for this house)
    |--requires--> [House Records] (address, timestamp, session)

[On-demand Transcription]
    |--requires--> [Audio Recording] (audio must exist first)
    |--requires--> [Cloud Storage] (transcription service reads from storage)
    |--enhances--> [House Detail View] (adds readable text to detail)

[Conversation Search]
    |--requires--> [On-demand Transcription] (needs text to search)
    |--enhances--> [List View] (filter/search results appear in list)

[Session Grouping]
    |--enhances--> [Map View] (filter pins by session)
    |--enhances--> [List View] (group visits by session)

[Desktop Dashboard]
    |--requires--> [Map View]
    |--requires--> [List View]
    |--requires--> [House Detail View]
```

### Dependency Notes

- **Audio Recording requires GPS Capture:** Location must be grabbed the moment recording starts, not as a separate step. This is a single atomic action from the user's perspective.
- **On-demand Transcription requires Cloud Storage:** The transcription service (Whisper, Deepgram) needs to access the audio file. It reads from Supabase Storage, not from the user's device.
- **Conversation Search requires Transcription:** Cannot search audio directly. Text transcription must exist first. This creates a natural phasing: record first, transcribe selectively, search what has been transcribed.
- **Session Grouping enhances Map and List views:** Not required for them to work, but makes both significantly more useful by allowing time-based filtering.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate that audio-first canvassing capture works better than a notepad.

- [ ] **Session start/stop** -- tap to begin a canvassing run, tap to end it
- [ ] **One-tap audio recording with auto GPS** -- the core interaction loop
- [ ] **Reverse geocoding to address** -- recordings show street addresses, not coordinates
- [ ] **Audio upload to Supabase Storage** -- recordings persist in the cloud
- [ ] **Mobile recording interface** -- large record button, minimal UI, works one-handed
- [ ] **Desktop map view** -- see all visited houses as pins on a map
- [ ] **Desktop list view** -- chronological list of visits with address and timestamp
- [ ] **House detail with audio playback** -- click a house to hear the conversation
- [ ] **Simple auth** -- single user login, nothing more

### Add After Validation (v1.x)

Features to add once the owner has used the MVP for 2-3 canvassing sessions and confirmed the core loop works.

- [ ] **On-demand transcription** -- add when the owner wants to search/review conversations as text. Trigger: "I wish I could read what they said without replaying the audio"
- [ ] **Quick-tag on houses** -- one-tap status tags like "interested," "not home," "declined." Trigger: "I want to filter houses by outcome"
- [ ] **Session filtering on map/list** -- filter views by canvassing session. Trigger: "I want to see just Tuesday's visits"
- [ ] **Conversation search** -- full-text search across transcribed conversations. Trigger: accumulation of 20+ transcriptions makes manual scanning slow

### Future Consideration (v2+)

Features to defer until the audio corpus and usage patterns justify the investment.

- [ ] **AI data extraction** -- extract names, services discussed, follow-up commitments from transcriptions. Defer because: needs 50+ transcribed conversations to understand what patterns matter
- [ ] **Neighborhood analytics** -- heat maps of interest level, response rates by area. Defer because: needs months of data across multiple sessions
- [ ] **Export to CRM/spreadsheet** -- export house data and transcriptions. Defer because: no CRM exists yet; premature to build integration points
- [ ] **PWA with offline support** -- installable app with offline recording. Defer because: adds significant complexity; validate that mobile web works first in Palo Alto's good coverage area

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| One-tap audio recording + GPS | HIGH | MEDIUM | P1 |
| Reverse geocoding to address | HIGH | LOW | P1 |
| Audio cloud upload | HIGH | LOW | P1 |
| Mobile recording UI | HIGH | MEDIUM | P1 |
| Session start/stop | HIGH | LOW | P1 |
| Desktop map view | HIGH | MEDIUM | P1 |
| Desktop list view | MEDIUM | LOW | P1 |
| House detail + playback | HIGH | LOW | P1 |
| Simple auth | MEDIUM | LOW | P1 |
| Quick-tag status | MEDIUM | LOW | P2 |
| On-demand transcription | HIGH | MEDIUM | P2 |
| Session filtering | MEDIUM | LOW | P2 |
| Conversation search | MEDIUM | MEDIUM | P2 |
| AI data extraction | HIGH | HIGH | P3 |
| Neighborhood analytics | LOW | HIGH | P3 |
| Data export | LOW | MEDIUM | P3 |
| PWA offline support | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when validated by real usage
- P3: Nice to have, future consideration after corpus exists

## Competitor Feature Analysis

| Feature | SalesRabbit | Spotio | Lead Scout | Knockio | Our Approach |
|---------|-------------|--------|------------|---------|--------------|
| GPS location tracking | Yes (real-time) | Yes (geofenced) | Yes (pin addresses) | Yes (per-knock) | Yes -- auto-capture on record start |
| Map view of visits | Yes (heat maps) | Yes (territory maps) | Yes (pin map) | Yes (map view) | Yes -- Leaflet + OSM, simpler but sufficient |
| Lead data capture | Forms + fields | Forms + CRM sync | Photo + notes + forms | Notes + forms | Audio recording (novel). No forms |
| Audio recording | No | No | No | No | YES -- primary differentiator |
| Team management | Yes (core feature) | Yes (core feature) | Yes (teams) | Yes (teams) | No -- single user, deliberately omitted |
| Route optimization | Yes | Yes | No | Yes | No -- organic walking, not delivery routing |
| CRM integration | Yes (many) | Yes (Salesforce etc.) | Yes (webhooks) | Yes (CRM sync) | No -- not needed for solo operator |
| AI/ML features | DataGrid AI leads | AI automation | No | No | Deferred -- future transcription + extraction |
| Transcription | No | No | No | No | Yes (on-demand) -- second differentiator |
| Pricing | $25-99/user/mo | Enterprise (custom) | Free-$49/mo | $25-65/user/mo | Free (self-hosted on Supabase free tier) |
| Offline support | Yes | Yes | Partial | Yes | Deferred -- Palo Alto has good coverage |

**Key takeaway:** No competitor offers audio recording or transcription. They all center on typed forms and structured data entry. Audio-first capture is a genuine gap in the market, particularly valuable for a solo operator who cannot type notes while having a doorstep conversation.

## Sources

- [SalesRabbit](https://salesrabbit.com/) -- feature set, pricing, free tier (SalesRabbit Lite)
- [Spotio](https://spotio.com/) -- field sales platform features, activity tracking
- [Lead Scout](https://www.leadscoutapp.com/) -- contractor-specific canvassing, pin + photo capture
- [Knockio](https://knockio.com/) -- conversation logging, route optimization
- [Knockbase](https://www.knockbase.com/) -- canvassing software feature overview
- [Ecanvasser](https://www.ecanvasser.com/) -- door knocking app, field sales features
- [Nominatim](https://nominatim.org/) -- free reverse geocoding via OpenStreetMap
- [Gitnux: Top 10 Sales Canvassing Software 2026](https://gitnux.org/best/sales-canvassing-software/) -- market overview
- [Fieldservicely: Best Door Knocking Software](https://www.fieldservicely.com/door-to-door-canvassing-app) -- feature comparison
- [What PWA Can Do Today](https://whatpwacando.today/geolocation/) -- PWA geolocation capabilities

---
*Feature research for: Door-to-door canvassing companion (audio + location)*
*Researched: 2026-03-16*
