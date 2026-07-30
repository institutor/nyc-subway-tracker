# Nearby Station and Offline Experience Product Delivery Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task by task. Track every step with its checkbox, obtain the named acceptance evidence before closing a task, and make the suggested lowercase commit after each accepted task.

**Goal:** Deliver a subway-first experience that opens directly to useful nearby station boards, remains legible and operable underground with one hand, and preserves honest map, station, and trip utility when connectivity disappears.

**Source of truth:** The approved specification at `docs/superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md`, specifically Sections 13-18, 26, 28, 29.2, 30, 31.1, 31.4, 31.7, 32.2, and the related risks in Section 33.

**Scope and boundaries:**

- In scope: Nearby startup, permission fallbacks, practical station and entrance ranking, every passenger-serving direction, up to three trustworthy arrivals per direction, station-board controls and states, dark-first underground legibility, one-handed navigation, map service layers, stored reference maps, offline routing and trip cards, reconnection behavior, saved stations, location privacy, experience measurement, acceptance evidence, and Release 1 readiness.
- Arrival admission, service-change reconciliation, schedule currency, and ghost-train classification are upstream truth decisions. This plan governs how their approved results are selected, labeled, ordered, preserved, and explained; it does not redefine them.
- Complete accessible-path determination and live equipment truth are upstream accessibility decisions. This plan consumes their rider-facing state for ranking, boards, maps, offline warnings, and reconnection priority; it does not reduce accessibility to a station-level badge.
- Commute notifications, car crowding, and the editorial creation of platform-position records are outside this plan.
- Product and UX artifacts only: no code, framework, stack, API architecture, storage design, or other technical implementation choice belongs in this plan.

## Global constraints

- A normal launch must never open to a blank search field.
- Nearby must require no search, typing, direction switch, or expansion tap to expose the initial station and arrival utility.
- Show the three most useful nearby station complexes when geography permits.
- Show up to three trustworthy arrivals for every directional platform currently serving passengers; when three do not qualify, do not backfill with untrusted claims.
- Direction language must pair a rider-recognizable bound label with the actual destination or terminal.
- Dark mode is the default, while light mode remains a preference.
- Route identity must use color plus a letter or number, shape where applicable, and a spoken label; color is never the sole indicator.
- Direction, refresh, save, route-filter, and primary navigation actions must remain in the bottom third, with core tap targets at least 48 by 48 points.
- Typical weekday and late-night reference maps, saved stations, and saved trip cards must open without waiting for a network.
- Offline states must never imply that cached arrivals, alerts, reroutes, or equipment conditions are current.
- Precise or continuous background location cannot be required for core arrival utility.
- No account is required for Nearby, live arrivals, search, saved stations, offline maps, accessible-route-only mode, platform guidance, or on-device commute windows.
- Returning to a preserved screen refreshes its information without changing the rider's reading position, station, direction, or filters unexpectedly.
- Official MTA maps, symbols, and brand assets cannot be released publicly until the appropriate rights are secured.

## Product artifact map

| Product artifact | Responsibility |
|---|---|
| `docs/product/nearby-offline/experience-contract.md` | Navigation destinations, state preservation, no-account promise, and cross-artifact requirement traceability |
| `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md` | Warm launch, first-use location explanation, permission outcomes, and no-location fallbacks |
| `docs/product/nearby-offline/station-ranking-and-entrance-rules.md` | Practical-walk ranking, entrance usefulness, complex grouping, and accessible-mode ranking |
| `docs/product/nearby-offline/nearby-card-and-direction-contract.md` | Initial Nearby cards, all passenger-serving directions, next-three behavior, and direction language |
| `docs/product/nearby-offline/station-board-and-controls-contract.md` | Station header, arrival rows, alerts, filters, reverse-direction behavior, and degraded states |
| `docs/product/nearby-offline/underground-visual-and-reachability-standard.md` | Dark-first visual hierarchy, route recognition, typography, assistive reading, touch, reach, and motion |
| `docs/product/nearby-offline/map-modes-and-journey-behavior.md` | Actual-now and reference layers, map interactions, geographic honesty, and journey ranking |
| `docs/product/nearby-offline/offline-content-and-validity-contract.md` | Stored content, reference itinerary rules, service-date validity, and offline claim limits |
| `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md` | Trip-card content, contingencies, accessibility chain, and manual underground progress |
| `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md` | Offline presentation, cached-value treatment, reconnection priority, and invalidation warnings |
| `docs/product/nearby-offline/saved-station-and-personalization-contract.md` | Saved preferences, refresh behavior, contextual ordering, and rider controls |
| `docs/product/nearby-offline/location-and-personal-data-rules.md` | Permission timing, location minimization, privacy, diagnostic separation, and reset behavior |
| `docs/product/nearby-offline/measurement-plan.md` | Usefulness targets, north-star definition, supporting measures, and guardrails |
| `docs/product/nearby-offline/acceptance-evidence.md` | Scenario-level proof for approved normal, location, offline, time, reachability, and labeling behavior |
| `docs/product/nearby-offline/release-1-readiness.md` | In-scope launch gates, dependency evidence, and go/no-go decision |
| `docs/product/nearby-offline/risk-register.md` | MTA data, station geometry, accessibility completeness, map rights, privacy, and offline-staleness responses |

---

### Task 1: Lock the experience contract and traceability

**Product artifacts:**

- Create: `docs/product/nearby-offline/experience-contract.md`

**Dependencies:**

- Approved specification Sections 13, 32.2, and 34.
- No other task in this plan.

**Ordered steps:**

- [ ] **Step 1: Define the four primary destinations.** Record Nearby, Map, Commute, and Saved as the persistent bottom destinations, and state that settings, accessibility preferences, search, and line filters use bottom-anchored controls without displacing primary arrivals.
- [ ] **Step 2: Define preserved rider context.** List selected station, direction, route filters, accessible-route-only state, positioning destination, map position and scale, and active-trip progress; specify that return restores context first and refreshes second.
- [ ] **Step 3: Define the no-account contract.** Reproduce the approved list of capabilities available without an account and state that any future cross-device synchronization remains optional.
- [ ] **Step 4: Add the boundary contract.** Identify qualified arrivals, service-change impacts, accessible-path state, and verified guidance as consumed product truth; prohibit any screen from upgrading the confidence of those inputs.
- [ ] **Step 5: Add requirement traceability.** Map every in-scope source section named at the top of this plan to one product artifact and one numbered task, including the applicable Section 31 scenarios and Section 33 risks.
- [ ] **Step 6: Run a contract review.** Confirm that every preserved state has one owning artifact, no account-only dependency appears, and no product surface can silently change station or direction during refresh.

**Acceptance evidence:**

- `docs/product/nearby-offline/experience-contract.md` contains a complete source-section traceability table with no unmapped in-scope section.
- The contract includes a return-from-background walkthrough in which the rider's station, direction, filters, scroll context, and map view remain stable while content refreshes.
- The contract explicitly forbids a presentation layer from relabeling Scheduled, Holding, Uncertain, or otherwise non-Live evidence as Live.

**Suggested lowercase commit:** `define nearby offline experience contract`

---

### Task 2: Specify zero-tap startup and location-permission fallbacks

**Product artifacts:**

- Create: `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md`
- Update: `docs/product/nearby-offline/experience-contract.md`

**Dependencies:**

- Task 1 accepted.

**Ordered steps:**

- [ ] **Step 1: Write the normal-launch sequence.** Specify immediate rendering of the last coherent nearby shell, current-location request, useful-entrance ranking, loading of arrivals, local service changes, and route-critical accessibility state, followed by a non-disruptive replacement of cached content.
- [ ] **Step 2: Fix the first-use explanation.** Use the approved sentence, “Use your location to show nearby subway entrances and live arrivals,” immediately before the operating system location prompt.
- [ ] **Step 3: Define every permission outcome.** Cover precise permission, approximate permission, denial with a last-used station, denial with saved stations only, and denial with neither; put the bottom-anchored station picker, recent stations, and popular stations before the keyboard in the final case.
- [ ] **Step 4: Define temporary location failure.** Preserve the last coherent station screen, label that location is unavailable, and give a reachable next action without replacing the view with search.
- [ ] **Step 5: Define foreground return.** Refresh automatically without jumping the reading position or resetting station, direction, or filters.
- [ ] **Step 6: Add scenario walkthroughs.** Document the exact first visible content, permitted rider action, and recovery path for each permission outcome.
- [ ] **Step 7: Add cross-links.** Link the startup flow from the experience contract and record that it fulfills Sections 14.1, 14.2, 28.1, and acceptance scenarios 21-23.

**Acceptance evidence:**

- The artifact contains five permission-state walkthroughs and none ends on a blank search field.
- The denied-permission walkthrough proves that last-used, saved, and picker fallbacks work without precise or continuous location.
- The normal warm-launch walkthrough identifies the last-known shell as the first visible state and current information as a non-disruptive replacement.

**Suggested lowercase commit:** `specify zero tap startup fallbacks`

---

### Task 3: Establish useful-station and entrance ranking

**Product artifacts:**

- Create: `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`
- Update: `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md`

**Dependencies:**

- Task 2 accepted.
- Approved station, entrance, closure, accessible-path, and qualified-arrival truth are available as product inputs.

**Ordered steps:**

- [ ] **Step 1: Define “nearest.”** State that rank follows the shortest practical walk to a useful entrance, never straight-line distance to a station centroid.
- [ ] **Step 2: Define ranking evidence.** Include entrance coordinates, entry permission, constituent station and directions served, estimated street walking time, known entrance or station closures, accessible-route-only state, and availability of a trustworthy arrival in the likely direction.
- [ ] **Step 3: Define entrance usability.** Exclude an entrance from a proposed trip when it cannot admit the rider or does not serve the needed constituent station or direction; keep visible why a physically closer entrance was not selected.
- [ ] **Step 4: Define accessible-mode ranking.** Use the nearest verified accessible entrance with a complete path, not the nearest staircase, and preserve Unknown as distinct from a verified usable path.
- [ ] **Step 5: Define station-complex grouping.** Merge closely colocated constituent stations into one complex card while retaining distinct operational axes and served directions within it.
- [ ] **Step 6: Constrain personalization.** Permit time-of-day and explicit saved preferences to influence ordering only while walking distance and current usability remain visible; prohibit silently hiding a geographically closer workable station.
- [ ] **Step 7: Review ranking cases.** Compare practical outcomes for a restricted entrance, a closed entrance, a multi-axis complex, accessible mode, and a preferred saved station that is farther away.

**Acceptance evidence:**

- Each ranking case in `docs/product/nearby-offline/station-ranking-and-entrance-rules.md` names the winning station and entrance, the decisive evidence, and the visible explanation.
- The restricted-entrance case never routes a rider through a non-entry point.
- The accessible-mode case selects a verified complete path or clearly reports that no verified complete path is available.
- The grouped-complex case produces one card without collapsing distinct passenger-serving directions.

**Suggested lowercase commit:** `define useful station entrance ranking`

---

### Task 4: Define Nearby cards, all directions, and next-three behavior

**Product artifacts:**

- Create: `docs/product/nearby-offline/nearby-card-and-direction-contract.md`
- Update: `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`

**Dependencies:**

- Task 3 accepted.
- The upstream truth work supplies ordered, qualified arrivals and their evidence states.

**Ordered steps:**

- [ ] **Step 1: Define the initial result set.** Show the three most useful station complexes when geography permits, in the order established by the ranking rules.
- [ ] **Step 2: Define card content.** Require station name, approximate walking time, best entrance, route bullets, accessibility state, relevant station-specific disruption flag, and arrival sections.
- [ ] **Step 3: Define directional coverage.** Show every directional platform currently serving passengers. At an ordinary two-direction station, put both direction sections in the initial Nearby view; at a multi-axis complex, retain every axis under its own clear bound or destination heading.
- [ ] **Step 4: Define next-three selection.** Show the first three qualifying arrivals in each direction when three exist. When fewer qualify, show only those qualified arrivals plus the approved useful state; never use static or ambiguous trains merely to fill three rows.
- [ ] **Step 5: Define direction language.** Pair station-appropriate wording such as Uptown & The Bronx, Downtown & Brooklyn, Queens-bound, Manhattan-bound, or To Jamaica Center with the actual destination or terminal; reserve northbound and southbound for secondary operational use.
- [ ] **Step 6: Define small-screen priority.** Stack directional sections vertically, allow scrolling, and preserve arrival values, route, destination, and state ahead of secondary detail.
- [ ] **Step 7: Bind normal-service identity cases.** Specify that a moving qualified train displays as Live, an assigned terminal train can display as Expected before movement, a missing trip is not restored from static data during healthy real-time coverage, an identifier change does not create a duplicate row, and ambiguous identities remain absent or explicitly quarantined according to upstream truth.
- [ ] **Step 8: Review representative cards.** Evaluate an ordinary two-direction station, a multi-axis complex, a direction with exactly three qualified arrivals, and a direction with fewer than three.

**Acceptance evidence:**

- The ordinary-station walkthrough exposes both directions and their available next-three results without search, typing, switching, or expansion.
- The multi-axis walkthrough does not force intersecting service into two misleading Uptown/Downtown groups.
- Every displayed direction includes an actual destination or terminal.
- The fewer-than-three walkthrough proves that row count never takes priority over truth.
- The identity walkthroughs cover all five scenarios in Section 31.1 without a duplicate or static backfill.

**Suggested lowercase commit:** `define nearby cards and direction coverage`

---

### Task 5: Specify the station board and one-handed controls

**Product artifacts:**

- Create: `docs/product/nearby-offline/station-board-and-controls-contract.md`
- Update: `docs/product/nearby-offline/experience-contract.md`
- Update: `docs/product/nearby-offline/nearby-card-and-direction-contract.md`

**Dependencies:**

- Task 4 accepted.
- Approved localized disruption, platform-state, confidence-state, and guidance records are available as product inputs.

**Ordered steps:**

- [ ] **Step 1: Define the compact header.** Include station-complex name, route bullets, walking time, selected entrance, saved state, accessible-path summary, and localized disruption status while keeping arrivals above the fold.
- [ ] **Step 2: Define bottom-third controls.** Place direction switching, reverse direction, route filtering, refresh, save, and primary navigation within thumb reach; retain visible button equivalents for any swipe, and treat pull-to-refresh as a secondary gesture rather than the only refresh path.
- [ ] **Step 3: Define direction and filter behavior.** Make direction switching one tap, have reverse direction update both the board and positioning orientation, use official route bullets plus text, and keep a visible warning when a filter would otherwise conceal a disruption.
- [ ] **Step 4: Define decision-first arrival rows.** Order route bullet, actual destination, rounded arrival or scheduled clock time, evidence state, service exception, platform state, and verified front/middle/back guidance by rider decision value.
- [ ] **Step 5: Define row disclosure.** On selection, expose remaining stops, localized alert explanation, last movement, confidence rationale, and transfer or destination guidance without changing the selected direction.
- [ ] **Step 6: Localize alerts.** Put station closures in the header, directional bypasses beside the affected direction, train-specific delay on the train, transfer disruption in trip guidance, and elevator impact on the affected accessible path.
- [ ] **Step 7: Define freshness feedback.** Show rider-readable age such as “Updated 18 sec ago” when freshness is relevant, refresh on foreground return, and stop arrival animation or decrementing when live data becomes stale.
- [ ] **Step 8: Define empty and degraded states.** Include the five approved messages for no verified live arrivals, unconfirmed service changes, scheduled fallback, a line not serving the station, and unavailable location; pair each with exactly one useful next action.
- [ ] **Step 9: Review one-handed continuity.** Walk through switch, reverse, filter, direct refresh control, secondary pull-to-refresh, save, open map, and return-to-board actions while verifying that station, direction, filters, and reading position remain coherent.

**Acceptance evidence:**

- A control inventory in `docs/product/nearby-offline/station-board-and-controls-contract.md` identifies the bottom-third location and visible label for every core action.
- A freshness walkthrough shows readable age, automatic foreground refresh, a reachable direct refresh action, and stopped countdown behavior once data is stale.
- A filtered-route walkthrough leaves the affected disruption visible.
- Each degraded state includes one useful, reachable recovery action and no unsupported arrival.
- Reverse direction updates both arrival content and positioning orientation in the documented walkthrough.

**Suggested lowercase commit:** `specify station board thumb controls`

---

### Task 6: Set the underground visual, legibility, and reachability standard

**Product artifacts:**

- Create: `docs/product/nearby-offline/underground-visual-and-reachability-standard.md`
- Update: `docs/product/nearby-offline/station-board-and-controls-contract.md`

**Dependencies:**

- Task 5 accepted.
- Current official MTA color references are available for product review.

**Ordered steps:**

- [ ] **Step 1: Fix the glance hierarchy.** Put minutes or operational state first, then route and destination, direction and exception, platform or accessibility warning, and secondary detail.
- [ ] **Step 2: Define dark-first presentation.** Default to dark mode regardless of time of day, using a near-black background, high-contrast off-white primary text, brighter white for critical arrival values, muted treatment only for genuinely secondary information, and restrained alert colors; keep light mode as a preference.
- [ ] **Step 3: Define redundant route recognition.** Require current official color, letter or number, shape where applicable, and spoken screen-reader label; prohibit color-only route, warning, accessibility, or capacity meaning.
- [ ] **Step 4: Define large-text and assistive reading.** Preserve destinations and state labels at supported large-text sizes, use plain language before operational terms, and read each arrival in decision order, including a reroute when present; announce a blocking accessible-path change immediately without repeatedly rereading the entire screen.
- [ ] **Step 5: Define touch and reach.** Require core targets of at least 48 by 48 points, bottom-third core actions, explicit labels for destructive or mode-changing actions, visible button equivalents for gestures, and bottom sheets that preserve station context.
- [ ] **Step 6: Define restrained motion.** Permit a short direction-reversal transition and a restrained freshness indicator; prohibit perpetual train motion, stop animation when data becomes stale, and make Holding visibly stop decrementing; respect reduced-motion preferences.
- [ ] **Step 7: Establish rights review.** Record that current line colors can guide recognition but official maps, symbols, and brand assets remain blocked from public release until the appropriate MTA rights are documented.
- [ ] **Step 8: Complete five product audits.** Review arm's-length glance order, poor-light contrast, large text, route recognition without color, assistive reading order, and one-handed reach.

**Acceptance evidence:**

- The standard contains pass criteria and findings for every named audit.
- Route, direction, state, and warning meaning remains understandable when color is unavailable.
- No destination or evidence-state label is intentionally removed to accommodate large text.
- Every core action has a target size of at least 48 by 48 points and a bottom-third placement.
- Public-release criteria identify MTA rights as a blocking dependency rather than an assumed permission.

**Suggested lowercase commit:** `set underground legibility standard`

---

### Task 7: Define map service layers and journey behavior

**Product artifacts:**

- Create: `docs/product/nearby-offline/map-modes-and-journey-behavior.md`
- Update: `docs/product/nearby-offline/experience-contract.md`

**Dependencies:**

- Tasks 1 and 6 accepted.
- Approved current stopping patterns, service-change impacts, schedule reference patterns, and accessible-path states are available as product inputs.

**Ordered steps:**

- [ ] **Step 1: Separate visual theme from service pattern.** Treat dark or light as appearance and actual-now, typical-weekday, or late-night as service meaning; changing one must not silently change the other.
- [ ] **Step 2: Define the three map layers.** Actual now shows current routes, disruptions, reroutes, and closures only when online; typical weekday and late night remain explicit reference layers.
- [ ] **Step 3: Define time-spanning planning.** Select the reference pattern from the trip's departure and arrival times, preserve one itinerary across the overnight transition, and identify where its service pattern changes.
- [ ] **Step 4: Define map interaction continuity.** Center on the rider only on request or initial Nearby-to-Map transition, preserve zoom and position, open a station board from the bottom, and retain selected station and direction on return.
- [ ] **Step 5: Define route and change visualization.** Highlight a selected route's current stopping pattern, dim unrelated services, redraw a changed segment, and label skipped stations instead of relying on a text banner alone.
- [ ] **Step 6: Define accessibility overlays.** Distinguish full, partial, directional, currently blocked, and status-unknown paths without using color alone.
- [ ] **Step 7: Preserve geographic honesty.** Use the schematic view for service comprehension and a geographic view for entrance selection and walking; never present diagram distance as street walking distance.
- [ ] **Step 8: Define journey choice and ranking.** Keep destination planning secondary but bottom-third reachable; accept destinations from map, saved places, recent stations, or search; rank validity, accessibility, disruption and transfer risk, transfers, walking, then expected arrival; provide a materially different alternative when available.
- [ ] **Step 9: Define current and future journey claims.** Use admitted live stopping patterns and active service changes for current journeys; use the supplemented service pattern within its effective horizon and the regular schedule beyond it for future journeys, always retaining the approved confidence label.
- [ ] **Step 10: Review a day-to-night journey.** Verify that a trip crossing the overnight transition remains one itinerary and explains the pattern change rather than switching based only on the phone clock.

**Acceptance evidence:**

- The artifact contains an explicit distinction between appearance and service pattern.
- The actual-now layer cannot be mistaken for either stored reference layer.
- A reroute walkthrough redraws the affected segment and visibly marks skipped stations.
- A day-to-night walkthrough satisfies acceptance scenario 25 and retains the correct service-date explanation.
- Journey ranking never elevates a fragile optimistic transfer above a slightly slower, materially safer direct trip solely on arrival time.

**Suggested lowercase commit:** `define map modes and journey behavior`

---

### Task 8: Define offline content and reference-validity rules

**Product artifacts:**

- Create: `docs/product/nearby-offline/offline-content-and-validity-contract.md`
- Update: `docs/product/nearby-offline/map-modes-and-journey-behavior.md`

**Dependencies:**

- Task 7 accepted.
- Approved schedule-currency and service-date rules are available as product inputs.

**Ordered steps:**

- [ ] **Step 1: Inventory always-available content.** Include typical-weekday and late-night vector service maps, station names, routes and structural topology, entrances and exits, directional accessibility notes, equipment inventory and descriptions, saved stations and commutes, saved trip cards, and the newest validated non-superseded supplemented schedule with retrieval age and effective dates.
- [ ] **Step 2: Define offline map behavior.** Make both reference service patterns open without network waiting and label them “Reference pattern—not live.”
- [ ] **Step 3: Define offline journey eligibility.** Permit a new subway journey from the stored structural network and the most recent stored schedule valid for that service date; call it a reference itinerary.
- [ ] **Step 4: Limit offline claims.** Prohibit the reference itinerary from claiming current reroutes, live arrivals, current alerts, or current equipment availability.
- [ ] **Step 5: Apply schedule-age presentation.** Show scheduled clock times only when an approved Current or Stale stored schedule covers the service date; when stored schedule age exceeds 24 hours, use it only for topology and show no departure time.
- [ ] **Step 6: Apply accessibility wording.** Describe a newly planned offline accessible journey as “Structurally step-free,” never “Accessible now,” and keep route-critical stale equipment state Unknown.
- [ ] **Step 7: Review availability cases.** Cover valid current reference data, valid stale reference data, more-than-24-hour-old data, service-date mismatch, and no stored schedule.

**Acceptance evidence:**

- The inventory in `docs/product/nearby-offline/offline-content-and-validity-contract.md` contains every item listed in Section 18.1.
- Typical-weekday and late-night maps both have an explicit offline open path with no live implication.
- Every availability case states whether topology, a clock time, and an accessibility claim may be shown.
- No more-than-24-hour-old or service-date-mismatched schedule produces a departure time.

**Suggested lowercase commit:** `define offline content validity`

---

### Task 9: Specify the offline trip card and manual progress

**Product artifacts:**

- Create: `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`
- Update: `docs/product/nearby-offline/offline-content-and-validity-contract.md`

**Dependencies:**

- Task 8 accepted.
- Verified exit, platform-zone, accessible-path, and contingency guidance may be included only when supplied by their owning product truth.

**Ordered steps:**

- [ ] **Step 1: Define when the trip card is captured.** Save the active trip for underground use before the rider descends and keep it available without an account or connection.
- [ ] **Step 2: Define required trip content.** Include origin, destination, direction, station sequence, transfer instructions, last-checked service and equipment status, and one or two previously verified contingencies.
- [ ] **Step 3: Define conditional guidance.** Include exit and platform-zone guidance only when verified and available in the current release; include accessible entrance and elevator chain whenever relevant to the chosen path.
- [ ] **Step 4: Define manual progress.** Provide a visible “I'm at this stop” control, keep prior and next stop context, and never require underground location to advance.
- [ ] **Step 5: Define stale-context treatment.** Keep last-checked times attached to service and equipment information and prevent manual progress from making those conditions appear refreshed.
- [ ] **Step 6: Review a transfer trip.** Walk through loss of service before boarding, manual advancement through stops, transfer instructions, a verified contingency, and destination arrival.
- [ ] **Step 7: Review an accessible trip.** Confirm that the complete stored entrance and elevator chain remains readable while its operational status is clearly last-checked or Unknown.

**Acceptance evidence:**

- The transfer-trip walkthrough retains stops, transfer instructions, verified exit guidance, and manual progress, satisfying acceptance scenario 24.
- The accessible-trip walkthrough preserves the structural chain without claiming stale equipment is operating.
- Manual advancement changes trip position only; it does not alter the last-checked time or convert reference information into live information.

**Suggested lowercase commit:** `specify offline trip card progress`

---

### Task 10: Define offline, degraded, and reconnection states

**Product artifacts:**

- Create: `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`
- Update: `docs/product/nearby-offline/station-board-and-controls-contract.md`
- Update: `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`

**Dependencies:**

- Tasks 5, 8, and 9 accepted.

**Ordered steps:**

- [ ] **Step 1: Fix the persistent offline message.** Use “Offline—live arrivals, alerts, and elevator status are unavailable.”
- [ ] **Step 2: Preserve the last coherent screen.** Keep the current station, direction, map position, trip progress, and readable content when service disappears; do not blank or replace the screen with search.
- [ ] **Step 3: Define cached-value presentation.** Stop live countdown behavior, show approved scheduled clock times only under the validity rules, label cached live values with last-checked time, mark route-critical stale elevator state Unknown, and label offline maps as reference patterns.
- [ ] **Step 4: Define degraded-but-connected states.** Distinguish unavailable live data with scheduled fallback, no verified arrivals, unconfirmed stopping pattern, unavailable location, and a line not serving the station; give each one useful next action.
- [ ] **Step 5: Fix reconnection priority.** Refresh route-critical elevators and accessible paths first, active service changes second, current arrivals third, positioning and transfer context fourth, and background maps or unrelated saved stations last.
- [ ] **Step 6: Define invalidation warnings.** When refreshed information breaks the active trip, warn before the last verified accessible or operational decision point whenever possible and state the changed consequence.
- [ ] **Step 7: Review tunnel entry and recovery.** Start from a live station board, lose connectivity, use the preserved screen and trip card, reconnect, and observe prioritized updates without a station, direction, or progress reset.

**Acceptance evidence:**

- The tunnel walkthrough satisfies acceptance scenario 23 and documents a stable current screen plus explicit offline state.
- No cached arrival continues to decrement or retain an unlabeled Live implication.
- The reconnection walkthrough visibly follows the approved five-step priority.
- A trip invalidated by a restored connection produces a decision-point warning before unrelated content refreshes.

**Suggested lowercase commit:** `define offline recovery states`

---

### Task 11: Define saved stations and rider-controlled personalization

**Product artifacts:**

- Create: `docs/product/nearby-offline/saved-station-and-personalization-contract.md`
- Update: `docs/product/nearby-offline/experience-contract.md`
- Update: `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`

**Dependencies:**

- Tasks 1, 3, 5, and 10 accepted.

**Ordered steps:**

- [ ] **Step 1: Define saved-station memory.** Retain preferred entrance, preferred direction, relevant route filters, accessible-route-only state, and common destination for verified platform guidance.
- [ ] **Step 2: Define open behavior.** Restore saved context immediately, refresh all routes, and retain visible disruption indicators for routes a filter would otherwise hide.
- [ ] **Step 3: Define offline behavior.** Open the saved station without network waiting, preserve its structural information, and apply the same cached-value and reference labels as other offline screens.
- [ ] **Step 4: Define contextual ordering.** Permit time-of-day and explicitly saved preferences to reorder cards while keeping distance and current usability visible; never silently hide a closer workable station.
- [ ] **Step 5: Define rider control.** Allow inspection, editing, pause where applicable, and deletion of saved preferences; provide a clear reset that does not alter official arrival or disruption truth.
- [ ] **Step 6: Review saved-state continuity.** Open a saved station online, change direction, go to Map, lose connectivity, return through Saved, reconnect, and verify coherent context and honest freshness.

**Acceptance evidence:**

- The saved-state walkthrough preserves entrance, direction, filters, accessible-route-only state, and common destination.
- A hidden-route disruption remains visible after saved filters restore.
- Personalization affects ordering and defaults only; it cannot change arrival evidence, service-change impact, or accessibility truth.
- Deletion and reset remove the rider preference without deleting official operational information.

**Suggested lowercase commit:** `define saved station controls`

---

### Task 12: Establish location and personal-data rules

**Product artifacts:**

- Create: `docs/product/nearby-offline/location-and-personal-data-rules.md`
- Update: `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md`
- Update: `docs/product/nearby-offline/saved-station-and-personalization-contract.md`

**Dependencies:**

- Tasks 2 and 11 accepted.

**Ordered steps:**

- [ ] **Step 1: Limit location purpose.** Use location to rank nearby entrances and stations; state that core arrivals do not require continuous background location.
- [ ] **Step 2: Define data minimization.** Allow approximate location, do not retain movement history by default, and keep last-used and saved-station fallbacks fully functional.
- [ ] **Step 3: Protect saved information.** Treat saved stations and commutes as private by default and provide clear deletion and reset controls.
- [ ] **Step 4: Separate quality analysis from identity.** Collect only minimum diagnostic information needed for feed and product quality and keep operational train-quality analysis separate from rider identity.
- [ ] **Step 5: Constrain notification permission.** State that Nearby, maps, saved stations, and offline trips never trigger a notification prompt; that prompt belongs only after a rider saves a commute or explicitly enables an alert, explains the disruption-only default, and exposes per-commute pause, schedule, severity, restoration, and accessibility controls in the companion commute experience.
- [ ] **Step 6: Review permission choice parity.** Compare precise, approximate, and denied permission journeys and identify the utility available in each without pressuring the rider to broaden access.

**Acceptance evidence:**

- The artifact contains a purpose, retention, rider-control, and fallback rule for every location or saved-preference use.
- The denied-location journey remains usable through last-used, saved, or station-picker paths.
- No continuous background-location dependency or default movement-history retention appears.
- The quality-measurement rules can be followed without linking train-quality analysis to rider identity.

**Suggested lowercase commit:** `establish location privacy rules`

---

### Task 13: Define usefulness measurement and trust guardrails

**Product artifacts:**

- Create: `docs/product/nearby-offline/measurement-plan.md`
- Update: `docs/product/nearby-offline/location-and-personal-data-rules.md`

**Dependencies:**

- Tasks 2-12 accepted so that each measure has an approved rider outcome.

**Ordered steps:**

- [ ] **Step 1: Define the north-star outcome.** Use Trusted departure decision rate: the share of arrival-view sessions in which the rider receives a current, coherent, boardable option without a later known contradiction before the train reaches the station.
- [ ] **Step 2: Define usefulness timing.** Measure last-known station shell visibility against 0.5 seconds on a typical warm launch; current nearby stations and first trustworthy arrivals against two seconds at median and four seconds at the 95th percentile when feeds and location are healthy.
- [ ] **Step 3: Define interaction and offline targets.** Require direction switch, route filter, and station change to respond immediately from the rider's perspective; require offline maps and saved trips to open without network waiting; seek three useful nearby cards when geography permits.
- [ ] **Step 4: Define supporting measures and ownership.** Include time to first useful arrival, share of launches requiring search, nearest-card engagement, Live versus Holding versus Scheduled exposure, service-change suppression and later outcome, ghost false-positive and false-negative rates, alert localization, accessible-route validation and reroute success, offline trip-card opens and completion, platform-guidance coverage and correction, and commute-push actionability and mute rate; identify platform, commute, and upstream truth measures as companion-owned without dropping them from the product readout.
- [ ] **Step 5: Define guardrails and ownership.** Include bypassed arrivals, Scheduled mistaken for Live, known-outage accessible invalidation, excessive alert suppression, notification opt-out after a non-actionable push, location denial after the value explanation, loss of preserved context, and cached content mistaken for current; identify the commute guardrail as companion-owned.
- [ ] **Step 6: Define review segments.** Compare permission state, foreground versus warm launch, online versus reconnecting versus offline, ordinary versus multi-axis station, accessible-route-only state, and typical-weekday versus late-night journey.
- [ ] **Step 7: Apply privacy constraints.** For every measure, document the minimum product event or aggregated observation needed, its rider value, and why train-quality analysis does not require rider identity.
- [ ] **Step 8: Define the release readout.** Specify how timing, utility, and guardrail findings are summarized for go/no-go without treating faster but untrustworthy presentation as success.

**Acceptance evidence:**

- Every usefulness target in Section 29.2 appears verbatim or with unchanged meaning in `docs/product/nearby-offline/measurement-plan.md`.
- Every measure has a rider-outcome definition, numerator or observable outcome, denominator or review population where applicable, required segment, and privacy limit.
- The readout cannot improve the north-star result by showing an unqualified arrival or removing a degraded-state label.

**Suggested lowercase commit:** `define nearby offline measurement`

---

### Task 14: Build the acceptance evidence set

**Product artifacts:**

- Create: `docs/product/nearby-offline/acceptance-evidence.md`
- Update: every product artifact created in Tasks 1-13 with a link to its applicable acceptance cases

**Dependencies:**

- Tasks 1-13 accepted.
- Upstream truth and accessibility plans supply the states consumed by the relevant board cases.

**Ordered steps:**

- [ ] **Step 1: Create the evidence format.** For every case, record source requirement, rider precondition, starting screen, action, expected visible result, prohibited result, reviewed artifact, and observed disposition.
- [ ] **Step 2: Add normal-service cases 1-5.** Cover moving Live, assigned Expected then Live, absent scheduled trip during healthy replacement coverage, identifier continuity without duplication, and quarantined ambiguous identity.
- [ ] **Step 3: Add location and offline cases 21-25.** Cover entrance-based ranking, denied-location fallback, stable tunnel entry, complete saved trip with manual progress, and a weekday-to-late-night itinerary that explains the pattern change.
- [ ] **Step 4: Add time cases 40-42.** Cover after-midnight service date, daylight-saving change without duplication or reordering, and a phone-clock difference that does not distort authoritative freshness.
- [ ] **Step 5: Add Nearby coverage cases.** Prove zero-tap launch, three useful complexes when available, all passenger-serving directions, three qualified arrivals when available, fewer-than-three honesty, multi-axis headings, actual destinations, and preserved state on refresh.
- [ ] **Step 6: Add underground interaction cases.** Prove dark-first launch, route recognition without color, large-text retention, assistive decision order, reduced motion, bottom-third controls, 48-by-48-point targets, one-tap direction switch, and visible gesture alternatives.
- [ ] **Step 7: Add offline and reconnection cases.** Prove instant weekday and late-night maps, topology-only behavior after the 24-hour boundary, structurally step-free wording, stale elevator Unknown, persistent offline messaging, reconnection priority, and active-trip invalidation warning.
- [ ] **Step 8: Add saved and privacy cases.** Prove saved-state continuity, hidden-route disruption visibility, preference reset, approximate-location utility, denied-location parity, no background-location dependency, and private-by-default saved information.
- [ ] **Step 9: Review time ordering.** Verify that after-midnight and daylight-saving cases retain correct service order and identity while phone-clock skew does not reclassify freshness.
- [ ] **Step 10: Close evidence gaps.** Reject any case whose visible result depends on an unlabeled cached claim, a color-only distinction, a centroid-only station rank, a hidden direction, or a network wait for stored content.

**Acceptance evidence:**

- `docs/product/nearby-offline/acceptance-evidence.md` contains all 13 numbered source scenarios in Sections 31.1, 31.4, and 31.7 plus the derived Nearby, underground, offline, saved, and privacy cases named above.
- Every case identifies an expected visible result and a prohibited result.
- Every product artifact in Tasks 1-13 links to at least one case, and every case links back to an approved source requirement.
- Any failed truth, accessibility, offline-validity, or rights case remains a release blocker; it is not converted into a softer presentation claim.

**Suggested lowercase commit:** `add nearby offline acceptance evidence`

---

### Task 15: Complete Release 1 readiness and risk review

**Product artifacts:**

- Create: `docs/product/nearby-offline/release-1-readiness.md`
- Create: `docs/product/nearby-offline/risk-register.md`
- Update: `docs/product/nearby-offline/experience-contract.md`

**Dependencies:**

- Tasks 1-14 accepted.
- Companion arrival-truth and accessibility work has produced evidence for the inputs this experience consumes.
- MTA brand and map rights status is available to the release reviewer.

**Ordered steps:**

- [ ] **Step 1: Define in-scope launch gates.** Require accepted Nearby boards, station details and localized states, dark-first one-handed behavior, typical-weekday and late-night stored maps, structural offline routing, saved stations, offline trip cards with manual progress, schedule fallback presentation, and direction-aware accessibility presentation.
- [ ] **Step 2: Record external product dependencies.** Link accepted evidence for truth hierarchy, service-change reconciliation, ghost handling, schedule fallback, complete accessible paths, and live equipment status without restating or weakening their guarantees.
- [ ] **Step 3: Review MTA data limitations.** Record the product response to optional station alert metadata, changing alert language, identifier mismatch, between-snapshot reroutes, and incomplete supplemented schedules: positive evidence, negative vetoes, failed-closed ambiguity, visible state and freshness, and conservative quality review.
- [ ] **Step 4: Review station geometry and accessibility completeness.** Keep platform-relative guidance verified and versioned, omit it when evidence is incomplete, validate complete accessible paths, preserve Unknown, reject unverified substitutes, and favor paths with fewer single points of failure.
- [ ] **Step 5: Review map and brand rights.** Require documented permission before public use of protected official maps, symbols, or brand assets; retain readable text and shape independently of official color.
- [ ] **Step 6: Review privacy and offline-staleness risk.** Confirm no default movement history, no continuous background-location requirement, private saved data, explicit cached age, and no current operational claim from offline reference content.
- [ ] **Step 7: Produce the release readout.** Summarize acceptance disposition, usefulness timing, guardrails, unresolved risks, rights status, and companion-plan dependencies as a binary go/no-go recommendation.
- [ ] **Step 8: Apply the stop rule.** Record no-go whenever a false bypass arrival, unlabeled fallback, hidden passenger-serving direction, known-outage accessible recommendation, offline-live implication, missing critical acceptance evidence, or unresolved brand-rights dependency remains.

**Acceptance evidence:**

- `docs/product/nearby-offline/release-1-readiness.md` links every in-scope Release 1 capability to accepted scenario evidence and an owning artifact.
- `docs/product/nearby-offline/risk-register.md` records likelihood, rider consequence, approved product response, owner, evidence, and release effect for each named risk without substituting unsupported certainty.
- The final recommendation is binary, cites the exact blocking evidence when no-go, and cannot waive a truth, accessibility, privacy, offline-honesty, or rights blocker through copy changes alone.

**Suggested lowercase commit:** `complete nearby offline release review`

---

## Completion check

This plan is complete only when all 15 task gates are accepted, every artifact in the map exists, all in-scope source sections have traceability, every named acceptance case has observed evidence, all suggested commits remain lowercase, and the Release 1 readout reaches a defensible go decision without weakening the approved truth or accessibility contracts.
