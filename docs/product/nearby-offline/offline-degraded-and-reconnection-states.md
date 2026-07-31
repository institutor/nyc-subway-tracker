# Offline, degraded, and reconnection states

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§18.3–18.4 and §31.4 scenario 23; nearby-station and offline-experience plan `Product artifact map` and Task 10 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 10 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; OFF-T23 tunnel entry and recovery, the exact five-stage reconnection sequence, active-trip invalidation warning, and Nearby Task 14 evidence are absent |

## Purpose and authority

This contract owns entry into the rider-visible global Offline state after the governing connectivity result becomes Offline, the persistent Offline presentation, cross-surface preservation of the last coherent screen, cached and historical value treatment, reconnection priority, and active-trip invalidation warnings. It consumes the stored-content and validity decisions in the [offline content and validity contract](offline-content-and-validity-contract.md), the five connected cause-gated states in the [station board and controls contract](station-board-and-controls-contract.md), and active-card and manual-progress behavior in the [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md).

This contract does not derive platform connectivity, define an offline-entry debounce or delay, create route/feed health, decide location availability, resolve a service change, admit or recover an arrival, create schedule currency, validate an accessible path, determine equipment state, infer rider movement, replan a trip, verify an alternative, define personal-data retention, produce acceptance evidence, or approve release. Arrival Truth and companion accessibility, guidance, privacy, and operations owners retain those decisions.

The [artifact index](../artifact-index.md) registers §§18.3–18.4 and §31.4 for this artifact. The [review and approval policy](../review-and-approval-policy.md) governs its lifecycle and mandatory review. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. OFF-T23 and every recovery and warning result below are expected behavior with status **Not run — Pending**. No fixed product version, observed tunnel run, companion approval, Privacy decision, Operations decision, or Task 14 evidence is recorded. Expected prose is not observed evidence or release permission.

## Governance reconciliation and mandatory review

The artifact header and Draft [artifact index](../artifact-index.md) row register Product, Accessibility, Data Quality, Content, Privacy, and Operations. The review policy requires Privacy because this contract preserves and presents active-trip and manual-progress personal travel context, and Operations because it controls blocking operational and accessibility invalidation warnings during recovery.

| Governance question | Current record | Required disposition |
|---|---|---|
| Registered reviewer set | Product, Accessibility, Data Quality, Content, Privacy, Operations | Reviewer routing is reconciled in the artifact header and Draft index row. |
| Applicable policy minimum | Product, Accessibility, Data Quality, Content, plus Privacy and Operations | All six roles must review the same fixed version. Privacy reviews preserved personal travel context; Operations reviews warning, correction, and recovery behavior. |
| Review evidence | Pending | Privacy, Operations, and every other mandatory reviewer must decide on the same fixed version before advancement from **Draft**. |

This reviewer-routing reconciliation does not invent approval or satisfy any recovery evidence requirement.

## Independent state domains

Offline is a global connectivity state. It is not a sixth connected station-board state, a route/feed-health result, a location result, a service-change resolution, or a manual-progress result. The domains below may change independently.

| State domain | Authoritative input and rider meaning | What this contract does | Never infer |
|---|---|---|---|
| Global connectivity | The governing platform connectivity result says network-dependent sources cannot currently be reached. | Enter or leave the global Offline presentation and preserve surface state. | One failed route/feed group, one missing arrival, one unresolved alert, tunnel location failure, stale GPS, or stored-content availability does not by itself mean Offline. |
| Route/feed health | Arrival Truth supplies Current, Degraded, or Unavailable for each route/feed group. | While connected, defer to Task 5's exact cause-gated presentation; while Offline, freeze affected cached claims without changing their owning health result. | Offline does not mark every feed Degraded or Unavailable. One Unavailable feed does not make the product Offline or degrade another Current group. |
| Location | Task 2 and Task 5 distinguish a current location result from the preserved or rider-selected station. | Preserve the station and any location-state context without replacing either. | A tunnel location failure does not imply connectivity loss; Offline does not imply **Location unavailable. Showing your last station.** |
| Service-change resolution | Arrival Truth supplies resolved, unresolved, scoped, and veto results. | Preserve the last accepted scoped claim offline and apply fresh vetoes at reconnection stage 2 before arrivals. | Connectivity loss does not resolve a stopping pattern, and connectivity return does not clear a veto. |
| Manual progress | Task 9 records only the rider-confirmed trip cursor, emphasis, and completion. | Preserve it through Offline and all reconnection stages. | Manual progress implies neither location, train movement, connectivity, feed health, service, transfer success, nor freshness. |

A tunnel may cause global connectivity loss, location loss, both, or neither. Each result uses its own owner and presentation. The product never uses the tunnel setting itself as a proxy for any state.

## Global Offline entry and persistent presentation

When the governing global connectivity result becomes Offline, enter the rider-visible Offline state on that result and apply the rules in this contract. No additional debounce, dwell, grace period, retry count, timeout, or delay threshold is approved. This contract does not invent one, and failure of one request or one route/feed group cannot substitute for the governing global result.

Display this exact persistent banner:

**Offline—live arrivals, alerts, and elevator status are unavailable.**

The banner:

- remains visible and equivalently available to assistive technology across Nearby, station board, Map, active trip, Saved, Commute, and contextual surfaces for the full global Offline state;
- remains present while the rider navigates, opens stored content, changes manual progress, or changes a compatible presentation control;
- does not become a full-screen replacement, a search prompt, a route/feed-health label, a location explanation, or proof that every cached claim is equally old; and
- ends only when the governing global connectivity result leaves Offline. Its removal does not restore Live, current-alert, or current-equipment semantics; each domain still passes its own ordered recovery.

Stored content opening successfully does not clear the banner. Conversely, a connected product with an Unavailable feed, unavailable location, or unresolved service change does not show the Offline banner.

## Last-coherent-screen preservation

Offline entry preserves the last coherent screen before it changes any current-data presentation. The preservation unit is the complete rider context, not merely a route or station identifier.

| Surface | State preserved across Offline entry and reconnection | Required Offline change | Prohibited replacement |
|---|---|---|---|
| Nearby and station board | Current station complex, selected direction, route filters, Accessible Route Only setting, selected entrance, saved state, open row or disclosure, scoped warnings, scroll position, focus, and reading position | Freeze every cached live value immediately and apply claim-specific historical treatment below | Blank screen, search, default station, guessed direction, cleared filter, top-of-board jump, closed disclosure, or hidden warning |
| Map | The complete map tuple of appearance, service-layer intent, spatial view, overlays, selection, highlighted route, zoom, position, opened board, direction, focus, and reading context | Preserve the tuple and visible geographic/schematic pose; Actual-now intent may remain selected as intent but cannot retain an active Actual-now claim | Recenter, reset zoom, reset appearance or spatial view, choose a new station, activate Actual now, or auto-select Typical weekday or Late night |
| Active offline trip card | The same active card, origin, destination, direction, ordered legs and stops, transfers, retained warnings and contingencies, complete path context when applicable, manual cursor, prior/current/next emphasis, completion state, scroll, focus, and reading position | Keep all claims bounded by their original times and Task 8 validity; keep manual progress usable | Card replacement, progress reset, inferred movement, automatic contingency, silent replan, or newly selected trip |
| Saved, Commute, and contextual surfaces | The selected item and any already governed station, direction, filter, trip, map, scroll, focus, and reading context | Keep readable stored content available under the same claim limits | Blank shell, forced search, default destination, reset, or network-wait replacement for device-held content |

Never blank the current screen, replace it with search, clear station or direction, reset filters, reset the map tuple, recenter the map, reset active-trip or manual progress, move scroll or reading position to the top, move focus to a default control, or auto-select a reference pattern. If a preserved claim later becomes invalid, keep its context long enough to present the exact scoped warning; do not erase the decision context that explains the warning.

## Cached and historical value treatment

All cached operational values become historical at Offline entry. A value's original accepted claim-specific last-checked time in New York local time remains attached to that exact route, direction, station, segment, trip, machine, connection, path, alert, or guidance claim. Never replace those individual times with screen-capture time, card-capture time, Offline-entry time, foreground time, retry time, phone time, or one batch **Last checked** value.

| Retained value | Required Offline presentation | Prohibited presentation |
|---|---|---|
| Former Live arrival or countdown | Freeze immediately. Stop decrementing, animation, and every active Live visual or spoken semantic. If the frozen historical value remains readable, attach its original claim-specific New York last-checked time and make clear it is historical, not a current arrival. | Advancing minute, **Live**, unlabeled frozen minute, **Updated now**, phone-clock age, restored row from static data, or implied current boardability |
| Former Expected, Holding, or Uncertain arrival context | Preserve only the last coherent owner-supplied disposition and exact scope as historical context with its own New York last-checked time; no time treatment may advance. | Promotion, countdown, exact minute for Uncertain, current confidence implication, or recovery from cache |
| Cached alert or service-change consequence | Retain the exact original scope, consequence, and New York last-checked time as historical context. An absent cached alert proves nothing current. | **Good service**, current-resolution claim, widened scope, cleared veto, or hidden retained consequence |
| Equipment observation and accessible path | A historical observation may remain with its exact machine, connection, path scope, and original New York last-checked time. A last-known adverse owner-supplied outage may retain exact **Out of service—status being rechecked** while current route-critical operation remains **Unknown**. Missing, empty, or stale data never implies restoration. Show **Structurally step-free; live elevator status unavailable** only when Task 8's complete exact stored-chain condition passes. | **Working**, restored, current outage absence, **Accessible now**, one-elevator path inference, optimistic substitute, or missing Unknown state |
| Current schedule eligible under Task 8 | A covered clock time may appear only after Task 8's exact selector and every retained veto pass. Keep **Scheduled**, Current schedule, truthful anchor context, effective coverage, and operating service date. | Countdown, Live/Expected, current stopping-pattern claim, age reset, regular-GTFS invention, or veto clearing |
| Stale reference eligible under Task 8 | A covered clock time may appear only through the exact Stale reference branch. Keep **Scheduled** and exact **Stored schedule—service changes may differ** with the truthful anchor, coverage, and service-date context. | Normal-looking schedule, omitted stale copy, countdown, current service claim, or borrowed service date |
| Topology only because age is greater than 24 hours or the claim is superseded or outside effective, service-date, departure, or horizon coverage | Preserve only the structural result Task 8 permits and show no departure or arrival time. | Currency upgrade, timed **Reference itinerary**, **Scheduled**, borrowed time, inferred service, or a replacement regular-GTFS departure |
| Quarantined schedule evidence or no eligible stored schedule | Quarantined evidence has no currency state or time. Independently valid stored structure may remain available, but show no departure or arrival time and do not label the quarantined record Topology only. | Repaired anchor, currency state, timed **Reference itinerary**, **Scheduled**, borrowed time, inferred service, or replacement regular-GTFS departure |
| Stored map | Open only after deliberate rider selection of Typical weekday or Late night and show exact **Reference pattern—not live.** wherever mistaken-current risk exists. | Automatic reference selection, reference geometry under Actual now, current reroute/alert/equipment meaning, or network wait for stored content |

Task 8's state boundaries apply exactly: Current schedule at `0 ≤ age ≤ 2 hours`; Stale reference at `2 hours < age ≤ 24 hours`; Topology only when age is greater than 24 hours, the edition is superseded for the claim, or the claim is outside effective, service-date, departure, or horizon coverage. Unusable canonical validation, chronology, publication-time, or anchor evidence is **Quarantined**, with no currency state, departure, or timed itinerary; it is not relabeled Topology only. Offline passage can only weaken a claim. If authoritative comparison cannot support the current age decision, withhold the time.

For any affected route/feed scope, the product shows either visibly frozen historical live-row context or a separately eligible **Scheduled** board after the owning fallback decision replaces that context—never both. Frozen live rows and **Scheduled** rows must never be mixed in the same affected scope.

## Integration with the five connected board states

Task 5 remains the sole owner of the following exact five connected cause-gated state messages, their exact cause gates, their single in-state actions, and their action results:

1. **No verified live arrivals in this direction.**
2. **Service change—arrivals are hidden until the stopping pattern is confirmed.**
3. **Live data unavailable. Showing scheduled times.**
4. **This line is not serving this station right now.**
5. **Location unavailable. Showing your last station.**

This contract consumes those five states without renaming one, adding a sixth, changing a cause gate, adding an in-state action, or using global connectivity as their cause. During global Offline, the persistent banner is a separate cross-surface state. A Task 5 component may remain visible only as part of the preserved last coherent screen with its original scope and historical context; Offline entry does not newly trigger or reactivate its connected cause gate.

## Exact five-stage reconnection order

Connectivity return starts conservative recovery; it does not make any claim current. Preserve the screen, banner-independent historical labels, active card, and manual progress while requesting, resolving, and presenting the following stages in this exact order:

| Stage | Refresh scope | Completion rule before the next stage | Required rider protection |
|---|---|---|---|
| 1 | Route-critical elevators and complete accessible paths for the active trip | The accessibility and equipment owners accept a fresh exact-path result or supply their governed Unknown, unavailable, incomplete, or invalid result. | Keep route-critical equipment Unknown until accepted fresh evidence supports otherwise. Retain a dated last-known adverse outage as **Out of service—status being rechecked**; missing, empty, or stale recovery data never restores it. If the active path is invalidated, present the blocking warning before stage 2 or any unrelated change. |
| 2 | Active service changes affecting the trip | Resolve each applicable route, direction, station, segment, leg, transfer, bypass, suspension, closure, reroute, short-turn, cancellation, and track-conflict result through its owner, or fail closed under the owner's unresolved state. | Apply every negative veto and scoped consequence before any arrival can return. If the active trip is invalidated, present the blocking warning before stage 3 or any unrelated change. |
| 3 | Current arrivals for the active trip and preserved board scope | Satisfy the owning route/feed-health recovery and train-admission rules, then reevaluate every row from current accepted evidence. | **One fresh arrival snapshot restores nothing.** Under the current Task 5 recovery contract, only the full owner-required recovery sequence can restore route/feed eligibility; no prior row, countdown, or order revives automatically. |
| 4 | Positioning and transfer context for the active trip | Accept only guidance that remains verified for the recovered route, direction, platform, path, and operational result. | Remove incompatible historical guidance rather than attaching it to changed service. Preserve the rider-confirmed manual cursor and never treat it as location or transfer proof. |
| 5 | Background maps and unrelated saved stations | Refresh only after every applicable active-trip stage and any resulting blocking warning have been presented. | Do not let background freshness, map updates, or unrelated saved content move focus, reset the current surface, or obscure active-trip risk. |

A lower-priority stage does not request, commit, or present rider-visible recovery ahead of an earlier applicable stage. An earlier stage is not considered complete because a request returned; its governing owner must accept a fresh result or supply the appropriate fail-closed state. Reconnection creates no new timeout, retry-count, or delay threshold.

Service-change vetoes always apply before current arrivals. A fresh arrival cannot override an unresolved stopping pattern, bypass, closure, track conflict, or hard suppression. Reconnection never resets station, direction, filters, the map tuple, active-trip selection, manual progress, scroll, focus, or reading position.

## Active-trip invalidation warning

An accepted result at reconnection stages 1–4 invalidates the active trip when it makes the stored accessible path, service pattern, train choice, transfer, platform/positioning guidance, or another required decision unusable or no longer verified. The product then presents a blocking warning before any lower-priority or unrelated refresh changes the rider's screen.

The warning must:

- identify exactly what accepted fact changed and retain its owning evidence state;
- state the exact affected trip scope—route, direction, station, segment, leg, transfer, entrance, passage, platform, machine, connection, or path as applicable;
- state the concrete rider consequence for the active trip without widening it to an unaffected scope;
- be presented before, and identify, the last verified accessible or operational decision point before the affected choice whenever owner-supplied trip structure and the rider-confirmed cursor make that possible;
- retain the accepted claim's New York last-checked or verification time and the active card's unchanged manual-progress context; and
- expose only an alternative supplied and verified by its owning service, accessibility, or guidance authority.

The warning interrupts unrelated visual change and is available to assistive technology before focus can move to lower-priority refreshed content. If no owner-verified alternative exists, the product says no verified alternative is available for the exact affected scope; it does not guess. If the last verified decision point cannot be established, warn immediately in the preserved current context and do not invent one.

Never silently replan, auto-activate a contingency, auto-select an alternative, change the rider's service pattern, clear a warning, dismiss the active card, or reset manual progress. Choosing an owner-verified alternative requires an explicit rider action and creates a separately governed trip decision; the warning itself makes no replacement.

### Non-invalidation and warning-persistence boundaries

An operational change invalidates the active trip only when its authoritative owner establishes that a required route, path, service, transfer, or decision is unusable or no longer verified. Conservative presentation does not invent a stronger event:

| Accepted or missing result | Required treatment | Prohibited escalation |
|---|---|---|
| Optional positioning guidance is lost while the underlying route and path remain valid | Remove the unsupported positioning guidance and preserve the trip, route, path, and manual cursor. | Trip or route invalidation, inferred platform change, replan, or progress reset |
| An ETA changes while the route, stop service, path, and trip remain valid | Apply the accepted time treatment through its arrival owner without invalidating the path. | Path invalidation, accessibility change, cancellation, or alternate-trip selection |
| No arrival is currently verified | Use the owning no-verified-arrival or unavailable presentation for its exact scope. | Cancellation, line absence, bypass, or trip invalidation without owner evidence |
| An official accessibility alternative exists but its complete exact path is not verified | Keep **Accessibility not confirmed** and do not present it as an owner-verified replacement. | Accessible-now claim, silent substitution, or direction to use the alternative |

Never direct a rider already underway to exit at a station whose required accessible exit path is unavailable, inaccessible, or not verified. Preserve the current trip context and present only the exact owner-supplied safe action or verified alternative; if neither exists, say no verified alternative is available for that scope.

A blocking warning remains until the rider takes an explicit governed action that resolves or replaces the affected decision, or the owning domain accepts evidence that resolves the exact invalidation. Acknowledgement alone, time passage, navigation, foregrounding, lower-priority recovery, or unrelated refresh never clears it.

## OFF-T23 expected tunnel and recovery walkthrough

OFF-T23 applies approved-specification §31.4 scenario 23 and the Task 10 tunnel/recovery evidence requirement. It is an expected Draft fixture, not an observed pass.

| Walkthrough field | Expected result |
|---|---|
| Starting state | A live station board is open for one exact station and direction with route filters, Accessible Route Only state, one admitted Live row, a complete map tuple, an active trip card, rider-confirmed progress, and preserved scroll, focus, and reading position. Every operational claim has its own authoritative New York last-checked time. |
| Tunnel entry | The governing global connectivity result becomes Offline. The product enters Offline on that result with no additional debounce or delay and shows exact **Offline—live arrivals, alerts, and elevator status are unavailable.** across the preserved surface. A simultaneous location failure remains a separate location result and is not used as the Offline cause. |
| Stable screen | Station, direction, filters, selected entrance, map tuple, active card, manual cursor, warnings, disclosure, scroll, focus, and reading position remain unchanged. The product does not blank, open search, reset, recenter, choose another station, or auto-select a reference map. |
| Historical treatment | The Live countdown freezes immediately and loses active Live semantics. Each retained cached arrival, service, alert, equipment, path, or guidance claim keeps its own original New York last-checked time. Route-critical equipment is Unknown; a dated last-known adverse outage may remain as **Out of service—status being rechecked**, and missing, empty, or stale data never implies restoration. Any deliberately opened stored map shows **Reference pattern—not live.** |
| Stored schedule branch | An affected scope keeps either its frozen historical rows or, only after the owning fallback decision replaces them, a Task 8-eligible separated **Scheduled** board. A Stale reference keeps **Stored schedule—service changes may differ**; Topology only shows no departure time. Frozen live and Scheduled rows never mix in that scope. |
| Underground trip use | The active trip opens without network waiting. The rider may use **I'm at this stop**; only prior/current/next emphasis and rider-confirmed completion change. Claims, times, warnings, validity, and the selected trip do not change. |
| Reconnection stage 1 | Connectivity returns, but no current claim is restored. Route-critical equipment and the complete path refresh first. In the invalidation branch, accepted evidence establishes that one required elevator makes the active path unusable; a blocking warning identifies the exact machine, path, leg, consequence, and last verified decision point before any lower-priority refresh and, whenever possible, before the rider reaches that last verified decision point. No unverified alternative appears. |
| Reconnection stage 2 | After the warning is presented, active service changes refresh. Every applicable veto is resolved or fails closed before any arrival is evaluated; the trip is not silently replanned. |
| Reconnection stage 3 | Current arrivals refresh third. The first fresh coherent arrival snapshot restores nothing. Only the owning full recovery sequence can restore route/feed eligibility, after which every train passes all current admission gates rather than reviving the cached row. |
| Reconnection stages 4–5 | Verified positioning and transfer context refresh fourth without resetting the manual cursor. Background maps and unrelated saved stations refresh fifth without moving focus or changing the preserved active surface. |
| Final preserved result | The same station, direction, filters, complete map tuple, active card, manual progress, scroll, focus, and reading position remain. Only owner-accepted results change their exact claims, and the blocking invalidation remains until explicit governed rider action or accepted resolving evidence addresses the exact invalidation. |
| Prohibited result | Offline inferred from location or one feed; extra Offline-entry delay; blank/search/reset/recenter; auto-selected reference map; advancing or active-Live cached row; batch or phone-clock last-checked time; frozen live mixed with Scheduled; current elevator inference; arrival restored by one snapshot; arrival before service-change veto; warning after unrelated refresh; vague or widened consequence; silent replan; unverified alternative; or progress reset |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version product observation, assistive output, companion truth, all mandatory decisions, and Nearby Task 14 evidence are absent |

## Ownership and pending evidence

| Decision | Authoritative owner | Task 10 consumption | Current disposition |
|---|---|---|---|
| Global Offline entry presentation, exact banner, preservation, cached-value treatment, reconnect order, and invalidation-warning orchestration | This contract, Task 10 | Own the rider-visible cross-surface behavior without creating underlying domain truth. | Draft; OFF-T23 and Task 14 Not run — Pending |
| Five connected cause-gated board states and their single in-state actions | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Consume unchanged; Offline is not a sixth state or a cause gate. | Draft; Task 14 Not run — Pending |
| Stored eligibility, Task 8 Current/Stale/Topology rules, **Scheduled**, exact stale copy, reference-map copy, and offline accessibility wording | [Offline content and validity contract](offline-content-and-validity-contract.md), Task 8, consuming Arrival Truth | Apply exactly; do not recompute, rename, strengthen, or clear a veto. | Draft; five availability cases and Task 14 Not run — Pending |
| Active-card fields, contingencies, claim-specific times, and manual progress | [Offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9 | Preserve exactly through Offline and recovery; never reset or use progress as evidence. | Draft; trip walkthroughs and Task 14 Not run — Pending |
| Connectivity detection, route/feed recovery, service-change resolution, arrival admission, complete paths, equipment, positioning, transfer guidance, and verified alternatives | Their platform, Arrival Truth, accessibility, and guidance owners | Consume accepted results in priority order; fail closed and never manufacture a result. | Companion approvals and fixed-version evidence absent |
| Personal-data rules and observed Nearby/offline cases | Task 12 and `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Preserve current boundaries; do not define retention or claim observed evidence. | Draft artifacts present; observed evidence and same-version approval Pending |

## Scenario traceability

| Source requirement | Expected Task 10 result | Current evidence |
|---|---|---|
| §18.3 Offline presentation | Exact persistent banner, stable last coherent screen, frozen cached values with claim-specific New York times, Task 8 schedule limits, route-critical equipment Unknown, exact map and accessibility wording | **Not run — Pending** |
| §18.4 Reconnection | Exact five-stage recovery with accessibility first, service-change vetoes before arrivals, active context before background content, and a blocking scoped invalidation warning | **Not run — Pending** |
| §31.4 scenario 23 | OFF-T23 keeps the current screen stable and enters explicit Offline state through tunnel loss and ordered recovery | **Not run — Pending** |
| Task 10 acceptance evidence | No advancing or active-Live cache, visible five-stage order, no one-snapshot restoration, warning before unrelated refresh, and no context or progress reset | **Not run — Pending**; Nearby Task 14 evidence ledger is present, but observations and same-version approval remain Pending |

All observations must use the same fixed product version reviewed by Product, Accessibility, Data Quality, Content, Privacy, and Operations. A written expectation, screenshot without state provenance, or unrecorded conversation is not scenario or approval evidence.

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Is global Offline separate from route/feed health, location, service-change resolution, manual progress, and Task 5's five connected states? | Yes by contract; not observed. | State-domain transition fixtures, including tunnel location loss and one-feed outage |
| Does Offline entry add any debounce, delay, timeout, or retry threshold? | No. | Platform-state transition observation against the fixed version |
| Is exact **Offline—live arrivals, alerts, and elevator status are unavailable.** persistent on every surface while Offline? | Required here; not rendered. | Visual and assistive OFF-T23 observations |
| Are station, direction, filters, complete map tuple, active trip, manual progress, scroll, focus, and reading position preserved without blank/search/reset/recenter/automatic reference selection? | Required here; not observed. | Cross-surface before/after state comparison |
| Does every cached claim retain its own original New York last-checked time while live countdowns freeze immediately and lose active Live semantics? | Required here; not observed. | Claim-level time and assistive-output comparison |
| Can missing, empty, or stale equipment data imply restoration, or can a dated last-known adverse outage lose **Out of service—status being rechecked** before accepted fresh evidence? | No. | Offline and stage-1 adverse-equipment recovery fixtures |
| Are Task 8 Current, Stale, Topology only, and Quarantined rules, **Scheduled**, **Stored schedule—service changes may differ**, **Reference pattern—not live.**, and **Structurally step-free; live elevator status unavailable** preserved exactly? | Yes by consumption; not observed. | Task 8 fixed availability and quarantine fixtures plus OFF-T23 |
| Can frozen live rows and Scheduled rows appear together in one affected scope? | No. | Offline board and fallback-transition observation |
| Does reconnection follow the exact five stages with service-change vetoes before arrivals and no restoration from one fresh arrival snapshot? | Required here; not observed. | Ordered event and rendered-state trace |
| Does an active-trip invalidation block unrelated refresh, state exact scope and consequence, warn before the last verified decision point when possible, avoid silent replanning, and show only owner-verified alternatives? | Required here; not observed. | Fixed invalidation branches with owner provenance and assistive output |
| Do positioning loss, an ETA change, no verified arrival, and an unverified accessibility alternative remain bounded without invented route invalidation, cancellation, or unsafe exit direction? | Yes by contract; not observed. | Fixed non-invalidation and underway-accessibility branches |
| Can acknowledgement, time passage, navigation, or unrelated refresh clear a blocking warning? | No; only explicit governed rider action or accepted evidence resolving the exact invalidation can clear it. | Warning-persistence transition trace |
| Are station, direction, filters, map tuple, active trip, manual progress, scroll, focus, and reading position unchanged after recovery? | Required here; not observed. | OFF-T23 final tuple comparison |
| Are Privacy and Operations routing aligned between the artifact and Draft index row? | Yes; neither role has approved this artifact. | Same-version decisions from all six mandatory reviewers |
| Does this Draft claim Gate 0 passage, OFF-T23 passage, companion approval, Privacy or Operations approval, Task 14 evidence, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed evidence, all mandatory reviews, and the later release gate |
