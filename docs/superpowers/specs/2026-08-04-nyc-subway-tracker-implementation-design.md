# NYC Subway Tracker Full-App Implementation Design

**Status:** Approved for implementation

**Approval basis:** The rider authorized autonomous completion of all product plans on August 4, 2026. This document translates the approved July 30 product specification and its governed product contracts into one runnable subway-first product.

**Release posture:** Trust-first, unofficial NYC subway companion; no MTA logo, official map artwork, or unsupported operational claim.

---

## 1. Outcome and release definition

The release is complete when a rider can install or open the product, allow location once, and immediately see the three closest useful subway complexes with up to three trustworthy arrivals in every passenger-serving direction. The same product must remain useful when location is denied, a feed fails, or the phone is offline.

The working release includes:

- live subway arrivals from all NYCT subway GTFS-Realtime feed groups;
- regular and supplemented static GTFS ingestion with supplemented coverage ownership;
- active subway alerts and scoped service-change explanations;
- holding and uncertain train treatment based on feed and movement evidence;
- location-based nearby ranking, station search, saved stations, and deterministic personalization;
- an original day/night vector network reference generated from public GTFS geometry;
- installable offline behavior for the app shell, station catalog, saved stations, map, and last coherent boards;
- direction-aware accessibility metadata, optional current elevator/escalator outage integration, and fail-closed Accessible Route Only behavior;
- verified front/middle/back guidance where an app-owned reviewed record exists, with an honest unavailable state everywhere else;
- recurring commute windows and disruption-only browser notifications while the installed app has an execution opportunity;
- responsive one-handed navigation, keyboard operation, screen-reader structure, reduced-motion support, and dark-first legibility;
- deterministic demonstration data only when live initialization cannot complete, always labeled **Demonstration data — not live**.

The release does not invent subway car crowding. It displays **Crowding not reported for this train** because no trustworthy public subway car-level feed is available. The data model admits a future capability source without changing today’s rider claim.

## 2. Experience direction

### 2.1 Visual idea

The product should feel like a clear platform instrument, not a generic analytics dashboard. Its signature element is a vertical **platform spine**: each station card has two directional tracks, and every arrival aligns to a precise notch on the track. Large route tokens, destination, wait, and truth state can be read at arm’s length in poor station light.

The dark-first palette uses near-black track space, warm off-white type, muted steel dividers, signal amber for attention, and published route colors as redundant identity accents. Route letter or number, destination text, icon, and state label always accompany color. The product is visibly marked **Unofficial** and uses no MTA logo or copied service-map artwork.

### 2.2 Information hierarchy

On launch, the rider sees in this order:

1. connectivity and data-truth status;
2. the current location context or explicit fallback context;
3. nearby station cards ordered by practical usefulness;
4. both passenger-serving directions on each card;
5. up to three primary Live or Expected arrivals per direction;
6. separate Holding or Uncertain train context;
7. scoped service, accessibility, positioning, and crowding disclosures;
8. the thumb dock in the bottom third.

Exact arrival time is the largest value. Route identity and destination are second. Source state, movement age, alert scope, and scheduled-fallback age remain visible but quieter.

### 2.3 Thumb dock

The persistent lower dock contains Nearby, Saved, Map, and Settings. A context row immediately above it contains refresh, line filter, direction focus, and reverse-trip controls when relevant. All frequent actions have at least a 44-by-44 CSS-pixel target and remain reachable without stretching to the top bar.

## 3. Product surfaces and rider flows

### 3.1 Zero-tap startup

The shell and cached nearby content render immediately. On the first meaningful location request, a one-screen purpose explanation precedes the browser permission prompt. A permitted result is used transiently to rank stations and is not retained. Approximate location remains useful. If location is denied, unavailable, or times out, the product opens the first applicable Active saved station; otherwise it opens a station picker with recent non-location choices.

While live data initializes, cached content retains its original timestamp and historical treatment. It never becomes visually current merely because the app reopened.

### 3.2 Nearby and station board

Nearby shows at most three station complexes. Each card includes the selected useful entrance when supported, practical straight-line proximity only when entrance routing is unavailable, served routes, accessibility scope, directions, and next arrivals. Selecting a card opens a full station board without changing saved intent.

The full board supports line filtering, direction focus, refresh, save, alert details, accessibility details, and map context. Filters never hide a relevant disruption warning. Fewer than three eligible arrivals is an honest result.

### 3.3 Saved stations

Saved stations work without an account. A saved record can contain station, entrance, direction, route filter, destination, accessible-path choice, platform guidance, Active or Paused state, and an optional rider-entered time window. Operational truth is always refreshed separately.

Multiple applicable saved preferences form one promotion cohort only from the deterministic baseline first three. They keep baseline relative order, move ahead of non-promoted baseline members, and never bring a fourth-place candidate into the automatic three-card set.

### 3.4 Map

The app provides original Day and Night network references built from public GTFS route and shape data. Day shows the broad weekday network. Night deemphasizes service not represented in the current stored night reference. Neither map claims current operations when offline; the label becomes **Reference pattern — not live**.

An online Actual-now overlay uses only accepted current train, service-change, and closure evidence. If current geometry cannot be resolved safely, it falls back to the stored reference and explains why.

### 3.5 Accessible Route Only

The toggle is persistent and explicit. It constrains station, entrance, platform, transfer, and destination choices before ranking. A candidate is eligible only when a complete reviewed street-to-street step-free chain exists and every route-critical machine has a current accepted state.

When the outage feed is not configured, unavailable, stale, or cannot be joined by exact equipment identity, the product says **Live elevator status unavailable** and does not call the route accessible now. Structural station accessibility remains visible as reference information. A rider can turn the constraint off explicitly; the app never disables it to fill results.

### 3.6 Platform guidance and crowding

Front, middle, or back guidance is shown only from a reviewed app-owned guidance record that matches station, exact direction, route pattern, destination purpose, and current platform. Each record carries verification provenance. Missing, stale, wrong-platform, or rerouted scope produces **Positioning guidance unavailable**.

The subway release always renders a capability-aware crowding row. With no current supported source, it reads **Crowding not reported for this train** and has no green/red capacity inference.

### 3.7 Commute windows

A commute window includes selected weekdays, local start and end times, saved origin scope, primary route and direction, optional destination segment, and notification preference. Evaluation begins only after the rider saves it and grants notification permission in context.

The installed product checks during supported foreground, service-worker, or periodic-sync opportunities. It notifies only for a new material episode or an independently supported escalation overlapping the saved route, direction, segment, and half-open commute window. It does not send a routine “all clear,” replay missed alerts after reconnection, or claim guaranteed background delivery where the browser does not provide it.

## 4. Executable product shape

The repository contains one TypeScript application with three explicit boundaries:

- a responsive React progressive web client for rider interaction and offline continuity;
- an Express service that owns official feed retrieval, parsing, cache coherence, and public app endpoints;
- a shared deterministic domain library that owns time, identity, health, service-change, accessibility, ranking, and arrival decisions.

Vite builds the client. Vitest exercises domain and component behavior. Playwright exercises the complete product in a real browser. Runtime data is stored in an ignored local data directory as atomic, versioned cache files; personal settings stay in the rider’s browser. No account or hosted database is required for the first release.

The client never contacts MTA feeds directly. This avoids browser cross-origin limits, keeps protobuf parsing and source credentials off the device, and gives every board one coherent server-side decision snapshot.

## 5. Official source registry

| Source | Runtime role | Retrieval behavior | Failure treatment |
|---|---|---|---|
| Regular subway GTFS | stable topology and uncovered schedule fallback | refresh at startup when missing or old; retain last validated edition | retain validated topology; never call it live |
| Supplemented subway GTFS | next-seven-day planned baseline and first fallback owner | refresh hourly; validate ZIP and required tables; retain immutable editions | use regular only outside every usable supplemented coverage mask |
| NYCT subway GTFS-RT feed groups | positive live arrival evidence, stop sequence, vehicle progress | fetch every 30 seconds with independent timeout and health per group | preserve last coherent snapshot to 180 seconds, then scoped schedule fallback |
| Subway alerts | scoped service-change evidence and rider instructions | refresh every 30 seconds; preserve source text and structured scope | unresolved material impact vetoes only the affected claim; absence is not good service |
| Subway station location/open-data record | station accessibility and direction notes | refresh on startup when old; join by exact GTFS stop identity | unknown or unjoined coverage fails closed for Accessible Route Only |
| Elevator/escalator equipment and current outages | exact machine inventory and live outages | optional configured MTA credential and endpoints; refresh each minute | structural reference may remain; current accessible-now claim is unavailable |
| App-owned guidance records | front/middle/back exit and transfer guidance | packaged, reviewed, versioned data | unmatched scope shows guidance unavailable |

The known official static URLs are `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip` and `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip`. Live feed endpoints remain configurable from one registry so an official endpoint change is not scattered through product logic.

## 6. Static-data ingestion

Each downloaded ZIP is written to a temporary file, checked for a successful response and plausible size, opened, and validated for the tables required by its role. Only then is an immutable edition promoted atomically. A failed refresh never overwrites the last good edition.

The normalizer produces compact records for routes, stops, parent complexes, trips, stop times, calendars, calendar exceptions, transfers, and shapes. It preserves raw identifiers and adds explicit normalized identities rather than mutating official values.

Supplemented coverage is decided before occurrence lookup. A usable supplemented edition owns positive schedule claims for its declared route, service date, effective interval, horizon, and supported direction scope even when a desired regular trip or stop is omitted. An omission yields no scheduled row and no unsupported cancellation claim. Regular GTFS is eligible only outside every usable supplemented mask.

## 7. Real-time ingestion and source health

Every feed group is fetched independently. The parser records retrieval time, feed-header time, content hash, entity count, covered routes, accepted trip updates, vehicle movement timestamps, and anomalies. A new snapshot is accepted only when it is complete, decodable, chronologically coherent, and not an unexplained destructive regression.

Health is route/feed-group scoped:

- **Current:** latest accepted complete snapshot age is at most 90 seconds;
- **Degraded:** age is greater than 90 seconds through 180 seconds;
- **Unavailable:** age is greater than 180 seconds, no accepted snapshot exists, or a hard fetch/validation condition blocks use.

Current health permits records to proceed through admission; it does not itself authorize a countdown. Degraded mode preserves the last coherent context with its timestamp and blocks new exact live claims. Unavailable mode may admit clearly separated schedule fallback for that exact group and direction.

## 8. Arrival truth engine

For one complex and direction, the engine evaluates a fixed decision snapshot and produces three separate areas: primary arrivals, held/uncertain trains, and explanations.

### 8.1 Primary admission

A live candidate must have:

1. a Current owning feed group;
2. one coherent current train instance;
3. the exact directional stop in its ordered remaining-stop sequence;
4. a future arrival or departure time;
5. route, destination, direction, and stop sequence that agree;
6. no scoped bypass, suspension, closure, cancellation, reroute ambiguity, or track conflict veto;
7. accepted identity and chronology;
8. plausible progress for its confidence state.

Only Live and Expected candidates consume the primary next-three. Order by predicted instant, assigned/live strength where the instant ties, normalized route identity, normalized destination, service date, canonical train identity, and canonical stop-call identity. Source or response order never breaks a tie.

### 8.2 Holding and ghost filtering

- Progress age through exactly 90 seconds can remain Live when every other gate passes.
- Progress age over 90 seconds through exactly 180 seconds becomes non-primary **Holding** and freezes the last supported time.
- Progress age beyond 180 seconds becomes **Arrival uncertain** with no exact minute when the stop remains confirmed.
- A Due state may last through exactly 60 seconds only with current progress; immediately after that, Holding is the strongest permitted state until the stricter uncertain boundary applies.
- An unusual dwell is diagnostic evidence, never deletion proof.
- A train is suppressed for the target board only when stop service becomes absent, contradicted, or materially unresolved. Suppression is not a claim that the physical train was cancelled.

### 8.3 Alerts and weekend changes

Alert scope is resolved by active interval, route, exact stop or segment, direction, trip where present, structured effect, and preserved official text. A generic affected relationship does not prove a bypass. A material unresolved reroute blocks the narrow arrival claim until an exact remaining stop sequence safely proves service.

The live remaining-stop sequence is the positive near-term service pattern. Supplemented GTFS is the planned baseline. Alerts supply current change context and negative evidence. No regular static trip can resurrect a stop excluded by live replacement data or an applicable supplemented mask.

### 8.4 Schedule fallback

Fallback starts only after the exact feed group is Unavailable. It renders Scheduled clock times, not countdowns, with **Live data unavailable**, source age, and operating service date. Current vetoes remain active. The engine uses explicit coherent future exact-stop departures from the one owning static source, orders the complete candidate list deterministically, then takes three. It never backfills a healthy or merely missing live train.

## 9. Public app service

The service exposes one versioned JSON surface:

- bootstrap metadata, app mode, source health, and server time;
- station-complex catalog and text search;
- nearby complexes for a supplied transient coordinate;
- complete station board for selected route/direction filters;
- current scoped alerts;
- map reference data and current overlay data;
- accessibility equipment status when configured;
- health and data-provenance diagnostics without personal data.

Every board response includes one decision timestamp, a stable response identity, source-health summaries, board mode, directions, primary rows, secondary held/uncertain rows, explanations, and explicit capability states. Client-side countdown display is derived only from an admitted future instant and stops advancing as soon as response freshness crosses its allowed boundary.

## 10. Offline and local state

The service worker precaches the shell and last successful app assets. Runtime caching stores the compact station catalog, original vector maps, app-owned guidance, and recent coherent board responses. A versioned browser store keeps saved stations, commute windows, display settings, and map references. Migration is explicit and failure preserves recoverable prior data.

Offline entry preserves the current station, filters, direction, map viewport, saved trip cursor, warnings, and focus target. Operational values become historical and show their individual timestamps. The app does not infer Offline merely from underground location; connectivity and successful governed retrieval determine the state.

Reconnection commits dependencies in order: accessibility path/equipment, service changes, arrivals after source recovery, positioning/transfer guidance, then background maps and unrelated saved data. A lower-priority refresh cannot erase an unresolved higher-priority warning.

## 11. Privacy, security, and resilience

- Precise coordinates are accepted only for the current nearby request, rounded in memory only as needed for computation, never logged, and never written to disk.
- Saved stations and commute windows remain in the browser by default.
- Notification content contains only the rider-saved transit scope and supported disruption; no inferred home/work labels or movement history.
- All external responses have size, type, timeout, redirect, and schema limits.
- HTML from alerts is not trusted; the app displays sanitized plain text and approved links only.
- ZIP extraction rejects traversal, duplicate critical entries, implausible expansion, and missing required files.
- Cache promotion is atomic; last-known-good editions survive partial writes and process restarts.
- API endpoints are read-only except optional local notification subscription management; request bodies and query limits are bounded.
- Diagnostics expose source freshness and reason codes, never credentials or personal settings.

## 12. Demonstration and degraded startup

Automated tests and a first launch without network use committed deterministic fixtures. The header, every arrival, and every alert in this mode carry **Demonstration data — not live**. Demonstration state cannot silently transition into live styling; a successful coherent official sync replaces it as one atomic mode change.

If static topology is available but live feeds are not, the app enters separated Scheduled fallback where eligible. If no source can support a claim, it shows **Arrival unavailable**. The rider always retains station search, saved stations, map reference, settings, and explanatory status.

## 13. Verification strategy

### 13.1 Domain tests

Deterministic fixtures cover exact 90/180-second feed boundaries, exact 60-second Due boundary, future-stop admission, skipped-stop veto, reroute ambiguity, supplemented coverage omission, regular fallback exclusion, DST/service-day chronology, duplicate identity, source-order shuffle, three-row caps, nearby ranking ties, saved-preference cohorts, complete-path failure, outage unknown state, and commute materiality.

Property-style shuffled-input tests prove output stability. A clock abstraction makes all time cases reproducible.

### 13.2 Integration tests

Recorded GTFS ZIP and GTFS-Realtime fixtures exercise download validation, parsing, cache promotion, multi-feed partial failure, alert joins, station boards, and offline bootstrap. A separate opt-in live smoke check verifies official endpoints without making the normal test suite dependent on network availability.

### 13.3 Browser tests

Playwright covers first-open location allow/deny, zero-tap nearby cards, both directions, refresh preservation, save/pause/delete, Accessible Route Only unknown and outage branches, map offline reload, commute setup, notification materiality preview, keyboard use, reduced motion, and mobile thumb-dock reach.

Accessibility checks include landmarks, heading order, names and descriptions, focus visibility, non-color state identity, 200% text zoom, 320 CSS-pixel width, and automated axe-compatible assertions where available.

### 13.4 Release checks

The release gate requires clean formatting and type analysis, all unit/integration/component/browser tests passing, a production build, a fresh-start run, an offline reload, and manual visual inspection at representative phone and desktop widths. The final handoff includes exact run and test commands, data-source configuration, known browser notification limitations, and honest capability disclosures.

## 14. Delivery sequence

1. establish the tested app shell and shared domain contracts;
2. implement static ingestion and normalized station catalog;
3. implement real-time ingestion, health, and cache coherence;
4. implement arrival truth, service-change, ghost, and fallback decisions;
5. expose versioned station, board, alert, accessibility, and map responses;
6. build the zero-tap dark-first client and saved/offline behavior;
7. add accessibility, platform guidance, crowding disclosure, and commute windows;
8. complete service-worker behavior and notification opportunities;
9. verify all boundaries, live smoke behavior, production build, and end-to-end rider flows.

Each coherent slice is committed separately with a lowercase commit subject.

## 15. Acceptance statement

This design preserves the approved product promise: show the next trains supported by current evidence, never fill uncertainty with an optimistic static guess, and keep the rider oriented when the network or phone connection becomes unreliable. It is approved as the implementation basis for the full subway-first working product.
