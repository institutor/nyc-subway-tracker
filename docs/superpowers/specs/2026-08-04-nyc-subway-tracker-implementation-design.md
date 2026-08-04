# NYC Subway Tracker Full-App Implementation Design

**Status:** Implementation draft; autonomous build authorized; product and release approval pending

**Authorization boundary:** The rider authorized autonomous implementation work on August 4, 2026. That instruction authorizes building and testing this design; it does not manufacture fixed-version review evidence, approve a governed product artifact, pass Gate 0, or authorize a public release.

**Release posture:** Trust-first, unofficial NYC subway companion; public operational surfaces remain exposure-locked until their exact governed evidence and same-version approvals pass. No MTA logo, official map artwork, or unsupported operational claim.

---

## 1. Outcome and release definition

The implementation candidate is complete when its governed capabilities work end to end in deterministic validation mode, its live source pipeline runs in non-public shadow mode, and every required exposure lock is enforced. A public release is a separate decision: only after the named gates pass may a rider open the product, allow location once, and immediately see the three closest useful subway complexes with up to three trustworthy arrivals in every passenger-serving direction. The same product must remain useful when location is denied, a feed fails, or the phone is offline.

The working release includes:

- live subway arrival ingestion and shadow decisions from all NYCT subway GTFS-Realtime feed groups, with rider-facing exposure only after Gate 0;
- regular and supplemented static GTFS ingestion with supplemented coverage ownership;
- active subway alerts and scoped service-change explanations;
- holding and uncertain train treatment based on feed and movement evidence;
- location-based nearby ranking, station search, saved stations, and deterministic personalization;
- an original day/night vector network reference generated from public GTFS geometry;
- installable offline behavior for the app shell, station catalog, saved stations, map, and last coherent boards;
- direction-aware accessibility metadata, optional current elevator/escalator outage integration, and fail-closed Accessible Route Only behavior;
- verified front/middle/back guidance where an app-owned reviewed record exists, with an honest unavailable state everywhere else;
- recurring commute-window setup and deterministic notification decisions, with silent evaluation, pilot, or delivery disabled until the commute go/no-go record authorizes the exact stage;
- responsive one-handed navigation, keyboard operation, screen-reader structure, reduced-motion support, and dark-first legibility;
- deterministic demonstration data only when live initialization cannot complete, always labeled **Demonstration data — not live**.

Subway crowding is omitted launch-wide. No surface contains a crowding module, shell, badge, legend, unavailable placeholder, typical diagram, or grey/blank/Unknown car row. No proxy is inferred from headways, delays, car model, or rider reports. A future audited capability requires the separate crowding gate and is outside this build.

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
7. scoped service and accessibility disclosures plus exact eligible positioning, with crowding omitted entirely;
8. the thumb dock in the bottom third.

Exact arrival time is the largest value. Route identity and destination are second. Source state, movement age, alert scope, and scheduled-fallback age remain visible but quieter.

### 2.3 Thumb dock

The persistent lower dock contains Nearby, Saved, Map, and Settings. A context row immediately above it contains refresh, line filter, direction focus, and reverse-trip controls when relevant. All frequent actions have at least a 44-by-44 CSS-pixel target and remain reachable without stretching to the top bar.

## 3. Product surfaces and rider flows

### 3.1 Zero-tap startup

The shell and last coherent non-location context render immediately. On the first meaningful location request, the exact purpose sentence **Use your location to show nearby subway entrances and live arrivals.** appears immediately before the browser permission prompt. A permitted result is used transiently and is not retained. Approximate location remains useful when its precision and the registered walk evidence can support the comparison.

When location is denied or unavailable, apply the fixed precedence: open the last-used station when one exists; otherwise show visible saved-station choices and wait for the rider to select one; otherwise open the bottom-anchored station picker. Recent and popular stations appear before a closed keyboard, and search opens only after **Search stations** is activated.

If a temporary location fix fails after a real last-used station exists, preserve that station and show **Location unavailable. Showing your last station.** with **Try location again** and **Choose a station**. A later location result may refresh suggestions but never silently replace an explicit rider selection.

While live data initializes, cached content retains its original timestamp and historical treatment. It never becomes visually current merely because the app reopened.

### 3.2 Nearby and station board

Nearby shows at most three station complexes only when current permitted location, exact official entrance records, entry/service eligibility, and registered practical street-walk evidence support the full comparison. Each card includes the selected useful entrance, supported practical walk, served routes, eligible accessibility scope, directions, and next arrivals. Straight-line distance, station centroids, schematic geometry, source order, and a desire to fill three cards never select or rank an entrance or complex. If practical walking evidence cannot support the comparison, the product opens the bottom-anchored station picker instead of inventing Nearby results.

The full board supports line filtering, direction focus, refresh, save, alert details, accessibility details, and map context. Filters never hide a relevant disruption warning. Fewer than three eligible arrivals is an honest result.

### 3.3 Saved stations

Saved stations work without an account. A saved record contains only exact rider intent: station and constituent, preferred entrance, normalized preferred direction with actual-destination context, route filters, the rider-controlled Accessible Route Only setting, common destination, optional rider-entered days/time window, and Active or Paused state. It never stores a platform, positioning recommendation, accessible-path result, equipment state, arrival, disruption resolution, entrance availability, walk rank, or other operational truth.

Multiple applicable saved preferences form one promotion cohort only from the deterministic baseline first three. They keep baseline relative order, move ahead of non-promoted baseline members, and never bring a fourth-place candidate into the automatic three-card set.

Opening a saved record is immediate and does not mutate it. Every route and direction refreshes, and a disruption affecting a filtered route remains visible. Only an explicit edit followed by explicit save changes the retained intent.

### 3.4 Map

The app provides original Day and Night network references built from public GTFS route and shape data. Day shows the broad weekday network. Night deemphasizes service not represented in the current stored night reference. Neither map claims current operations when offline; the label becomes **Reference pattern — not live**.

An online Actual-now overlay uses only accepted current train, service-change, and closure evidence. If Actual-now evidence becomes unsupported, preserve journey intent, context, and viewport; disable the unsupported Actual-now scope and explain it. Never switch automatically to a reference pattern. The rider must explicitly choose **Typical weekday** or **Late night**, each visibly labeled as reference rather than current operation.

Destination planning remains reachable from the bottom third. Online current journeys use only admitted stopping patterns and accepted service changes; future journeys use the applicable supplemented or regular schedule with its exact currency treatment. Offline planning uses the stored structural graph and an eligible stored schedule only as a **Reference itinerary**, never as a current arrival, reroute, equipment, or accessibility claim. Journey ranking applies validity, accessibility, disruption/transfer risk, transfers, practical walking, then arrival time in that order, followed only by the governed neutral canonical-identity comparator when all rider-relevant values tie.

Before descending, the rider may explicitly activate exactly one offline trip card. Its required core contains origin/destination and exact scope, normalized directions and actual destinations, routes and ordered legs/stations, transfer instructions, claim-scoped service and equipment context with individual last-checked times, rider-confirmed cursor, reference/service-date/currency context, admitted Scheduled clock times, and any applicable day/night pattern boundary. The visible control **I'm at this stop** changes only the manual cursor and never refreshes or rewrites operational evidence. Exit, platform-zone, and contingency modules appear only from exact eligible reviewed records and are otherwise omitted cleanly.

### 3.5 Accessible Route Only

The toggle is persistent and explicit. It constrains station, entrance, platform, transfer, and destination choices before ranking. A candidate is eligible only when an immutable reviewed complete-path package and its atomic station-direction coverage row supply every ordered street-to-street edge, endpoint and level, route/direction/platform scope, official equipment identity, official accessible-path membership, restriction, verification date, evidence reference, review disposition, stable identity, and same-version approval, and every route-critical machine has a current accepted state.

The production complete-path registry begins empty because the current coverage register contains zero eligible real rows. The functionality is exercised with synthetic validation packages, but live mode cannot produce a positive Accessible Route Only result until reviewed real records are added and the accessibility exposure gate passes. When an eligible stored structural chain exists but the outage feed is unavailable, offline copy may say exactly **Structurally step-free; live elevator status unavailable**; without that chain, the positive structural statement is prohibited. The rider can turn the constraint off explicitly; the app never disables it to fill results.

### 3.6 Platform guidance

Front, middle, or back guidance is shown only from a reviewed app-owned guidance record that matches station, exact direction, route pattern, destination purpose, platform orientation, objective, and current platform state. Each record carries immutable evidence and same-version review provenance. If the record is missing, stale, ineligible, wrong-platform, or invalidated by a reroute, the positioning claim is omitted visibly and assistively; there is no empty module or inferred zone.

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
| MTA Subway Entrances and Exits open data (`i9wp-a4ja`) | exact entrance, entry permission, complex, constituent, and GTFS-stop joins | refresh as a versioned source and retain provenance | without exact eligible entrance data, offer the station picker |
| Audited practical-walk router | pedestrian route distance/time from transient rider location to exact eligible entrances | configured adapter with bounded requests and source/version record; deterministic fixtures in validation | without supported comparable walks, offer the station picker; never fall back to straight-line ranking |
| Subway station location/open-data record | station accessibility and direction notes | refresh on startup when old; join by exact GTFS stop identity | unknown or unjoined coverage fails closed for Accessible Route Only |
| Elevator/escalator equipment and current outages | exact machine inventory and live outages | optional configured MTA credential and endpoints; refresh each minute | structural reference may remain; current accessible-now claim is unavailable |
| App-owned complete-path and station-direction evidence packages | exact reviewed street-to-street edge graph and atomic coverage rows | immutable, versioned packages with evidence links and same-version decisions; production registry initially empty | missing or ineligible row rejects the Accessible Route Only candidate |
| App-owned guidance records | front/middle/back exit and transfer guidance | packaged, reviewed, versioned data | unmatched scope omits the positioning claim and module |

The known official static URLs are `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip` and `https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip`. Live feed endpoints remain configurable from one registry so an official endpoint change is not scattered through product logic.

## 6. Static-data ingestion

Each downloaded ZIP is written to a temporary file, checked for a successful response and plausible size, opened, and validated for the tables required by its role. Only then is an immutable edition promoted atomically. A failed refresh never overwrites the last good edition.

The normalizer produces compact records for routes, stops, parent complexes, trips, stop times, calendars, calendar exceptions, transfers, shapes, exact entrances, and the structural journey graph. It preserves raw identifiers and adds explicit normalized identities rather than mutating official values. GTFS transfers alone never manufacture an accessible path or practical street walk.

Supplemented coverage is decided before occurrence lookup. A usable supplemented edition owns positive schedule claims for its declared route, service date, effective interval, horizon, and supported direction scope even when a desired regular trip or stop is omitted. An omission yields no scheduled row and no unsupported cancellation claim. Regular GTFS is eligible only outside every usable supplemented mask.

Each canonical edition retains its accepted source publication time, otherwise first successful retrieval of that distinct validated edition, plus every later retrieval as a separate observation. Future, regressed, or contradictory publication chronology quarantines the edition rather than substituting retrieval time. Re-downloading unchanged canonical content, changing a wrapper, filename, compression, or metadata never creates a new edition or resets currency age. **Current schedule** is inclusive from age zero through exactly two hours; **Stale reference** is greater than two hours through exactly 24 hours and requires **Stored schedule—service changes may differ**; greater than 24 hours, superseded scope, or out-of-coverage scope is **Topology only** and cannot emit a departure. A newer distinct validated edition supersedes an older one only inside their overlapping applicable scope. Supersession is monotonic inside that overlap: failure or expiry of the newer edition never rolls back to the earlier supplement; evaluate regular GTFS or no estimate. Outside the overlap, the older edition may remain eligible.

## 7. Real-time ingestion and source health

Every feed group is fetched independently. The parser records retrieval time, feed-header time, content hash, entity count, covered routes, accepted trip updates, vehicle movement timestamps, and anomalies. A new snapshot is accepted only when it is complete, decodable, chronologically coherent, and not an unexplained destructive regression.

Compare each candidate population with the last accepted coherent population for the same group. A loss of exactly 40% or more always triggers anomaly quarantine. A loss below 40% may still trigger when normal route population, suspicious emptiness, simultaneous group loss, malformed content, chronology, or another coherence signal makes it unsafe. Feed timestamp regression, invalid decoding, a malformed full snapshot, suspiciously empty content, and simultaneous multi-group disappearance are explicit anomaly conditions. A quarantined snapshot supplies no positive arrival or mass-cancellation inference and cannot be repaired with static service.

Health is route/feed-group scoped:

- **Current:** latest accepted complete snapshot age is at most 90 seconds;
- **Degraded:** age is greater than 90 seconds through 180 seconds;
- **Unavailable:** age is greater than 180 seconds, no accepted snapshot exists, or a hard fetch/validation condition blocks use.

Current health permits records to proceed through admission; it does not itself authorize a countdown. Degraded mode freezes every preserved countdown and shows **Live data updating**. Unavailable does not automatically admit schedule fallback.

If an invalidating anomaly occurs while prior coherent context is no more than 180 seconds old, preserve only that frozen context with **Live data updating**, block Scheduled fallback, and begin two-snapshot recovery. If recovery completes first, reevaluate live candidates without entering fallback. If the prior coherent snapshot becomes strictly older than 180 seconds first, replace preservation with the age-based fallback branch; never show both. With no prior coherent context, proven Unavailable may proceed immediately to eligible fallback.

For a previously visible train, the first accepted healthy complete snapshot absence immediately removes exact precision and the primary slot while starting internal grace; it creates no Expected, Holding, Uncertain, Scheduled, or static substitute. Hard suppression occurs at the second consecutive accepted healthy complete absence or exactly 60 elapsed seconds from the first, whichever comes first. An anomalous intervening update neither counts nor restores. After any controlling precision-loss or suppression event, the first qualifying coherent update restores nothing; only a second consecutive fresh coherent update, newer than the adverse evidence and jointly proving stable identity, plausible stop order, current movement/progress, continued exact-target service, and no unresolved service/track conflict, permits full Live readmission after every Live gate passes. Recovery never restores Expected, and a nonqualifying second update breaks the sequence.

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

Only Live and Expected candidates consume the primary next-three. Give each candidate a best estimate and supported range; the Expected ordering estimate is the range center. Establish the initial total order by best estimate, range lower bound, range upper bound, public route order (numbered numerically, lettered alphabetically, shuttles by full public name, then other identities alphabetically), normalized actual destination, and stable admitted train-instance identity.

Then apply the one narrow Live-overlap pass before taking three. Visit Live trains in initial-order sequence and move each only ahead of the maximal contiguous block of immediately preceding Expected rows whose individual ranges directly overlap that Live range. Stop at an earlier Live or first non-overlapping row and preserve every other relative position. Live receives no global confidence boost; a non-overlapping earlier Expected train remains earlier.

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

Fallback starts only when the exact feed group is Unavailable and the cause-based preservation-versus-fallback state machine admits it. It renders Scheduled clock times, not countdowns, with **Live data unavailable**, currency state and truthful age anchor, last-retrieved age, and operating service date. **Stale reference** adds **Stored schedule—service changes may differ**. Topology-only editions emit no departure.

Current vetoes and prior hard-suppression release carryover remain active. Static data cannot supply either of the two required recovery updates. The engine uses explicit coherent future exact-stop departures from the one owning static source, orders the complete candidate list deterministically, then takes three. It never backfills a healthy or merely missing live train, and never shows preserved real-time rows beside Scheduled fallback for the same board scope.

### 8.5 Equipment truth

Equipment snapshot age uses the accepted authoritative source timestamp and server decision time. **Current** is at most exactly five minutes when every structure, scope, chronology, anomaly, and exact-inventory join passes. **Degraded** is greater than five minutes through exactly 15 minutes, or a structurally usable population requires confirmation. **Unavailable** is greater than 15 minutes or any failed, malformed, incomplete, chronologically invalid, internally unusable, or unjoinable response. Degraded and Unavailable make every affected route-critical machine Unknown; a prior accepted outage remains **Out of service—status being rechecked**.

A healthy non-empty Current same-scope snapshot may support **No official outage reported** for an exact target only when valid other-equipment outages prove coherent population, the target is absent, current reviewed inventory covers the target, no prior outage awaits restoration, and no stronger veto applies. A globally zero-outage snapshot is first **Provisional empty**; only a second coherent Current zero-outage snapshot at least one authoritative minute later, with coherent surrounding population and current inventory joins, completes confirmation. A broken sequence restarts.

Population disappearance strictly greater than 50%, or candidate malformed/duplicate/unmatched records strictly greater than 10%, triggers an equipment anomaly; exact 50% and 10% do not cross the numeric trigger but contextual inconsistency may still degrade them. The equipment inventory is refreshed and reviewed daily. At exactly seven days without an accepted refresh, dependent topology and every route-critical decision become Unknown; retries do not reset age.

An accepted current adverse record clears only through an exact matched explicit restoration record or two consecutive coherent Current omissions at least one authoritative minute apart, both joined to current inventory with coherent population. One omission preserves **Out of service—status being rechecked**; any nonqualifying observation breaks the pair. Every displayed machine state carries **Checked _accepted relative age_ ago** at source-supported precision, or **Checked time unavailable** with Unavailable/Unknown. Neither **No official outage reported** nor an estimated return means Working, Available, or an accessible path.

## 9. Public app service

The service exposes one versioned JSON surface:

- bootstrap metadata, app mode, source health, and server time;
- station-complex catalog and text search;
- nearby complexes only when a supplied transient coordinate and registered practical-walk evidence support exact eligible entrances;
- complete station board for selected route/direction filters;
- current scoped alerts;
- map reference data and current overlay data;
- online and offline-reference journey planning data; active-trip capture and manual cursor updates remain device-local and never enter this service;
- accessibility equipment status when configured;
- health and data-provenance diagnostics without personal data.

Every board response includes one decision timestamp, a stable response identity, source-health summaries, board mode, directions, primary rows, secondary held/uncertain rows, explanations, and governed capability states. Client-side countdown display is derived only from an admitted future instant and stops advancing as soon as response freshness crosses its allowed boundary. No API response contains a crowding field.

The service has explicit stage locks, not one broad production switch. Public arrival boards require Gate 0 for the same product/truth package. Nearby/offline release surfaces require their Task 1–14 evidence and six-role release decision. Accessible Route Only, current equipment status, and platform guidance require their companion accepted packages. Commute processing has separate disabled, deterministic-test, silent-evaluation, pilot, and delivery stages, and cannot enter any later stage without its exact go/no-go authorization. When a stage is locked, the public endpoint omits the unauthorized operational surface; development fixtures and non-public shadow diagnostics remain distinctly labeled and inaccessible to public clients.

## 10. Offline and local state

The service worker precaches the shell and last successful app assets. Runtime caching stores the compact station/entrance catalog, structural journey graph, original vector maps, eligible app-owned evidence, and recent coherent board responses. A versioned browser store keeps saved stations, commute windows, display settings, map references, and exactly one explicitly activated trip card. Migration is explicit and failure preserves recoverable prior data.

Offline entry preserves the current station, filters, direction, map viewport, active trip cursor, warnings, and focus target. Operational values become historical and show their individual claim-scoped timestamps. The persistent message is **Offline—live arrivals, alerts, and elevator status are unavailable.** The app does not infer Offline merely from underground location; connectivity and successful governed retrieval determine the state.

The active trip card remains one device-held rider-selected trip. It preserves all required core itinerary fields and the evidence limitations captured before descent. **I'm at this stop** may advance, reverse, or complete only the rider-confirmed cursor and instruction emphasis. It cannot infer location, boarding, train motion, transfer success, service, platform, equipment, or current accessibility. Conditional exit, positioning, and contingency modules are omitted when their exact eligible owner records are absent.

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

Automated tests and an explicitly selected local validation mode use committed deterministic fixtures. The header, every arrival, and every alert in this mode carry **Demonstration data — not live**. A network failure never silently activates demonstration mode. Demonstration state cannot transition into live styling; live shadow data stays in the locked diagnostics path until its governed exposure gate passes.

If static topology is available but live feeds are not, the app enters separated Scheduled fallback only where its cause, currency, coverage, veto, and exposure gates are eligible. If no source can support a claim, it shows **Arrival unavailable**. The rider always retains station search, saved stations, map reference, settings, and explanatory status. A first offline launch with no stored official content shows the picker and content-unavailable state, not synthetic transit as reality.

## 13. Verification strategy

### 13.1 Domain tests

Deterministic fixtures cover exact 90/180-second feed boundaries, first/second/60-second entity absence, two-update recovery, anomaly preservation versus fallback, exact 60-second Due boundary, future-stop admission, skipped-stop veto, reroute ambiguity, Expected-range and Live-overlap ordering, supplemented coverage omission, schedule currency at 2/24 hours, regular fallback exclusion, DST/service-day chronology, duplicate identity, source-order shuffle, three-row caps, practical-walk/picker boundaries, saved-preference cohorts, complete-path failure, outage unknown state, active-trip manual progress, exposure locks, and commute materiality.

Property-style shuffled-input tests prove output stability. A clock abstraction makes all time cases reproducible.

### 13.2 Integration tests

Recorded GTFS ZIP and GTFS-Realtime fixtures exercise download validation, parsing, cache promotion, multi-feed partial failure, alert joins, station boards, journey planning, active-trip capture, and offline bootstrap. A separate live-shadow program verifies official endpoints without making the normal test suite network-dependent and records admitted/suppressed decisions for later-stop-progress comparison.

### 13.3 Browser tests

Playwright covers first-open location allow/deny precedence, practical-walk-backed zero-tap cards and picker fallback, both directions, exact arrival order, refresh preservation, save/pause/delete, Accessible Route Only synthetic eligible and live empty-registry branches, map/offline journey planning, active trip capture and **I'm at this stop**, locked commute stages, keyboard use, reduced motion, and mobile thumb-dock reach. It also proves the entire crowding surface is absent.

Accessibility checks include landmarks, heading order, names and descriptions, focus visibility, non-color state identity, 200% text zoom, 320 CSS-pixel width, and automated axe-compatible assertions where available.

### 13.4 Release checks

Build completion requires clean formatting and type analysis, all unit/integration/component/browser tests passing, a production build, a fresh-start run, an offline reload, exposure-lock tests, and manual visual inspection at representative phone and desktop widths. This authorizes no public operational surface.

Gate 0 additionally requires representative normal, weekend, late-night, and major-disruption replays; current-MTA shadow operation; comparison of admitted and suppressed arrivals with later stop progress; route-group health and bulk-drop validation; and a documented false-bypass incident response process. Public Nearby/offline, accessibility/equipment, guidance, maps/rights, and commute stages each remain locked until their fixed working-product evidence, applying artifacts, mandatory same-version reviewer decisions, and binary release records pass. A missing or Pending condition is NO-GO. The final handoff reports both build status and every separate exposure-gate status without conflating them.

## 14. Delivery sequence

1. establish the tested app shell and shared domain contracts;
2. implement static ingestion and normalized station catalog;
3. implement real-time ingestion, health, and cache coherence;
4. implement arrival truth, service-change, ghost, and fallback decisions;
5. expose versioned station, board, alert, journey, active-trip, accessibility, and map responses behind exact stage locks;
6. build the zero-tap dark-first client and saved/offline behavior;
7. add fail-closed accessibility and platform-guidance evaluation, keep crowding absent, and add locked commute-window stages;
8. complete service-worker behavior and notification opportunities;
9. verify all boundaries, live-shadow evidence, production build, end-to-end rider flows, and every public-exposure lock.

Each coherent slice is committed separately with a lowercase commit subject.

## 15. Acceptance statement

This design preserves the approved product promise: show the next trains supported by current evidence, never fill uncertainty with an optimistic static guess, and keep the rider oriented when the network or phone connection becomes unreliable. It is the authorized implementation draft for a full subway-first validation candidate. Product-artifact acceptance, Gate 0, capability exposure, notification delivery, and public release remain separate evidence-backed decisions.
