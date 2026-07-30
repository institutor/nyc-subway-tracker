# Nearby and offline experience contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§13, 32.2, and 34; nearby-station and offline-experience plan `Product artifact map` and Task 1 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 1 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending — Nearby Task 14 and Release 1 evidence have not been produced |

## Purpose and authority

This contract owns the four persistent product destinations, cross-surface rider-context preservation, the no-account promise, the boundary between consumed product truth and presentation, and source-to-task traceability for the nearby and offline workstream. It does not create an arrival, service-change, accessibility, equipment, positioning, schedule, notification, or release decision.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and every public label remains subject to the [rider language rules](../contracts/rider-language-rules.md). Review and lifecycle changes follow the [product artifact review and approval policy](../review-and-approval-policy.md).

The [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md) fulfills the §§14.1–14.2 startup sequence and first-use permission experience, the §28.1 functional location fallback at startup, and scenario 22. It consumes this contract's context continuity and upstream truth; it does not take ownership of arrival truth, accessibility truth, broader privacy and retention rules, or Release 1 approval.

The [station board and controls contract](station-board-and-controls-contract.md) owns the visible station-board application of §14.6 and §§15.1–15.5: compact station detail, bottom-third controls, refresh presentation, disclosures, scoped alerts, and cause-gated states. This experience contract retains cross-surface restore-first, refresh-second continuity, while Task 2 owns only the foreground lifecycle trigger. Supporting §16 visual, measured reach, contrast, assistive, and motion conformance remains with the [underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6.

The [map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, owns the Map destination's independent appearance, service-meaning, spatial-view, and overlay axes; Actual-now and reference-layer rules; reroute visualization; interaction continuity inside Map; and journey planning and ranking. This experience contract continues to own exactly four persistent destinations and the restore-first boundary across them. The map contract records specification §17 and §31.4 scenario 25 as its source provenance and marks the artifact-index reconciliation **Pending** before lifecycle advancement.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Every absent planned artifact and scenario result remains **Pending** until its own required review and observed evidence are complete. Accessibility, guidance, Task 6 rendered/measured evidence, and Task 7 walkthrough evidence remain absent. This contract makes no launch, readiness, or approval claim.

## Experience architecture

### Exactly four persistent bottom destinations

The persistent bottom navigation contains exactly four destinations, in this product order:

1. **Nearby** — the default destination and zero-tap entry to nearby station boards.
2. **Map** — **Actual now**, **Typical weekday**, and **Late night** service layers in independently selected appearance, spatial view, and overlays.
3. **Commute** — saved commute windows and actionable disruptions governed by the companion commute workstream.
4. **Saved** — stations and journeys available online or offline.

A station detail is a contextual surface opened from Nearby, Map, Saved, or an active trip. It is not a fifth persistent destination. Closing the detail returns the rider to the destination and context from which it opened.

Settings, accessibility preferences, search, station selection, and line or route filters use bottom sheets or other bottom-anchored controls. Direction, refresh, save, filtering, and primary navigation remain bottom-anchored and within thumb reach. These controls must not replace, cover permanently, or displace the primary arrival decision.

The four destinations do not transfer decision authority. In particular, the Commute destination does not make commute notification eligibility, timing, or deduplication part of the nearby/offline workstream.

### Navigation behavior

- A normal launch opens **Nearby**, never a blank search field.
- Nearby exposes the initial useful station and arrival content without search, typing, direction switching, or expansion.
- Map and Saved can open a contextual station detail without changing the selected persistent destination.
- A destination change preserves the shared rider context below unless the rider explicitly changes or resets it.
- A refresh may change evidence-supported content, but it may not silently change the rider's station, direction, filter, preference, trip progress, map appearance, service layer, spatial view, overlays, viewport, or reading position.

## Preserved rider context

Context is restored before any refresh result is applied. Refresh is second and must reconcile new truth within the restored context.

| Preserved context | Continuity rule | Narrower product owner |
|---|---|---|
| Persistent destination | Restore Nearby, Map, Commute, or Saved exactly as last chosen; Nearby remains the default only for a normal launch without a preserved destination. | This contract, Task 1 |
| Contextual station detail | Reopen the same station detail over the originating destination; do not turn it into another persistent destination. | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 |
| Selected station or station complex | Keep the rider's exact selected station or complex. New location or ranking evidence may update nearby suggestions but may not silently replace the selection. | This contract, with `docs/product/nearby-offline/saved-station-and-personalization-contract.md`, Task 11 |
| Direction | Keep the normalized rider-facing direction and actual-destination context. Refresh may update service within that direction but may not switch to the opposite direction. | `docs/product/nearby-offline/nearby-card-and-direction-contract.md`, Task 4; [station board and controls contract](station-board-and-controls-contract.md), Task 5 |
| Route filters | Preserve the rider's filters. A current disruption affecting a filtered route must remain visibly disclosed rather than silently hidden. | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 |
| Accessible Route Only | Keep the rider's hard accessibility constraint on or off as chosen. New evidence may invalidate an option, but must not turn the constraint off or substitute an unverified path. | `docs/product/nearby-offline/saved-station-and-personalization-contract.md`, Task 11; companion accessibility artifacts |
| Positioning destination | Preserve the exit, transfer, or destination for which guidance was requested. Loss of guidance evidence removes the recommendation, not the rider's destination intent. | `docs/product/guidance/positioning-rider-experience.md`, companion accessibility/guidance workstream |
| Map state and viewport | Restore appearance, explicit service layer, Schematic/Geographic view, overlay choices, highlighted route, selected station, rider-facing direction, zoom, position, opened contextual board, and return focus independently. Recenter only when the rider requests it or on the defined initial Nearby-to-Map transition when no preserved Map state exists. | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7 |
| Active-trip progress | Preserve the selected trip, current decision point, and rider-confirmed manual progress. Refresh may warn that the trip is invalid, but may not reset progress or silently replace the trip. | `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`, Task 9 |
| Scroll and reading position | Restore the same reading position within the current station, direction, map detail, or trip instruction. Insertions, removals, or refreshed values must not jump the rider to the top. | [Station board and controls contract](station-board-and-controls-contract.md), Task 5; `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 |

### Restore first, refresh second

The sequence is mandatory:

1. Reconstruct the preserved destination and contextual screen.
2. Restore station, direction, filters, Accessible Route Only, positioning destination, the complete map tuple of appearance/service layer/spatial view/overlays/selection/zoom/position/opened board, trip progress, and reading position.
3. Show the last coherent content only with its governed evidence and freshness treatment.
4. Request current truth from each authoritative owner.
5. Apply current results inside the restored context.
6. Remove or change claims that current evidence no longer supports without changing the rider's choices.
7. Offer an explicit next action when the preserved context is no longer viable.

No automatic refresh, permission result, location update, reconnection, service change, accessibility change, or guidance loss may silently mutate rider state.

## No-account contract

An account is not required for:

- Nearby stations.
- Live arrivals.
- Search.
- Saved stations.
- Offline maps.
- Accessible-route-only mode.
- Platform guidance.
- Commute windows on one device.

The same core utility remains available when location is approximate, denied, or temporarily unavailable through the governed last-used, saved-station, and station-picker fallbacks. Precise or continuous background location is not an account substitute and is not required for core arrivals.

If cross-device synchronization is offered later, it is optional. Declining an account or synchronization must not remove, delay, or weaken any capability in the no-account list. Account state never changes official arrival, service-change, accessibility, equipment, schedule, or guidance truth.

This list is an entitlement boundary, not evidence that a companion or later-release capability is enabled, covered, validated, or approved. In particular, the persistent Commute destination and no-account commute windows do not authorize commute alerts, and no-account platform guidance does not establish guidance coverage or Release 1 eligibility.

## Consumed-truth boundary

Nearby, Map, Commute, Saved, station detail, and offline trip surfaces consume governed product decisions. They may select the applicable scoped result and present it honestly; they may not recompute, weaken, strengthen, or override it.

| Consumed decision | Authoritative boundary | Required consumption | Prohibited presentation behavior |
|---|---|---|---|
| Qualified and ordered arrivals | Arrival-truth contracts, policies, and evidence records under `docs/product/arrival-truth/` and `docs/product/quality/arrival-truth-acceptance-catalog.md` | Preserve exact directional-stop scope, route, destination, evidence state, time treatment, admission result, and upstream chronological order. Show fewer than three when fewer than three qualify. | Re-admit an excluded train; reorder admitted arrivals; promote a secondary state; fill a gap with static, ambiguous, cached, or weaker evidence; or upgrade Expected, Holding, Uncertain, Scheduled, cached, degraded, or unavailable evidence to Live. |
| Service-change impact and veto | `docs/product/arrival-truth/service-change-impact-and-resolution-policy.md`, `docs/product/arrival-truth/reroute-and-track-conflict-playbook.md`, and upstream evidence | Preserve the narrowest route, direction, station, segment, train, entrance, transfer, or path scope; apply current negative evidence before positive presentation; retain the original official message where governed. | Show a train at a resolved bypassed stop; show it when stop service remains materially unresolved; widen a local impact; treat generic **Affected** as a bypass; or let a prediction, schedule, cache, or offline record clear a veto. |
| Map service meaning and journey patterns | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, consuming the linked current-service, service-date, source-precedence, and schedule-currency owners | For **Actual now**, show only supported scopes built from admitted current stopping patterns and resolved active changes; withhold unresolved scopes. For explicit reference or future planning, preserve layer-specific reference meaning, service date, effective horizon, confidence, currency, and all applicable owner-supplied vetoes. Preserve each map axis independently. | Fill an Actual-now gap with cached, regular, supplemented, stored, or reference geometry; convert Actual now to a reference layer on connectivity loss; select service meaning from phone clock, midnight, theme, or spatial view; clear a current veto; or rank an unsupported optimistic journey. |
| Arrival confidence, degradation, and fallback | Upstream feed-health, ghost, suppression/recovery, and schedule-fallback owners | Preserve Live, Expected, Holding, Uncertain, Scheduled, degraded, unavailable, frozen-context, and arrival-claim-unavailable distinctions and their primary/secondary/separate-surface treatment. | Convert a non-Live state to Live through copy, animation, countdown, ordering, color, placement, or assistive language; keep a countdown advancing while Holding or degraded; or mix Scheduled into the live next-three. |
| Accessible-path and equipment state | Companion accessibility policy, coverage, equipment, and acceptance artifacts | Treat Accessible Route Only as a hard constraint over the complete entrance-to-platform-to-destination-exit path; keep Unknown distinct from verified usable; invalidate or reroute when a required path is no longer supported. | Reduce accessibility to a station badge; turn stale, empty, failed, or missing equipment evidence into operational; disable Accessible Route Only automatically; or propose an unverified substitute. |
| Platform and positioning guidance | Companion guidance evidence, state, experience, and coverage artifacts | Show front, middle, or back only at supported precision and retain verification and certainty. Remove guidance when direction, platform, geometry, or operational path is unresolved. | Invent a platform zone, treat scheduled platform data as confirmed, keep guidance through ambiguity, or jump to another station or destination merely because guidance disappeared. |
| Offline and cached context | `docs/product/nearby-offline/offline-content-and-validity-contract.md`, Task 8, and `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 | Preserve the last coherent screen and structural reference utility with explicit offline, age, validity, and reference labels. | Present cached arrivals, alerts, reroutes, accessibility, or equipment state as current; continue a live countdown; claim current stop service; or call a stored accessible path **Accessible now**. |
| Route recognition and rights | Approved glossary, rider-language rules, and the rights decision recorded by Task 15 | Use route color plus letter or number, applicable shape, and spoken label. Keep route identity separate from current service pattern. | Use color as the only identity or state indicator, imply a normal route pattern from route identity, or publicly release protected official maps, symbols, or brand assets before rights are secured. |

### Non-negotiable integrated invariants

1. A train must never be shown at a bypassed stop.
2. A train is also absent when current evidence leaves materially unresolved whether it serves the exact stop.
3. Negative evidence defeats a positive prediction, schedule, cache, or preferred presentation.
4. Expected, Holding, Uncertain, Scheduled, cached, degraded, unavailable, and offline context never become Live through presentation.
5. Fewer than three trustworthy arrivals is an honest result; row count never authorizes backfill.
6. Offline preservation preserves context, not current operational truth.
7. Accessible Route Only remains a complete-path hard constraint and fails closed.
8. Guidance appears only at verified scope and disappears during operational or evidence ambiguity.
9. Route identity remains understandable without color.
10. Unresolved rights block public use of protected official maps, symbols, and brand assets.
11. Map appearance, service meaning, spatial view, and overlays remain independent; changing one never silently changes another.
12. Actual now never inherits cached or reference geometry when current evidence is absent or unresolved; a reference switch is deliberate.

## Cross-surface ownership

Existing owned artifacts are linked. Planned artifacts remain code text until they exist and are reviewed.

| Product decision or state | Authoritative owner | Applying surface or evidence owner | This contract's boundary |
|---|---|---|---|
| Persistent destinations and cross-surface preservation | `docs/product/nearby-offline/experience-contract.md`, Task 1 | Every nearby/offline surface | Owns continuity, not the narrower surface behavior. |
| Startup and permission fallback | [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2 | Nearby | Fulfills §§14.1–14.2, startup application of §28.1, and scenario 22 while preserving context, no-account utility, and upstream truth/privacy authority. |
| Station and entrance ranking | `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`, Task 3 | Nearby and Map | Cannot override accessibility, closure, or arrival truth. |
| Nearby cards, directions, and next-three | `docs/product/nearby-offline/nearby-card-and-direction-contract.md`, Task 4 | Nearby | Applies upstream admission and ordering without backfill. |
| Station detail, filters, and one-handed controls | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Contextual station detail | Owns visible §14.6 and §§15.1–15.5 behavior, not cross-surface continuity or truth classification. |
| Visual, route-recognition, reading, reach, and motion | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6 | Every nearby/offline surface | Visual treatment cannot imply stronger evidence. |
| Map axes, service layers, interactions, reroutes, and journey ranking | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7 | Map | Owns behavior within Map while this experience contract retains the four-destination and cross-surface continuity boundary; must distinguish Actual now from explicit reference meaning without relabeling cached or reference content current. |
| Stored content and validity | `docs/product/nearby-offline/offline-content-and-validity-contract.md`, Task 8 | Map, Saved, and offline planning | Structural reference never becomes current truth. |
| Offline trip card and manual progress | `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`, Task 9 | Saved and active trip | Progress is rider state; current validity remains evidence-owned. |
| Offline degradation and reconnection priority | `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 | Every preserved screen and active trip | Applies refreshed truth without context jumps. |
| Saved preferences and rider controls | `docs/product/nearby-offline/saved-station-and-personalization-contract.md`, Task 11 | Saved and contextual defaults | Preferences never change operational truth. |
| Location and personal data | `docs/product/nearby-offline/location-and-personal-data-rules.md`, Task 12 | Nearby, Saved, and measurement | Location ranks utility; it is not required truth evidence. |
| Usefulness and guardrails | `docs/product/nearby-offline/measurement-plan.md`, Task 13 | Product readout | Metrics cannot reward false certainty. |
| Scenario evidence | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | All Tasks 1–13 | Expected outcomes remain Pending until observed. |
| Release decision and risks | `docs/product/nearby-offline/release-1-readiness.md` and `docs/product/nearby-offline/risk-register.md`, Task 15 | Release 1 review | Cannot waive truth, accessibility, offline-honesty, privacy, or rights blockers. |
| Arrival admission, ordering, service change, confidence, suppression, and fallback | Existing upstream arrival-truth artifacts | Nearby, Station, Map, Saved, Commute | Consumed without reclassification. |
| Complete accessible paths and current equipment state | `docs/product/accessibility/complete-path-contract.md`, `docs/product/accessibility/equipment-status-policy.md`, and companion cases | Nearby, Station, Map, Saved, active trip | Consumed as a hard constraint; not reduced to a badge. |
| Platform and positioning guidance | `docs/product/guidance/platform-evidence-standard.md`, `docs/product/guidance/platform-state-and-certainty-matrix.md`, and `docs/product/guidance/positioning-rider-experience.md` | Station, Map, active trip | Consumed only at verified scope. |
| Commute alerts | `docs/product/commute/notification-eligibility-contract.md` and `docs/product/commute/notification-suppression-matrix.md` | Commute | Companion-owned; nearby context may be passed without changing alert eligibility. |

## Source–product–delivery allocation

This table is the complete source-to-task allocation for the approved specification scope named by the nearby/offline plan. “Product allocation” names the decision boundary; “Delivery allocation” names one authoritative artifact and numbered task. Existing artifacts are linked; planned paths remain code text.

| Specification source | Product allocation | Delivery allocation | Evidence or release allocation |
|---|---|---|---|
| §13.1 | Exactly four persistent destinations and contextual station detail | This contract, Task 1 | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 |
| §13.2 | Cross-surface state preservation; restore first, refresh second | This contract, Task 1 | Task 1 walkthrough and Task 14 preserved-state cases |
| §13.3 | Exact no-account capability list and optional synchronization | This contract, Task 1 | Task 14 no-account and privacy cases |
| §§14.1–14.2 | Warm launch, first-use location explanation, permission outcomes, and no-location fallback | [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2 | Task 14 scenario 22 and launch cases |
| §14.3 | Practical-walk station and entrance ranking, grouping, and accessible-mode ranking | `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`, Task 3 | Task 14 scenario 21 and ranking cases |
| §§14.4–14.5 | Initial cards, every passenger-serving direction, qualified next-three, and direction language | `docs/product/nearby-offline/nearby-card-and-direction-contract.md`, Task 4 | Task 14 scenarios 1–5 and Nearby coverage cases |
| §14.6 | Non-disruptive refresh while preserving station, direction, filter, and reading context | [Station board and controls contract](station-board-and-controls-contract.md), Task 5, owns visible station-board refresh; Task 2 owns only the foreground lifecycle trigger and context-restoration invocation; this contract governs cross-surface continuity | Task 1 walkthrough and Task 14 refresh case |
| §§15.1–15.5 | Station header, bottom-third controls, arrival rows, localized alerts, and honest empty/degraded states | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Task 14 station-board and degraded-state cases |
| §§16.1–16.6 | Decision-first hierarchy, dark-first appearance, redundant route recognition, accessible reading, reach, and motion | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6 | Task 14 underground interaction cases |
| §§17.1–17.5 | Appearance/service-pattern separation, explicit map layers, preserved interactions, geographic honesty, and journey ranking | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7 | Task 14 map, service-pattern, and scenario 25 cases |
| §18.1 | Always-available structural content and valid schedule reference | `docs/product/nearby-offline/offline-content-and-validity-contract.md`, Task 8 | Task 14 offline validity and currency cases |
| §18.2 | Complete offline trip card and manual underground progress | `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`, Task 9 | Task 14 scenarios 24 and 51 |
| §§18.3–18.4 | Explicit offline presentation, cached-value limits, prioritized reconnection, and invalidation warning | `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 | Task 14 scenario 23 and reconnection cases |
| §§26.1–26.3 | Saved context, transparent personalization, edit/delete/reset controls | `docs/product/nearby-offline/saved-station-and-personalization-contract.md`, Task 11 | Task 14 saved-state and reset cases |
| §28.1 | Location purpose, approximate and denied-permission utility, no background-location dependency, and no default movement history | [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2, fulfills startup behavior; `docs/product/nearby-offline/location-and-personal-data-rules.md`, Task 12, owns broader location purpose, retention, and control | Task 14 scenario 22 and permission/privacy cases |
| §28.2 | No nearby/offline notification prompt; permission belongs to explicit commute alert intent | Task 12 records the boundary in `docs/product/nearby-offline/location-and-personal-data-rules.md`; companion commute workstream owns notification controls | Companion commute evidence; Task 15 records the dependency |
| §28.3 | Private saved information, diagnostic separation, deletion, and reset | `docs/product/nearby-offline/location-and-personal-data-rules.md`, Task 12 | Task 14 privacy and reset cases |
| §29.2 | Warm-launch, nearby-result, immediate-control, offline-open, and useful-card targets | `docs/product/nearby-offline/measurement-plan.md`, Task 13 | Task 15 release readout |
| §§30.1–30.3 | Trusted departure north star, supporting measures, and guardrails without rewarding false certainty | `docs/product/nearby-offline/measurement-plan.md`, Task 13 | Task 15 release readout and risk review |
| §31.1 scenarios 1–5 | Apply upstream normal-service, identity, and no-static-backfill truth to Nearby | `docs/product/nearby-offline/nearby-card-and-direction-contract.md`, Task 4 | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14, referencing upstream truth evidence |
| §31.4 scenarios 21–25 | Useful entrance ranking, no-location fallback, stable tunnel state, complete offline trip, and pattern-transition explanation | Tasks 2, 3, 9, and 10 in their named artifacts; scenario 25 pattern selection and boundary explanation in the [map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, with trip-card application remaining Task 9 | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 |
| §31.7 scenarios 40–42 | Preserve upstream service-day, daylight-saving, and authoritative-clock outcomes across Nearby and offline surfaces | Upstream arrival-truth time policy; applying nearby owners in Tasks 4, 8, 9, and 10 | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14, referencing upstream truth evidence |
| §31.8 scenario 51 | Offline trip completeness without unavailable exit or platform-zone guidance | `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md`, Task 9 | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 |
| §32.2 | Release 1 capability allocation and dependency boundaries | This contract, Task 1, allocates; Tasks 2–14 specify and evidence | `docs/product/nearby-offline/release-1-readiness.md`, Task 15 |
| §33.1 | MTA-data risk: positive evidence, negative veto, fail-closed ambiguity, freshness, and correction | Upstream truth owners; `docs/product/nearby-offline/risk-register.md`, Task 15, records the experience dependency | Task 15 no-go effect |
| §33.2 | Incomplete geometry: verified, versioned, station-scoped guidance or omission | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, consumes companion guidance; Task 15 risk register records exposure | Task 14 guidance-omission cases and Task 15 no-go effect |
| §33.3 | Accessibility completeness: complete path, Unknown, no substitute, resilient alternative | Tasks 3, 8, 9, and 10 consume companion accessibility truth; Task 15 risk register records exposure | Task 14 accessibility/offline cases and Task 15 no-go effect |
| §33.4 | Map and brand rights: permission before public use; text/shape independent of color | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6, and [map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, constrain presentation; `docs/product/nearby-offline/risk-register.md`, Task 15, records rights | Unresolved rights block Task 15 |
| §33.5 | Notification-fatigue risk remains companion-owned; nearby/offline does not create alert eligibility | `docs/product/commute/notification-eligibility-contract.md` and `docs/product/commute/notification-suppression-matrix.md`; Task 15 records the dependency | Companion commute evidence; no nearby duplication |
| §34 SPD-01 | The launch is subway-first | This contract, Task 1, owns the nearby/offline subway-first boundary | Task 15 binary readiness review |
| §34 SPD-02 | Nearby station boards are the default home | This contract, Task 1; startup behavior in `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md`, Task 2 | Task 14 launch evidence |
| §34 SPD-03 | Real-time explicit stop evidence is required for a live arrival | Arrival Truth Task 5 owns exact-stop admission | Nearby Task 4 applies; Task 14 references upstream evidence |
| §34 SPD-04 | Current negative evidence vetoes an arrival | Arrival Truth Tasks 2, 5, 6, 7, and 9 own precedence, admission, service-change resolution, and suppression | Every applying nearby/offline surface consumes the veto; Task 14 references upstream evidence |
| §34 SPD-05 | Static schedules never masquerade as countdowns | Arrival Truth Task 10 owns schedule fallback, edition supersession, and currency | Nearby Tasks 4, 5, 8, and 10 preserve the supplied treatment; Task 14 references upstream evidence |
| §34 SPD-06 | A held train freezes; it is not automatically deleted as a ghost | Arrival Truth Task 8 owns hold, confidence, ghost, and recovery presentation | Nearby Tasks 4, 5, 8, and 10 preserve the supplied state; Task 14 references upstream evidence |
| §34 SPD-07 | Alerts are localized to rider consequence rather than reduced to a line-wide status | Arrival Truth Tasks 6 and 7 own narrow service-change impact and resolution | Nearby Tasks 4, 5, 7, and 10 preserve the supplied scope; Task 14 references upstream evidence |
| §34 SPD-08 | Dark mode is default, and one-handed controls stay in the bottom third | [Station board and controls contract](station-board-and-controls-contract.md), Task 5, and [underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6 | Task 14 underground interaction evidence |
| §34 SPD-09 | Offline maps and saved trips remain navigable, with live status clearly unavailable | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), `offline-content-and-validity-contract.md`, `offline-trip-card-and-progress-contract.md`, and `offline-degraded-and-reconnection-states.md`, Tasks 7–10 | Task 14 map/offline evidence |
| §34 SPD-10 | Accessible Route Only validates the complete path and fails closed | Companion accessibility workstream | Nearby Tasks 3, 4, and 7–10 consume; Task 14 references companion evidence |
| §34 SPD-11 | Platform guidance appears only at verified stations and is suppressed during operational ambiguity | Companion guidance workstream | Nearby Tasks 5, 7, and 9 consume; Task 14 references companion evidence |
| §34 SPD-12 | Subway crowding is absent until authoritative car-level data exists | Excluded and deferred from the nearby/offline release contract; companion crowding work remains later-release scope | Task 15 records exclusion and prevents an unsupported claim |
| §34 SPD-13 | Commute notifications are disruption-only and segment-aware | Companion commute workstream | Commute destination preserves the boundary; Task 15 references companion evidence |
| §34 SPD-14 | Trust and accessibility errors are release-blocking quality failures | `docs/product/nearby-offline/release-1-readiness.md` and `risk-register.md`, Task 15 | Signed Task 15 decision only; Draft completion is not approval |

## Acceptance-scenario ownership

This matrix names all Section 31 scenario groups so the nearby/offline plan neither duplicates companion logic nor silently omits a dependency.

| Scenarios | Normative owner | Nearby/offline responsibility | Evidence status |
|---|---|---|---|
| 1–5 | Arrival-truth workstream: `docs/product/quality/arrival-truth-acceptance-catalog.md` | Task 4 applies qualified arrival states and ordering; Task 14 records the visible nearby result without changing truth. | Pending — Task 14 and upstream truth evidence |
| 6–12 | Arrival-truth service-change owners | Tasks 4, 5, 7, and 10 preserve exact impact scope, vetoes, official explanations, and unaffected context. | Pending — upstream truth evidence and Task 14 derived integration cases |
| 13–20 | Arrival-truth feed, ghost, suppression, and fallback owners | Tasks 4, 5, 8, and 10 preserve confidence, degradation, disappearance, frozen context, fallback labels, and veto precedence. | Pending — upstream truth evidence and Task 14 derived integration cases |
| 21 | Nearby/offline Task 3, `docs/product/nearby-offline/station-ranking-and-entrance-rules.md` | Own useful-entrance ranking. | Pending — Task 14 |
| 22 | Nearby/offline Task 2, [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md) | Own last-used, saved, and bottom-picker no-location fallback without a blank screen; does not own scenario 21 ranking or scenario 23 tunnel preservation. | Pending — Task 14 and Release 1 evidence |
| 23 | Nearby/offline Task 10, `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md` | Own stable tunnel entry and explicit offline state. | Pending — Task 14 |
| 24 | Nearby/offline Task 9, `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md` | Own retained trip content and manual progress. | Pending — Task 14 |
| 25 | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7, with offline-trip application in Task 9 | Task 7 owns source-supported pattern selection, one-itinerary continuity, and boundary explanation; Task 9 applies it to the offline trip card without redefining the decision. | Pending — Task 14 |
| 26–32 | Companion accessibility workstream | Nearby Tasks 3, 4, 8, 9, and 10 consume exact direction/path/equipment outcomes and fail closed. | Pending — companion accessibility evidence |
| 33–35 | Companion platform-guidance and accessibility workstreams | Nearby Tasks 5, 7, and 9 consume verified orientation and accessible priority; suppress guidance during ambiguity. | Pending — companion guidance/accessibility evidence |
| 36–39 | Companion commute workstream | Commute destination consumes the companion decisions; nearby/offline does not duplicate notification logic. | Pending — companion commute evidence |
| 40–42 | Arrival-truth time owner | Nearby Task 14 verifies that every applying surface preserves service date, order, identity, and authoritative freshness. | Pending — Task 14 and upstream truth evidence |
| 43–44 and 49–50 | Arrival-truth schedule and ordering owners | Tasks 4, 8, and 10 preserve edition currency, topology-only limits, and Expected/Live ordering. | Pending — upstream truth evidence and Task 14 derived cases |
| 45–46 | Companion accessibility equipment-status owner | Nearby Tasks 3, 8, 9, and 10 consume provisional-empty and restoration outcomes without creating equipment truth. | Pending — companion accessibility evidence |
| 47 | Companion platform-guidance owner | Nearby Tasks 7 and 9 consume transfer assessment without promising a connection. | Pending — companion guidance evidence |
| 48 | Companion commute threshold owner | Commute destination consumes the result; nearby/offline does not create a notification threshold. | Pending — companion commute evidence |
| 51 | Nearby/offline Task 9, `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md` | Own a complete Release 1 offline trip without unavailable guidance. | Pending — Task 14 |

## Return-from-background walkthrough

### Starting context

The rider is in **Nearby** with a contextual station detail open. They selected one station complex, one passenger-serving direction paired with its actual destination, a route filter, and Accessible Route Only. A verified positioning destination is selected. The Map retains Dark/Light appearance, an explicit service layer, Schematic/Geographic view, overlays, highlighted route, selected station and direction, zoom, position, and contextual-board return state as independent values. An active offline-capable trip has rider-confirmed progress. The rider has scrolled to a specific direction section and arrival row.

The app moves to the background. While it is away:

- current service-change evidence establishes that one previously shown train bypasses the exact selected directional stop;
- current accessibility evidence invalidates the only previously selected complete path;
- the positioning record loses its verified operational path; and
- other arrivals and unrelated station information refresh normally.

### Required return sequence

1. Restore **Nearby** and the same contextual station detail before applying refreshed content.
2. Restore the same station, direction, route filter, Accessible Route Only setting, positioning destination intent, complete independent map tuple, active-trip progress, and reading position.
3. Keep the last coherent content only under its governed freshness treatment while current decisions arrive. Do not label preserved context Live.
4. Apply the bypass veto to the exact affected train and stop. Remove that row rather than relabeling it Expected, Holding, Uncertain, Scheduled, cached, or degraded. Do not restore it from a schedule. Keep any remaining qualified arrivals in upstream order and show fewer than three honestly.
5. Preserve the route filter while leaving the scoped service-change consequence visible. Keep unrelated routes, directions, stations, and trip steps unchanged.
6. Keep Accessible Route Only enabled. Invalidate the former path, show the governed no-verified-path or verified-alternative result, and prioritize the active-trip warning. Do not jump to another station or silently substitute a staircase or unknown equipment path.
7. Remove the unsupported positioning recommendation while preserving the rider's destination intent and station context. Offer the governed no-guidance or check-signs treatment only if its evidence owner permits it.
8. Refresh remaining arrivals, service details, and supported map content inside the restored layer and viewport without changing appearance, spatial view, overlay choices, rider selection, reading position, or manual trip progress.
9. If connectivity is unavailable while Actual now was selected, preserve that selection intent and the same screen, viewport, station, direction, route, and overlay choices, but withhold unsupported current operational geometry and claims. Cached or reference values cannot fill the Actual-now gap, clear the bypass, restore the path, restore guidance, or claim current service; a reference-layer change requires deliberate rider action and remains subject to Tasks 8 and 10.

### Required observed evidence

Task 14 must record, against a fixed reviewed version:

- the complete before-and-after context values;
- the exact refreshed arrival, service-change, accessibility, and guidance inputs;
- the removed bypassed train and absence of static or weaker-state backfill;
- the preserved filter plus visible disruption consequence;
- Accessible Route Only remaining enabled and the invalid path not being recommended;
- positioning guidance removed without changing the destination or station;
- unchanged map appearance, service-layer intent, spatial view, overlays, selection, viewport, contextual-board return state, active-trip progress, and reading position;
- the exact rider-facing explanations and assistive equivalents; and
- every prohibited-result check.

Until that observed record exists, this walkthrough remains an expected **Pending** result.

## Contract review

| Review question | Draft contract result | Required evidence before approval |
|---|---|---|
| Are there exactly four persistent bottom destinations, with station detail contextual? | Yes: Nearby, Map, Commute, Saved. | Task 14 navigation observation |
| Does every preserved state have one named continuity or narrower product owner? | Yes; see Preserved rider context and Cross-surface ownership. | Cross-artifact review after Tasks 2–13 |
| Is context restored before refresh, without silent station or direction changes? | Required by the deterministic sequence and walkthrough. | Return-from-background observed result |
| Does any capability in the approved no-account list require an account? | No. | Task 14 no-account cases |
| Can a surface re-admit, reorder, promote, backfill, or upgrade consumed truth? | No. | Task 14 truth-boundary cases and upstream evidence |
| Does Map have one named authority for independent axes, Actual-now/reference meaning, reroutes, interaction continuity, and journey ranking while this contract retains exactly four destinations and cross-surface restoration? | Yes; see the linked Task 7 contract and ownership boundary. | Task 7 fixed state matrix, walkthroughs, and Task 14 observations |
| Can offline context imply current arrivals, alerts, accessibility, equipment, or guidance? | No. | Task 14 offline and reconnection cases |
| Can an accessibility preference be disabled or weakened automatically? | No. | Companion accessibility and Task 14 integration evidence |
| Can unverified guidance or protected rights-blocked assets appear? | No. | Companion guidance evidence and Task 15 rights record |
| Does this Draft claim launch, approval, or observed scenario passage? | No. All approval and scenario evidence is Pending. | Mandatory reviews and durable scenario evidence |
