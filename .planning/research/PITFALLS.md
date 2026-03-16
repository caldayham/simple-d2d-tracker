# Pitfalls Research

**Domain:** Mobile web app for audio recording + GPS location capture (canvassing companion)
**Researched:** 2026-03-16
**Confidence:** HIGH (browser API limitations are well-documented; Supabase Storage limits verified via official docs)

## Critical Pitfalls

### Pitfall 1: iOS Safari Kills Audio Recording When Screen Locks

**What goes wrong:**
iPhone users will lock their screen or switch apps while walking between houses. iOS Safari suspends all web page JavaScript when the page is not in the foreground, which stops the MediaRecorder immediately. The recording either silently stops capturing audio or the stop event never fires, losing the entire recording with no error surfaced to the user.

**Why it happens:**
iOS aggressively suspends background web page execution to preserve battery. Unlike native apps, web apps have zero background execution capability on iOS. There is no workaround -- the W3C Background Sync API and Background Fetch are not supported on iOS Safari. This is a fundamental platform limitation, not a bug.

**How to avoid:**
- Display a persistent, visible warning: "Keep screen on while recording." Use the Wake Lock API (`navigator.wakeLock.request('screen')`) to prevent auto-lock during active recording. Wake Lock IS supported in Safari 16.4+ (iOS 16.4+).
- Chunk recordings using `MediaRecorder.ondataavailable` with a `timeslice` parameter (e.g., every 10 seconds). Store chunks to IndexedDB as they arrive. If the page is suspended, you lose only the current chunk, not the entire conversation.
- On `visibilitychange` event, immediately finalize and save whatever audio data exists. When the page becomes visible again, alert the user that recording was interrupted.

**Warning signs:**
- Testers report "recordings just stop" or "I got a blank file"
- Audio files are consistently shorter than the actual conversation duration
- `MediaRecorder.onstop` callback never fires

**Phase to address:**
Phase 1 (core recording). This is the single most important technical risk. The chunked-recording + Wake Lock pattern must be the foundation, not bolted on later.

---

### Pitfall 2: Safari MediaRecorder Audio Format Mismatch Breaks Downstream Processing

**What goes wrong:**
Developers hardcode `audio/webm` or `audio/wav` as the recording MIME type. Safari historically supported only `audio/mp4` (AAC codec) via MediaRecorder. As of Safari 18.4, WebM/Opus is also supported, but older iOS versions still in use only support MP4/AAC. If you assume one format, recordings silently produce empty blobs or fail entirely on incompatible browsers.

**Why it happens:**
Chrome defaults to `audio/webm;codecs=opus`, Firefox to `audio/ogg;codecs=opus`, and Safari to `audio/mp4`. Developers test on Chrome, ship, and it breaks on Safari. Additionally, future transcription services may expect specific formats.

**How to avoid:**
- Use `MediaRecorder.isTypeSupported()` to detect the best available format at runtime. Test in this priority order: `audio/webm;codecs=opus`, `audio/mp4`, `audio/webm`, then fallback.
- Store the detected MIME type alongside the audio file in your database so downstream processing knows what format to expect.
- Map MIME types to correct file extensions: `audio/webm;codecs=opus` -> `.webm`, `audio/mp4` -> `.m4a`, `audio/wav` -> `.wav`.
- Test on an actual iPhone running the target iOS version, not just Safari DevTools.

**Warning signs:**
- 0-byte audio files in storage
- "Unsupported format" errors from transcription APIs
- Recordings that play on desktop but not mobile, or vice versa

**Phase to address:**
Phase 1 (core recording). Format detection must be built into the recording utility from day one.

---

### Pitfall 3: Geolocation Returns House Across the Street (or a Block Away)

**What goes wrong:**
The app captures GPS coordinates when a recording starts at someone's door, then reverse geocodes to get an address. But web geolocation on iPhone Safari often returns coordinates accurate only to 50-100 meters (sometimes worse), because Safari does not always engage satellite GPS -- it falls back to WiFi positioning and cell tower triangulation. The result: the wrong house address gets associated with the conversation.

**Why it happens:**
iPhone Safari may not use full GPS hardware for web geolocation requests, especially indoors or in areas with strong WiFi signals. The initial position fix from `getCurrentPosition()` is often a coarse WiFi/cell estimate. Additionally, `enableHighAccuracy: true` is only a hint -- it does not guarantee GPS-level precision.

**How to avoid:**
- Use `watchPosition()` instead of `getCurrentPosition()`. The iPhone progressively refines position accuracy over multiple readings. Wait for a reading with `coords.accuracy` under 20 meters before associating with an address.
- Display the captured address to the user on screen after recording, with a one-tap "wrong house, fix it" option. For a canvassing app, the user knows which house they are at -- let them confirm or correct.
- Store raw lat/lng AND the resolved address. Never throw away coordinates -- you can re-geocode later with better data or services.
- Consider that for Palo Alto residential streets, houses are roughly 15-20 meters apart. You need sub-15m accuracy to reliably distinguish adjacent houses.

**Warning signs:**
- `coords.accuracy` values consistently above 30 meters
- Dashboard map pins that cluster incorrectly or land on the wrong side of the street
- User frequently complaining about wrong addresses

**Phase to address:**
Phase 1 (location capture). The accuracy-gating pattern with `watchPosition()` must be the implementation from the start.

---

### Pitfall 4: Supabase Free Tier Storage and Bandwidth Limits Hit Mid-Canvassing

**What goes wrong:**
The Supabase free tier provides 1 GB of file storage and 5 GB of bandwidth (egress). Audio files at reasonable quality (128kbps AAC/Opus) are roughly 1 MB per minute. A 5-minute doorstep conversation = ~5 MB. At 20-30 houses per canvassing day, that is 100-150 MB per day. You hit the 1 GB storage limit in under two weeks. Bandwidth gets consumed faster if you replay audio from the dashboard.

**Why it happens:**
Developers prototype with short test recordings and do not project storage growth. Audio files are deceptively large in aggregate. Playing back audio from the dashboard also consumes egress bandwidth, doubling the bandwidth drain.

**How to avoid:**
- Project storage needs before building: at 30 conversations/day averaging 3 minutes, that is ~90 MB/day, ~2.7 GB/month. The free tier will not survive a single month of active canvassing. Plan for Supabase Pro ($25/month, 100 GB storage, 250 GB bandwidth) from the start, or at minimum have the upgrade path ready.
- Compress audio: use Opus codec at 32-64kbps for voice (still excellent quality for speech). This cuts storage by 2-4x.
- For the dashboard, consider streaming audio directly from Supabase Storage via signed URLs rather than downloading entire files, to reduce bandwidth.
- Track storage usage in the app and warn before limits are hit.

**Warning signs:**
- Supabase dashboard showing storage approaching 80%
- Upload failures with no clear error message
- Email from Supabase about exceeding free tier quota

**Phase to address:**
Phase 1 (upload pipeline). Audio compression and storage projection should be decided upfront. The free tier is a prototype tool, not a production plan for this use case.

---

### Pitfall 5: Safari 7-Day Storage Eviction Destroys Offline Audio Cache

**What goes wrong:**
If the user does not visit the web app in Safari for 7 days, iOS Safari will evict ALL script-writable storage (IndexedDB, Cache API, localStorage) for that origin. Any audio chunks cached locally for later upload will be permanently deleted. This eviction does NOT apply to PWAs added to the home screen -- but only if the user installs it that way.

**Why it happens:**
Apple's ITP (Intelligent Tracking Prevention) policy, implemented since iOS 13.4 / Safari 13.1, caps all script-writable storage at 7 days of browser use without user interaction. This policy is designed to limit tracking but has devastating side effects for web apps that store user data locally.

**How to avoid:**
- Make the app an Add-to-Home-Screen PWA and guide the user through installation during onboarding. Home screen PWAs are exempt from the 7-day eviction policy.
- Never rely on local storage as a permanent store. Treat IndexedDB as a temporary upload queue only. Upload audio to Supabase as soon as network is available.
- Implement an upload queue that retries on app open. On each visit, check IndexedDB for any un-uploaded recordings and flush them to Supabase.
- Show upload status clearly: "3 recordings pending upload" with a manual retry button.

**Warning signs:**
- User reports "my recordings disappeared"
- IndexedDB is empty when user opens the app after a break
- Audio files never made it to Supabase Storage

**Phase to address:**
Phase 1 (PWA setup + upload queue). The app MUST be installable as a PWA and MUST upload eagerly. This is not a Phase 2 enhancement -- it is a data loss prevention requirement.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip chunked recording, record as single blob | Simpler code, fewer moving parts | Entire recording lost on any interruption (screen lock, low memory, crash) | Never -- chunked recording is essential for mobile |
| Use `getCurrentPosition()` instead of `watchPosition()` with accuracy gating | Faster, simpler implementation | Wrong addresses associated with conversations, eroding trust in the data | Only for initial prototype testing, must replace before field use |
| Upload audio synchronously before allowing next recording | Guarantees upload order | Blocks the user from starting next conversation while on slow cellular, killing the "zero friction" UX goal | Never for production |
| Store audio format as hardcoded constant | Fewer edge cases to handle | Breaks silently on browsers/OS versions with different codec support | Never |
| Skip PWA manifest and service worker | Faster initial development | Safari will evict local data after 7 days; no Add-to-Home-Screen; worse mobile UX | Only for first day of development, must add in Phase 1 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage upload | Using `supabase.storage.from('bucket').upload()` for all file sizes without considering the 50 MB free-tier per-file limit | For audio files (typically 1-15 MB), standard upload is fine. Set the `contentType` explicitly to the detected MIME type. Use `upsert: false` to prevent accidental overwrites. |
| Supabase Storage RLS | Creating a public bucket to "simplify things" | Use a private bucket with RLS policies. Even for a single-user app, RLS prevents accidental data exposure. Create a policy that allows upload/read for the authenticated user only. |
| Reverse Geocoding API | Using Google Maps API and hitting the $0 free tier (Google removed the $200/month credit in Feb 2025) | Use Nominatim (free, OpenStreetMap-based) for reverse geocoding. Rate limit: 1 req/sec on the public instance. For 30 houses/day this is trivially within limits. Self-host if needed later. |
| Supabase Auth | Over-engineering auth for a single user | Use Supabase email/password auth with a single account. No social auth, no magic links needed. Consider a PIN or biometric unlock for returning sessions on mobile. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all audio files into memory on dashboard | Dashboard becomes sluggish, browser tab crashes | Stream audio via `<audio>` element with Supabase signed URLs. Never fetch entire files into JS memory. | At ~20 recordings displayed simultaneously |
| Storing audio as base64 in database instead of Storage | Database bloats rapidly, queries slow down, backup sizes explode | Always use Supabase Storage for binary files. Store only the file path/URL reference in the database. | At ~50 recordings (database hits free tier limit) |
| Reverse geocoding every coordinate on page load for dashboard | Slow dashboard load, API rate limits hit | Cache resolved addresses in the database at recording time. Never re-geocode on display. | At ~100 recordings if re-geocoding each time |
| Using `watchPosition()` without clearing the watcher | GPS hardware stays active, draining battery even when not recording | Call `navigator.geolocation.clearWatch(watchId)` as soon as you have an acceptable position fix or recording ends. | Immediately -- users notice battery drain within one canvassing session |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase service role key in client-side code | Anyone can read/delete all audio files and database records | Use only the `anon` key client-side. All elevated operations go through Supabase Edge Functions or RLS policies. |
| Public storage bucket for audio files | Anyone with a file URL can access recordings of private doorstep conversations | Use a private bucket. Generate signed URLs with short expiry (e.g., 1 hour) for dashboard playback. |
| Not requiring HTTPS for geolocation | Geolocation API will silently fail or be denied on HTTP origins | Ensure the deployment is HTTPS-only. Vercel/Netlify handle this automatically. localhost is exempt for development. |
| Storing recordings without any user consent tracking | Legal liability if recordings are challenged | Store a `consent_noted` boolean per recording. The app should prompt "Did the person consent?" before or immediately after recording. This is a business process safeguard, not just technical. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring multiple taps to start recording | Fumbling at someone's door kills the "zero friction" promise. Every extra tap is a reason to abandon the app and go back to memory/notes. | One-tap record from the main screen. Session should already be active. Location capture is automatic. |
| No visual feedback during recording | User does not know if recording is active, leading to accidentally recording nothing or recording when they think they stopped | Large, pulsing red indicator. Elapsed time counter. Haptic feedback on start/stop if available (Vibration API). |
| Showing a loading spinner during upload | User is stuck waiting instead of walking to the next house | Upload in background. Show a small "uploading" badge. Let the user immediately start the next conversation. Queue uploads. |
| Map view without clustering | At 100+ pins in Palo Alto, the map becomes an illegible mess | Use marker clustering (e.g., Leaflet.markercluster or Mapbox clustering) from the start. Even at 30 pins it improves readability. |
| No offline indication | User records in an area with poor cell signal, assumes everything uploaded, data is silently lost | Show clear online/offline status. Show pending upload count. Retry uploads automatically when connectivity returns. |

## "Looks Done But Isn't" Checklist

- [ ] **Audio recording:** Works on iOS Safari on actual iPhone hardware (not just Chrome DevTools mobile simulation). Test with screen auto-lock enabled.
- [ ] **Location capture:** Returns sub-20m accuracy in actual outdoor conditions, not just in an office with strong WiFi. Test by walking a residential street.
- [ ] **Upload pipeline:** Handles airplane mode / poor connectivity gracefully. Test by enabling airplane mode mid-recording, then disabling.
- [ ] **Audio playback:** Dashboard plays back recordings from Safari AND Chrome without codec issues. The format stored may differ by source device.
- [ ] **PWA installation:** The "Add to Home Screen" flow works and the app actually behaves as a standalone PWA (no Safari chrome, data persistence beyond 7 days).
- [ ] **Reverse geocoding:** Returns accurate street addresses for Palo Alto residential neighborhoods specifically. Nominatim data quality varies by region -- verify your target area.
- [ ] **Battery impact:** A 2-hour canvassing session with continuous location + recording does not drain the iPhone battery below usable levels. Test with a real session.
- [ ] **Storage limits:** Projected monthly storage usage fits within the Supabase plan tier. Calculate: (avg conversations/day) x (avg minutes) x (bitrate) x (days/month).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Audio lost to screen lock interruption | HIGH (data is gone) | Cannot recover lost audio. Implement chunked recording to minimize future loss. Educate user to keep screen on. |
| Wrong address associated with recording | LOW | Add "edit address" feature on dashboard. Store raw coordinates so re-geocoding is possible. |
| Storage quota exceeded | MEDIUM | Upgrade Supabase plan. Export and archive old recordings to cheaper storage (e.g., Cloudflare R2). Compress existing files. |
| Safari evicted local IndexedDB data | HIGH (data is gone) | Cannot recover evicted data. Ensure PWA is installed to home screen. Implement eager upload queue to prevent data sitting locally. |
| Audio format incompatible with transcription | LOW | Re-encode audio server-side using FFmpeg in a Supabase Edge Function or external service. Store original + transcription-ready copy. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Screen lock kills recording | Phase 1: Core Recording | Test: lock phone during recording, verify chunks are preserved |
| Audio format mismatch | Phase 1: Core Recording | Test: record on iPhone Safari, Chrome, verify both play back and upload correctly |
| Inaccurate geolocation | Phase 1: Location Capture | Test: walk a residential street, verify addresses match actual houses visited |
| Storage/bandwidth limits | Phase 1: Upload Pipeline | Calculate: project 30 days of usage against Supabase plan limits |
| Safari 7-day eviction | Phase 1: PWA Setup | Test: install as PWA, verify data persists after 7+ days of non-use |
| No offline resilience | Phase 1: Upload Queue | Test: record in airplane mode, re-enable connectivity, verify upload completes |
| Public bucket exposure | Phase 1: Supabase Setup | Verify: bucket is private, RLS policies restrict access to authenticated user |
| Dashboard audio loading | Phase 2: Dashboard | Test: load dashboard with 50+ recordings, verify no memory issues |
| Reverse geocoding rate limits | Phase 1: Location Capture | Verify: Nominatim rate limit (1/sec) is respected, addresses cached in DB |
| Wrong address association | Phase 2: Dashboard | Verify: "edit address" UI exists, raw coordinates stored for re-geocoding |

## Sources

- [MediaRecorder API - Can I Use](https://caniuse.com/mediarecorder) - Browser compatibility tables (HIGH confidence)
- [MediaRecorder API - WebKit Blog](https://webkit.org/blog/11353/mediarecorder-api/) - Safari's official MediaRecorder documentation (HIGH confidence)
- [iPhone Safari MediaRecorder Implementation Guide](https://www.buildwithmatija.com/blog/iphone-safari-mediarecorder-audio-recording-transcription) - Practical format detection patterns (MEDIUM confidence)
- [Safari ALAC/PCM Support in MediaRecorder](https://blog.addpipe.com/record-high-quality-audio-in-safari-with-alac-and-pcm-support-via-mediarecorder/) - Safari Technology Preview codec additions (MEDIUM confidence)
- [PWA iOS Limitations - MagicBell Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - Comprehensive iOS PWA limitations (MEDIUM confidence)
- [Safari PWA Limitations on iOS - BSWEN](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/) - Current 2026 iOS PWA status (MEDIUM confidence)
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) - Official 7-day eviction policy documentation (HIGH confidence)
- [Storage Quotas and Eviction - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Browser storage limits reference (HIGH confidence)
- [Supabase Storage File Limits](https://supabase.com/docs/guides/storage/uploads/file-limits) - Official upload size restrictions (HIGH confidence)
- [Supabase Storage Bandwidth](https://supabase.com/docs/guides/storage/serving/bandwidth) - Official bandwidth/egress documentation (HIGH confidence)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - Official RLS and bucket security docs (HIGH confidence)
- [Supabase Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) - TUS protocol for large file uploads (HIGH confidence)
- [iPhone Geolocation watchPosition](https://www.thedotproduct.org/posts/how-to-get-an-accurate-geo-location-from-apple-iphone-using-navigatorgeolocationwatchposition.html) - iPhone-specific geolocation accuracy patterns (MEDIUM confidence)
- [Apple Geolocation Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/GettingGeographicalLocations/GettingGeographicalLocations.html) - Apple's official Safari geolocation reference (HIGH confidence)
- [Geocoding APIs Comparison](https://www.bitoff.org/geocoding-apis-comparison/) - Free tier comparison for reverse geocoding services (MEDIUM confidence)
- [Nominatim](https://nominatim.org/) - OpenStreetMap reverse geocoding service (HIGH confidence)

---
*Pitfalls research for: Canvassing Companion (mobile audio recording + GPS location tracking web app)*
*Researched: 2026-03-16*
