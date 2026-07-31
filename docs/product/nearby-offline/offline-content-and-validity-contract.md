# Offline content and validity contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§18.1, 18.3, 31.4, and 31.8; nearby-station and offline-experience plan Product artifact map and Task 8 Product artifacts, Ordered steps, and Acceptance evidence; Task 8 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; both offline map-open paths, the five availability cases, scenarios 43–44 and 49, and Nearby Task 14 evidence are absent |

## Purpose and authority

This contract owns which structural and reference content remains available without a connection, whether a stored map or newly planned offline reference itinerary may open, the offline application of schedule validity, the exact offline map honesty copy, and the claim limits for stored content. It applies the independent map state and continuity in the [map modes and journey behavior contract](map-modes-and-journey-behavior.md).

This contract does not create schedule edition identity, validation, chronology, age, currency, service-date coverage, supersession, a current stopping pattern, a service-change decision, an accessible path, equipment state, trip-card freshness, reconnection priority, asset rights, acceptance evidence, or release approval. The [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md), [schedule currency boundary cases](../arrival-truth/schedule-currency-boundary-cases.md), [time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md), and [source role and precedence matrix](../arrival-truth/source-role-and-precedence-matrix.md) own schedule and service-date truth. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

The [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns active-card capture and completeness, claim-attached last-checked treatment, contingencies, and manual progress. Task 10 owns the persistent global offline message, preserved-screen degradation, reconnection priority, and recovery behavior. Task 14 owns observed Nearby/offline acceptance evidence. Tasks 9, 10, and 14 now exist as Draft artifacts; their reviewer decisions and observed evidence remain Pending, and this contract does not pre-approve them.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Companion complete-path, Accessible Route Only, equipment, accessibility-copy, Task 9, Task 10, and Task 14 artifacts now exist as Drafts, but their same-version approvals and observed evidence remain Pending. Schedule truth remains Draft/Pending, both map-open paths and all five cases below are **Not run — Pending**, and map and brand rights are unresolved. Expected contract prose is not observed evidence or public-release permission.

### Provenance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on specification §§18.1, 18.3, 31.4, and 31.8 plus full Task 8 provenance; Task 10 retains §18.4 reconnection ownership. The separate Privacy-review question remains unresolved, and all reviewer decisions, scenario evidence, and lifecycle advancement remain **Pending**.

## Always-available inventory

Every listed item opens from device-held content without waiting for a network request. “Stored” means structural or reference utility only; it never means cached current truth.

| Stored content | Minimum retained scope | Offline use | Claim boundary |
|---|---|---|---|
| Typical-weekday vector service map | Rights-cleared route identities, station order, transfers, and structural pattern needed to render the explicit Typical weekday layer | Open and navigate the named reference pattern immediately | No Actual-now, current reroute, closure, alert, arrival, or equipment meaning |
| Late-night vector service map | Rights-cleared route identities, station order, transfers, and structural pattern needed to render the explicit Late night layer | Open and navigate the named reference pattern immediately | Phone time never selects it automatically and the pattern is not current service |
| Station names and route identities | Rider-recognizable station or complex name; route letter or number, applicable shape, and spoken label | Identify stations and routes without color alone | A route identity does not prove its current or proposed stopping pattern |
| Structural topology | Station order, transfers, normal structural relationships, and explicit pattern distinctions | Support map comprehension and an untimed structural path | Topology never creates a stop call, departure, service-date promise, current change, or complete path |
| Entrances and exits | Exact stored entrance or exit identity, location, entry restriction, constituent station, served route and direction, and known structural relationship | Support geographic orientation and exact stored path context | Presence or proximity does not prove entry permission, current availability, platform connection, or accessibility |
| Station and directional accessibility notes | Exact constituent station, route, direction, entrance, platform, passage, restriction, and verification context supplied by the companion owner | Explain structural, partial, and directional limits | A station badge, partial note, or one elevator never becomes a complete accessible-path claim |
| Equipment inventory, descriptions, and connections | Official equipment identity; description; physical endpoints and levels; served routes and directions; official-path membership; operating restrictions; and verification context | Explain which machines structurally connect the stored path | Inventory is not an operational status; every route-critical machine is Unknown offline |
| Saved stations and commutes | Rider-saved station or commute identity and applicable stored context | Open the saved structural context without an account or connection | Saved context cannot preserve a current arrival, alert, reroute, or equipment state |
| Saved trip cards | The last device-held card and its separately governed content | Open the saved card without a connection | The [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns capture, completeness, claim-attached last-checked treatment, contingencies, and manual progress; Task 8 owns stored presence and reference eligibility only |
| Applicable supplemented schedule records | Every retained validated supplemented record that remains non-superseded for at least one supported claim, including an earlier edition still eligible outside a later edition's overlap | Evaluate a proposed service-date and departure claim only through the deterministic selector below | No record is eligible merely because it is stored, newest by retrieval order, recently retrieved, or optimistic |

### Required supplemented-schedule record

For every retained supplemented record, preserve:

- canonical schedule-content identity;
- validation result and source-supported edition chronology;
- source publication time when supplied, including its acceptance or quarantine result;
- first successful retrieval time when publication time is genuinely unavailable;
- latest successful retrieval observation;
- accepted age anchor and truthful currency age;
- effective coverage and operating service-date coverage;
- proposed-departure coverage and horizon;
- claim-scoped supersession relationships, including overlap boundaries; and
- the owner-supplied Current schedule, Stale reference, Topology only, or quarantine disposition for the exact claim.

A retrieval wrapper, filename, compression, source label, metadata wrapper, or later observation is not a new currency edition. Storage retains enough history to prevent age reset, supersession rollback, and loss of an earlier edition that is still eligible outside a later edition's overlap.

## Offline map-open contract

Opening either stored map is a deliberate rider choice. Loss of connectivity never selects a reference layer, and a stored reference layer never appears under **Actual now**.

| Offline open path | Rider action | Immediate visible result | Preserved context | Prohibited result | Evidence status |
|---|---|---|---|---|---|
| Typical weekday | Select **Typical weekday** from Map, Saved, or another governed stored-content entry | Open the rights-cleared vector pattern without network waiting; show **Typical weekday** and exact **Reference pattern—not live.** in the layer control, map legend, route detail, station context, and equivalent assistive label wherever mistaken-current risk exists | Dark/Light appearance, Schematic/Geographic view, compatible overlays as structural reference only, route, station, direction, zoom, position, contextual board, accessibility preference, and return focus | Network spinner, automatic selection after connectivity loss, reference geometry beneath Actual now, Live styling, current reroute/alert/closure/equipment implication, map reset, or rights-uncleared protected asset | **Not run — Pending** — rendered offline open, assistive output, fixed stored asset, rights disposition, and Task 14 observation are absent |
| Late night | Select **Late night** from Map, Saved, or another governed stored-content entry | Open the rights-cleared vector pattern without network waiting; show **Late night** and exact **Reference pattern—not live.** in the layer control, map legend, route detail, station context, and equivalent assistive label wherever mistaken-current risk exists | Dark/Light appearance, Schematic/Geographic view, compatible overlays as structural reference only, route, station, direction, zoom, position, contextual board, accessibility preference, and return focus | Network spinner, selection merely because the phone clock is late, automatic selection after connectivity loss, reference geometry beneath Actual now, Live styling, current overnight-service/equipment implication, map reset, or rights-uncleared protected asset | **Not run — Pending** — rendered offline open, assistive output, fixed stored asset, rights disposition, and Task 14 observation are absent |

**Actual now** remains unavailable without accepted online/current evidence. Preserve the rider's Actual-now intent and complete map tuple, but do not keep an active Actual-now layer, put a reference pattern beneath that label, or switch layers without deliberate rider action. Task 10 will own the persistent global offline state around this preserved context.

## Deterministic stored-schedule eligibility

Task 8 applies, but never redefines, the schedule owner's decision. For each proposed operating service date and departure:

1. Start only with a canonical supplemented currency edition whose validation, source chronology, and age anchor were accepted by the schedule owner.
2. Apply claim-scoped supersession before age. Inside overlapping effective and service-date coverage, only the later validated edition may remain a supplemented candidate. Outside that overlap, an earlier edition may remain the newest eligible supplement within its own coverage when it passes every other gate.
3. Require exact effective coverage, service-date coverage, proposed-departure coverage, and horizon eligibility. Never borrow another service date, infer service at midnight, or extend coverage.
4. Quarantine any supplied publication time that is future by any positive amount, regressed, or contradictory. Do not substitute first or latest retrieval, clamp age to zero, or assign a currency state.
5. When an accepted publication time exists, use it as the age anchor. Only when publication time is genuinely unavailable may first successful retrieval anchor the distinct validated edition. A later identical retrieval updates **Last retrieved** only and never resets age.
6. Apply the first matching non-overlapping state after validation, anchor acceptance, coverage, and supersession:

| Currency result | Inclusive boundary and controlling condition | Stored offline departure use |
|---|---|---|
| **Current schedule** | `0 ≤ age ≤ 2 hours`, including exactly age zero and exactly 2 hours; validated, non-superseded for the claim, and inside effective, service-date, departure, and horizon coverage | May support a scheduled clock time for the exact claim, subject to every retained veto and claim limit |
| **Stale reference** | `2 hours < age ≤ 24 hours`, including exactly 24 hours; validated, non-superseded for the claim, and inside effective, service-date, departure, and horizon coverage | May support a visibly stale scheduled clock time for the exact claim with the Arrival Truth copy **Stored schedule—service changes may differ**, subject to every retained veto |
| **Topology only** | `age > 24 hours`, or the edition is superseded for the claim, or the claim is outside effective, service-date, departure, or horizon coverage | Structural topology only; no departure, arrival time, or timed itinerary |
| **Quarantined** | Supplied publication time is future by any positive amount, regressed, or contradictory, or required canonical validation/chronology/anchor evidence is unusable | No departure, currency state, or timed itinerary; do not repair the timestamp from retrieval evidence |

7. Apply every retained current or effective bypass, suspension, closure, planned-pattern exclusion, short turn, cancellation, unresolved reroute, invalidating track conflict, and hard-suppression carryover before showing a stored scheduled time. Offline passage and a schedule record cannot clear a veto or satisfy live recovery.
8. Show a scheduled clock time only from a stored supplemented record that is **Current schedule** or **Stale reference** for that exact service-date and departure claim and passes every veto. Never show a countdown.

Offline passage only weakens a claim: time can move Current schedule to Stale reference, Stale reference to Topology only, or an unresolved evidence state to no timed result. It cannot make an edition younger, reset an anchor, undo supersession, clear a veto, restore a hard-suppressed claim, or strengthen structural reference into current truth. If authoritative comparison cannot support the age decision while offline, withhold the timed claim.

### Edition identity and supersession

| Edition event | Stored decision | Prohibited decision |
|---|---|---|
| Canonical trips, stop times, service calendars, and effective semantics are unchanged; only wrapper or retrieval observations change | Retain one currency-edition identity, original accepted anchor, supersession edges, and truthful age; update latest retrieval separately | New edition, age reset, Current relabel, invented chronology, or removed supersession |
| Distinct changed canonical content and source-supported later chronology pass validation | Create a distinct later edition; supersede earlier editions only for claims in overlapping effective and service-date coverage | Retrieval-order chronology, merged editions, or network-wide supersession |
| Later validated edition overlaps earlier edition | Use only the later eligible edition inside overlap, even when the earlier record is younger-looking or more optimistic | Cherry-pick or roll back to the earlier edition inside overlap |
| Proposed claim is outside the overlap but inside the earlier edition's still-valid coverage | Retain and evaluate the earlier edition as the newest eligible supplement when every other gate passes | Extending the later edition's supersession beyond its overlap |
| Purported new edition fails validation or chronology | Keep it ineligible; retain the last validated record and continue aging it from the unchanged anchor | Erase the retained record, create supersession, reset age, or assume the failed content valid |

Section 18.1 guarantees stored supplemented schedule records, not a stored timed regular-GTFS schedule. Therefore regular GTFS does not silently become an offline departure source when a stored supplement is unavailable, ineligible, quarantined, Topology only, or invalid for the service date. Use untimed structural utility unless a future governed contract explicitly stores and validates an eligible regular schedule for offline departure claims.

## Reference-itinerary contract

**Reference itinerary** is the exact label only for a journey newly planned without a connection when a stored supplemented schedule passes the exact claim selector above as Current or Stale reference. The journey may use the stored structural network and the rider's explicit Typical weekday or Late night pattern, but stored structure alone does not qualify for the label.

- Preserve the source-supported operating service date and New York chronology. Phone date, phone clock, midnight, theme, or selected spatial view never creates schedule coverage.
- A valid Current or Stale supplemented record may add a scheduled clock time only for its exact covered departure and subject to every veto. Every shown schedule-derived clock time carries **Scheduled** as its evidence state; **Reference itinerary** and the Current schedule or Stale reference currency state do not replace **Scheduled**. Only that eligible timed result may be labeled **Reference itinerary**.
- Topology only, a service-date mismatch, quarantined evidence, or no stored schedule may support only an **Untimed structural route** or **Untimed structural path**. It is not labeled **Reference itinerary** and makes no itinerary, timing, or service claim.
- A reference itinerary never claims a current reroute, alert, closure, arrival, stopping pattern, transfer certainty, equipment condition, or absence of disruption.
- A reference itinerary never says Live, Expected, on time, Actual now, or Accessible now and never fills a current-arrival gap.
- Offline passage cannot clear a stored veto or turn an unresolved or hard-suppressed claim into a scheduled departure.

The [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns the captured active card, its completeness, claim-attached last-checked service, equipment, guidance, and contingency treatment, and rider-confirmed progress. This contract owns stored presence and eligibility for a newly planned offline **Reference itinerary** or the weaker untimed structural-route or structural-path result when no eligible timed schedule exists.

## Accessible Route Only and offline accessibility

Accessible Route Only remains enabled exactly as the rider left it. Offline planning never silently relaxes the hard constraint to produce a faster, timed, or otherwise convenient route.

The positive offline wording **Structurally step-free; live elevator status unavailable** is permitted only when companion-owned stored evidence proves the complete exact chain for the proposed route and direction: street entrance; fare control or mezzanine; every transfer passage; correct directional platform; boarding area; destination platform; exit path; and street. Every required connection must retain its movement type, endpoints, route and direction, official equipment identity where applicable, official accessible-path membership, operating restrictions, and verification context.

All route-critical operational equipment states are **Unknown** while offline. Equipment inventory and a complete stored structural chain never prove that an elevator is currently operating. If any required structural edge, constituent station, direction, entrance, platform, destination exit, or equipment identity is absent, partial, contradictory, or unverified, withhold the positive structural wording and exclude the result from Accessible Route Only. Never show **Accessible now**, **Working**, **No official outage reported**, a current outage absence, or an optimistic substitute.

Companion complete-path, Accessible Route Only, equipment, and accessibility-copy artifacts exist as Drafts, but their approvals and observed evidence remain Pending, so this Draft defines expected consumption only and demonstrates no positive structural or current accessibility result.

## Five deterministic availability cases

These are exactly the five Task 8 availability cases. Every row is an expected Draft result, not an observed pass.

| Case | Topology | Scheduled time | Offline route or journey result | Accessibility | Required visible labels and context | Prohibited result | Evidence status |
|---|---|---|---|---|---|---|---|
| 1. Valid Current schedule | Rights-cleared stored vector pattern and structural network available | Yes, only from the exact validated, canonical, non-superseded supplemented claim at `0 ≤ age ≤ 2 hours`, with coverage and every veto passing | Timed **Reference itinerary** for the exact operating service date and departure | Keep Accessible Route Only on; show **Structurally step-free; live elevator status unavailable** only for a complete exact stored chain; all route-critical equipment Unknown | **Reference pattern—not live.** on the map; **Reference itinerary** on the journey; **Scheduled** evidence state; Current schedule currency state, truthful Published or First retrieved age, Last retrieved, effective coverage, and service date | No countdown, Live, Expected, on time, Actual now, current reroute/alert/arrival/equipment claim, Accessible now, regular-GTFS invention, or veto clearing | **Not run — Pending** |
| 2. Valid Stale reference | Rights-cleared stored vector pattern and structural network available | Yes, only from the exact validated, canonical, non-superseded supplemented claim at `2 hours < age ≤ 24 hours`, with coverage and every veto passing | Timed but visibly stale **Reference itinerary** for the exact operating service date and departure | Keep Accessible Route Only on; show **Structurally step-free; live elevator status unavailable** only for a complete exact stored chain; all route-critical equipment Unknown | **Reference pattern—not live.**; **Reference itinerary**; **Scheduled** evidence state; Stale reference currency state, truthful anchor age, Last retrieved, effective coverage and service date; exact Arrival Truth copy **Stored schedule—service changes may differ** | No countdown, Live, Expected, on time, Actual now, normal-looking service, current reroute/alert/arrival/equipment claim, Accessible now, regular-GTFS invention, or veto clearing | **Not run — Pending** |
| 3. More than 24 hours old | Rights-cleared stored vector pattern and structural network available; supplemented record is Topology only | No departure or arrival time | **Untimed structural route** only; no **Reference itinerary** label and no claim that the pattern operates at a proposed time | Keep Accessible Route Only on; show **Structurally step-free; live elevator status unavailable** only for a complete exact stored chain; all route-critical equipment Unknown | **Reference pattern—not live.**; **Untimed structural route**; Topology only and no departure-time treatment; truthful age and anchor context | No itinerary or service claim, scheduled time, countdown, Live, Expected, on time, Actual now, current reroute/alert/arrival/equipment claim, Accessible now, stored regular departure, or veto clearing | **Not run — Pending** |
| 4. Service-date mismatch | Rights-cleared stored vector pattern and structural network available; mismatched schedule may explain topology only | No departure or arrival time and no borrowing from another service date | **Untimed structural route** only; no **Reference itinerary** label and no claim that the selected pattern operates on the requested service date | Keep Accessible Route Only on; show **Structurally step-free; live elevator status unavailable** only for a complete exact stored chain; all route-critical equipment Unknown | **Reference pattern—not live.**; **Untimed structural route**; requested operating service date, schedule mismatch, and no departure-time treatment | No itinerary or service claim, borrowed trip, scheduled time, countdown, Live, Expected, on time, Actual now, current reroute/alert/arrival/equipment claim, Accessible now, midnight reassignment, stored regular invention, or veto clearing | **Not run — Pending** |
| 5. No stored schedule | Rights-cleared stored vector pattern and structural network remain available | No departure or arrival time | **Untimed structural route** only; no **Reference itinerary** label and no stored-schedule timing support | Keep Accessible Route Only on; show **Structurally step-free; live elevator status unavailable** only for a complete exact stored chain; all route-critical equipment Unknown | **Reference pattern—not live.**; **Untimed structural route**; no-stored-schedule and no departure-time treatment | No itinerary or service claim, invented supplement or regular departure, countdown, Live, Expected, on time, Actual now, current reroute/alert/arrival/equipment claim, Accessible now, inferred service, or veto clearing | **Not run — Pending** |

## Copy and downstream ownership

| Decision or copy | Owner | Task 8 application |
|---|---|---|
| **Reference pattern—not live.** | This contract, Task 8 | Exact offline map honesty copy for both stored reference layers and their associated map context |
| **Reference itinerary** | This contract, Task 8 | Exact label only for a journey newly planned without a connection from an eligible Current or Stale stored supplemented schedule |
| **Untimed structural route** or **Untimed structural path** | This contract, Task 8 | Weaker structural-only result when no eligible timed schedule exists; never an itinerary, timing, or service claim |
| **Structurally step-free; live elevator status unavailable** | This contract, Task 8, for offline application; underlying complete-path truth remains companion-owned | Conditional positive structural wording only for a complete exact stored chain; every route-critical operational state remains Unknown |
| **Scheduled**, Current schedule, Stale reference, Topology only, quarantine, currency boundaries, and **Stored schedule—service changes may differ** | [Schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md), Arrival Truth | Consume exactly; **Reference itinerary** and a currency state do not replace **Scheduled**; do not rename, strengthen, recompute from retrieval age, or apply to an ineligible claim |
| Persistent global offline message, cached-current presentation, preserved screen, and reconnection | `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 | Draft owner artifact present; its approvals and observed evidence remain Pending, and this artifact does not create persistent global copy or a reconnection sequence |
| Active offline trip-card capture, completeness, claim-attached last-checked treatment, contingencies, and manual progress | [Offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9 | **Draft** owner exists; Task 8 establishes stored presence and eligibility, not card freshness, completeness, or progress |

## Scenario traceability and pending evidence

| Source scenario or case | Expected Task 8 application | Current evidence |
|---|---|---|
| §31.4 scenarios 23–25 | Task 8 supplies instant reference-map and new-reference-itinerary validity boundaries; Task 10 owns the persistent tunnel/offline state; the [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns saved-trip content and manual progress; and Task 7 owns the day-to-night pattern explanation that Task 9 preserves | **Not run — Pending**; Task 9 walkthrough evidence and Tasks 10 and 14 observations and approvals remain Pending |
| Scenario 43 | A later validated supplemented edition wins only inside overlapping effective and service-date coverage; the earlier edition remains eligible outside overlap when every other gate passes | **Not run — Pending** |
| Scenario 44 | A 3-hour valid stored supplement is Stale reference; exactly 24 hours remains Stale; the first age greater than 24 hours is Topology only with no departure time | **Not run — Pending** |
| Scenario 49 | Repeated canonical-identical retrieval retains one edition identity and original accepted anchor; Last retrieved may change but currency age does not reset | **Not run — Pending** |
| Scenario 51 | Stored trip cards are inventoried here, but the [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns the Release 1 minimum-complete card without unavailable exit or platform-zone guidance | **Not run — Pending**; Task 9 TRIP-M51 and Task 14 observed evidence are absent |

The five availability rows, both offline map-open rows, and scenarios 43–44 and 49 require Task 14 observations against one fixed reviewed product version. Draft expected results cannot advance this artifact to In review or Approved.

## Rights and public-release blocker

Both offline map-open paths require a rights-cleared vector asset set. An official feed or public reference is not permission to copy, modify, store, distribute, or render an official MTA map, symbol, logo, route-bullet artwork, or other protected brand asset. Current line-color data may guide recognition only while route letter or number, applicable shape, text, line pattern, and spoken meaning remain independently usable.

| Asset condition | Offline storage decision | Public-release disposition |
|---|---|---|
| Durable applicable rights documented for the exact asset, version, modification, storage, platform, distribution, attribution, territory, and dates | May enter fixed-version review with its recorded license and inventory identity | Pending review; rights evidence is currently absent |
| Product-created schematic or geographic asset with recorded no-dependency rights review | May enter fixed-version visual and accessibility review | Pending rights, rendered, and accessibility evidence |
| Official or protected asset without durable applicable rights | Do not authorize public storage or use | **Blocked from public release — rights not documented.** |

Rights remain unresolved. Task 15 must record applicable permission for every used asset or a reviewed removal/no-dependency result; copy or offline utility cannot waive the blocker.

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Does the inventory include every Section 18.1 item plus all claim-applicable supplemented records and their canonical currency evidence? | Required here; not observed. | Fixed stored-content inventory and Data Quality review |
| Do Typical weekday and Late night both open without network waiting and carry exact **Reference pattern—not live.**? | Required here; not rendered. | Both offline map-open observations and assistive output |
| Can connectivity loss activate Actual now, select a reference layer, or place reference geometry beneath Actual now? | No. | Map transition observations with complete tuple comparison |
| Can identical retrieval reset age or a later edition supersede an earlier edition outside overlap? | No. | Scenario 43, scenario 49, and canonical same/new fixtures |
| Are exactly age zero and 2 hours Current, just over 2 through exactly 24 hours Stale, and greater than 24 hours Topology only? | Yes by consumed policy. | Exact-boundary fixtures with declared precision |
| Can a future, regressed, or contradictory publication timestamp use retrieval as a replacement anchor? | No; it is quarantined. | Timestamp-quarantine fixtures |
| Does this contract guarantee a timed stored regular-GTFS departure? | No. Section 18.1 guarantees stored supplemented records only. | Storage inventory and no-schedule/mismatch cases |
| Does each of the five cases state topology, time, journey or structural result, accessibility, labels, and prohibited claims? | Yes by expected matrix; not observed. | Fixed five-case observations |
| Is **Reference itinerary** reserved for eligible Current or Stale schedule cases, while cases 3–5 use only **Untimed structural route** or **Untimed structural path** with no itinerary, timing, or service claim? | Yes by expected contract; not observed. | Fixed five-case label and assistive-output observations |
| Does Accessible Route Only remain on, with all route-critical operational equipment Unknown and no **Accessible now** claim? | Yes by expected contract; companion truth and evidence are absent. | Companion complete-path/equipment approval plus Task 14 observations |
| Are Task 9 trip-card capture, completeness, claim-attached freshness, and progress and Task 10 persistent offline/reconnection behavior left with their owners? | Yes. | Task 9 Draft cross-artifact review and later Task 10 review |
| Are protected map and brand assets cleared for public use? | No. | Durable rights evidence or reviewed removal/no-dependency result |
| Does this Draft claim Gate 0 passage, scenario passage, companion accessibility approval, rights permission, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed evidence, all mandatory reviews, rights resolution, and later release gate |
