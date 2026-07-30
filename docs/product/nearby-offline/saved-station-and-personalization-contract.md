# Saved stations and rider-controlled personalization contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§26.1–26.3; nearby-station and offline-experience plan `Product artifact map` and Task 11 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 11 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; saved-state continuity, hidden-route disruption, UR-C05 contextual ordering, offline open and reconnection, preference controls and station-specific reset, and Nearby Task 14 saved-state and privacy evidence are absent |

## Purpose and authority

This contract owns the rider-visible saved-station record, immediate saved-station opening, explicit personalization inputs, contextual-ordering permission, and station-specific inspection, editing, pause, reset, and deletion behavior. It distinguishes durable rider intent from operational truth.

The [useful station and entrance ranking rules](station-ranking-and-entrance-rules.md), Task 3, own practical-walk eligibility and the baseline nearest-useful order. The [station board and controls contract](station-board-and-controls-contract.md), Task 5, owns board controls, direction and filter behavior, and scoped disruption placement. The [offline, degraded, and reconnection states contract](offline-degraded-and-reconnection-states.md), Task 10, owns global Offline presentation, historical-value treatment, and reconnection order. The [location and personal-data rules](location-and-personal-data-rules.md), Task 12, own private-by-default treatment, minimization and retention, broad reset and deletion assurance, diagnostic separation, notification boundaries, and optional synchronization constraints. The [nearby and offline experience contract](experience-contract.md) retains cross-surface restore-first, refresh-second continuity.

Arrival, service-change, entrance, accessibility, equipment, map, and guidance owners retain operational authority. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Every result below is an expected fixture with status **Not run — Pending**, not an observed pass, approval, or release claim.

## Governance mismatch and mandatory review

The [artifact index](../artifact-index.md) registers Product, Accessibility, Content, and Privacy and cites specification §26 for this artifact. The [review and approval policy](../review-and-approval-policy.md) additionally requires Data Quality because opening and reconnecting a saved station presents live, scheduled, cached, degraded, and service-change truth. This contract also applies §28.3 when it distinguishes per-station reset and deletion from Task 12's broad personal-data controls.

| Governance question | Current record | Required disposition |
|---|---|---|
| Registered reviewer set | Product, Accessibility, Content, Privacy | Retain the index-aligned metadata above until governed reconciliation. |
| Applicable policy minimum | Product, Accessibility, Data Quality, Content, Privacy | All five roles must review the same fixed version. Data Quality reviews refresh, hidden-route disruption, offline-value, and fail-closed truth application. |
| Registered source provenance | Specification §26 in the index and §§26.1–26.3 above | Add §28.3 as applying provenance for the per-station control boundary. The [location and personal-data rules](location-and-personal-data-rules.md), Task 12, retain broad privacy and deletion assurance. |
| Reconciliation and review evidence | Pending | A Data Quality decision and Product Governance Lead reconciliation of both reviewer and §28.3 applying-provenance mismatches are required before advancement from **Draft**. |

This contract does not edit the index, invent approval, or treat the mismatch as waived.

## Saved record and memory boundary

A saved station is a device-held rider-intent record. It opens without an account and is not delayed by account, synchronization, or network availability. The [location and personal-data rules](location-and-personal-data-rules.md), Task 12, own the broader privacy, retention, optional synchronization, broad reset, and personal-data deletion rules; this contract owns only the product fields and visible behavior below.

| Saved field | Exact retained intent | Boundary |
|---|---|---|
| Station and constituent | Exact saved station complex and the constituent-station scope selected or required when the record was saved | A nearby rank, current location, or similarly named station cannot replace this identity. |
| Preferred entrance | Exact entrance identity and its saved constituent and direction relationship | “Preferred” is not proof that the entrance is open, permitted, usable, nearest, or accessible now. |
| Preferred direction | Normalized rider-facing direction together with its actual-destination context | Do not store a raw direction code as rider meaning or silently remap the preference to another current direction. |
| Route filters | Exact routes the rider chose to include in the visible arrival subset | Filters change presentation only. They never stop refresh, clear a veto, or hide an affected filtered route's disruption. |
| Accessible Route Only | The rider-controlled on or off state | When on, it remains a hard complete-path constraint. It is never a soft preference and cannot be disabled by ranking, reset, refresh, or missing evidence. |
| Common destination | Exact rider-entered destination intent | It is only an input to a fresh verified-guidance decision. No platform zone, path, transfer, or recommendation is stored as preference truth. |
| Optional explicit time window | The rider-entered days and New York local-time window, when one exists | No inferred commute, habitual time, location history, or learned window may be substituted. |
| Personalization state | **Active** or **Paused**, explicitly controlled by the rider | Paused keeps the station saved, inspectable, and openable but removes automatic defaulting, contextual promotion, and time-window influence. |

The saved record may point to separately governed structural content, but it never contains a current operational snapshot as a preference. In particular, it does not save arrival evidence or order, a countdown, current service, a disruption resolution, entrance availability, walking rank, current distance, an accessible-path result, equipment operation, a platform, or positioning guidance.

**Never store operational truth as preference.**

## Opening a saved station

Opening follows this fixed sequence:

1. Open the device-held station and constituent record immediately. Do not wait for an account, synchronization, location permission, or network response.
2. Restore the saved entrance, rider-facing direction and actual-destination context, route filters, Accessible Route Only state, common-destination intent, time-window context, and Active/Paused state before applying any refresh. A deliberate open of a Paused record may use its stored context for that session, but it does not reactivate automatic personalization.
3. Request current decisions for every route and every passenger-serving direction at the saved complex and applicable constituents, including routes whose arrival rows the restored filter would hide.
4. Apply only owner-accepted current truth inside the restored intent. Current truth may invalidate a saved choice, remove a claim, change a value, or expose a warning; it cannot rewrite the saved record.
5. Keep each current disruption visible at its exact route, direction, station, constituent, segment, train, entrance, transfer, equipment, connection, or path scope even when its route is filtered from arrival rows.
6. Submit the common destination only to the companion guidance owner. Show a result only when that owner verifies the current direction, platform, geometry, path, and operational scope.
7. Keep any direction, entrance, filter, destination, or accessibility change made on the open board as session state only. The saved record changes only after an explicit **Edit saved station** and **Save changes** action.

Tapping Task 5's **Saved** control exposes the saved state; it does not silently overwrite the record with the currently open session. Foreground return, location update, refresh, filter change, direction change, Map navigation, Offline entry, or reconnection likewise cannot become an implicit save.

### Invalid or unsupported saved intent

Saved intent never overrides current truth. The visible consequence remains attached to the saved choice so the rider can understand and change it.

| Current result | Required behavior | Prohibited behavior |
|---|---|---|
| Preferred entrance is closed, restricted, Unknown, disconnected from the constituent, or cannot reach the selected direction | Keep the saved entrance identifiable as unavailable or not currently verified, with the owner-supplied exact reason and an explicit entrance-choice action when one is supported. | Silently use another entrance, a station centroid, a staircase, or a similarly named station. |
| Preferred direction is no longer passenger-serving, its mapping is unresolved, or its actual-destination context no longer matches | Withhold arrivals and guidance for the unresolved choice, preserve the saved direction as intent, and offer explicit governed direction choices. | Guess an opposite, choose the closest label, copy another direction's rows, or overwrite the saved direction. |
| A saved route is filtered from arrival rows but has a current disruption | Keep the route-identified disruption visible at its exact owner-supplied scope and expose official detail. | Hide the disruption, clear its veto, widen it, or imply **Good service**. |
| Accessible Route Only is on and a required path edge or route-critical equipment result is invalid or Unknown | Keep Accessible Route Only on, fail closed, and present only an owner-verified path or alternative. | Disable the constraint, treat Unknown as usable, inherit a complex badge, or substitute a staircase. |
| Common destination has no currently verified guidance result | Preserve the destination intent and omit unsupported positioning guidance. | Reuse stored front/middle/back guidance, scheduled platform data, or guidance for another direction. |
| Current arrival or service evidence is missing, degraded, unavailable, or materially unresolved | Use the owning connected, historical, fallback, or unavailable treatment at exact scope. | Restore a cached row as current, backfill from a schedule, clear negative evidence, or change the saved preference to make the board look useful. |

Any rider-facing invalid-preference copy remains subject to Accessibility and Content review. The absence of approved exact copy is not permission to substitute silently.

## Offline saved-station behavior

A device-held saved station remains immediately openable during global Offline. It never waits on a network request before showing the saved station identity, constituent, rider intent, and separately eligible stored structure.

The persistent Task 10 banner remains exact:

**Offline—live arrivals, alerts, and elevator status are unavailable.**

The banner remains visible across Saved and the opened station board. Every cached operational value follows Task 10's claim-specific historical treatment and original New York last-checked time. A former Live countdown freezes immediately and loses active Live semantics; route-critical equipment and current accessible-path operation remain Unknown until accepted fresh evidence supports otherwise.

A stored Typical weekday or Late night map opens only after deliberate rider selection under the [offline content and validity contract](offline-content-and-validity-contract.md), Task 8. Wherever mistaken-current risk exists, it keeps exact:

**Reference pattern—not live.**

Offline presentation must not claim a Live countdown, a current arrival, a current disruption resolution, a current nearest station or entrance, current usability, **Accessible now**, working equipment, a current platform, or current positioning guidance. “Saved” and “preferred” describe rider intent only.

When connectivity returns, Task 10's exact reconnection order remains authoritative. An actively opened saved board refreshes only in the applicable preserved-board scopes; background maps and unrelated saved stations remain stage 5. No reconnection result rewrites saved intent, changes its Active/Paused state, or moves focus.

## Contextual ordering

Task 3 remains the sole owner of practical-usefulness eligibility and station order. This contract supplies only the permitted personalization modifier:

1. Begin with Task 3's specific-entrance evidence and baseline nearest-useful order.
2. Apply every entrance, current-service, closure, exact-scope, complete-path, equipment, and Accessible Route Only hard constraint before personalization. Invalid and Unknown candidates cannot be promoted.
3. Allow promotion only from an explicit saved preference whose state is Active. If a time window exists, promotion applies only inside that rider-entered window; outside it, the window contributes no ordering influence.
4. Keep every closer workable station visible. Show the promoted station's and each closer workable station's practical walking distance or time and current usability at their exact supported scope.
5. Attach a visible saved-preference reason to the promoted card. Never call a farther promoted station or entrance **nearest**.
6. Preserve current arrival, service-change, closure, accessibility, equipment, and entrance truth unchanged.

A Paused record supplies no automatic default, promotion, or time-window influence. Opening it deliberately is not permission to reactivate it. The app never infers a preferred station, entrance, direction, destination, route, or time window from movement, prior opens, searches, location history, account activity, or an undisclosed habit model.

Task 11 consumes Task 3's UR-C05 result without changing it. Its exact visible explanation remains:

**Saved preference · 7-minute walk. A is closer at 4 minutes.**

Complex A remains visible as the closer workable result with its current usability, and Complex B may appear first only because the rider's explicit applicable preference is Active. Complex B is not nearest.

## Rider controls

Each control exposes its consequence before it mutates the saved record. Destructive actions use an explicit verb and object and never depend on swipe, long press, or a second tap on **Saved**.

| Control | Required result | State and truth that remain unchanged |
|---|---|---|
| Inspect | Show the exact station/constituent, preferred entrance, rider-facing direction and actual-destination context, route filters, Accessible Route Only state, common destination, optional explicit time window, and Active/Paused state. | Inspection does not refresh, edit, reactivate, rerank, or create operational evidence. |
| Edit and save | **Edit saved station** opens explicit field controls. Only **Save changes** replaces selected saved fields; cancel or navigation leaves the prior record intact. | Current board truth, arrival order, disruptions, accessibility truth, and all unedited fields remain unchanged. Session changes are not imported automatically. |
| Pause or resume | **Pause personalization** changes the state to Paused while keeping the station card saved, inspectable, and openable. Explicit resume returns it to Active. | Pausing does not delete fields, disable Accessible Route Only on an open surface, alter current truth, or close an already open board. |
| Reset station preferences | **Reset station preferences** clears preferred entrance, preferred direction and actual-destination context, route filters, common-destination guidance input, and optional time-window influence. The station/constituent remains saved and openable, and cleared fields have no future defaulting or ordering effect until explicitly edited and saved again. | The current or global Accessible Route Only hard constraint remains in its rider-selected state and is never silently turned off. Official arrival, disruption, entrance, accessibility, equipment, and guidance information remain intact. |
| Delete saved station | **Delete saved station** removes the saved card and its station-specific personalization. Future Nearby personalization order may recompute without the deleted preference. If its board is already open, that board remains open in the same context as an unsaved station and the bottom control becomes **Save station**. | Deletion does not blank the board, navigate away, remove official information, clear an operational warning, reorder arrival rows or other operational content on the already-open board, or delete another saved item. |

The [location and personal-data rules](location-and-personal-data-rules.md), Task 12, own privacy assurance, storage and retention policy, broad deletion assurance, diagnostic separation, notification-permission boundaries, and optional synchronization constraints. This contract does not define or claim those results.

**Reset station preferences** is station-specific: it clears the listed optional fields for one saved station and may leave that station as a neutral private card. **Delete saved station** removes one visible saved-station record. Task 12's **Reset all personalization** spans every covered station and companion-confirmed preference category, while **Delete personal data** removes every disclosed covered local, companion, queued, and future synchronized copy before completion may be claimed. None of these actions deletes official information or silently turns off the active/current/global Accessible Route Only constraint.

## SAVE-C01 — Saved-state continuity

This is an expected fixed-version fixture, not observed evidence.

| Walkthrough field | Expected result |
|---|---|
| Starting saved record | One Active saved station contains an exact complex and constituent, preferred entrance, rider-facing direction with actual destination, route filters, Accessible Route Only on, a common destination, and an explicit time window. One filtered route has a current scoped disruption. |
| Online open | The card opens immediately with every saved field restored. Every route and direction refreshes, including the filtered route; accepted current truth applies without changing the record, and the filtered route's disruption remains visible at exact scope. |
| Session direction change | The rider selects another governed direction. The board and compatible guidance update for the session, while inspection still shows the original saved direction and actual-destination context. No implicit save occurs. |
| Map transition | **Map** receives the session station and direction. The saved record, board return context, filters, accessibility state, warning, and reading position remain coherent. |
| Connectivity loss | Global Offline preserves the current surface and exact banner. Cached operational claims become historical; no Live countdown, current usability, accessible-now, or positioning claim survives. A deliberately opened reference map keeps **Reference pattern—not live.** |
| Return through Saved | Saved opens without network waiting. The card still shows the original saved intent. Deliberately opening that card restores its saved entrance, direction, filters, accessibility state, and destination for the new session; it does not treat the prior unsaved direction switch as an edit. |
| Reconnection | Current accessibility/path truth, service changes, arrivals, positioning, and applicable background saved content refresh only in Task 10's order. Every route and direction is evaluated, accepted current truth replaces unsupported historical claims, the hidden-route disruption remains visible if still applicable, and saved intent is not overwritten. |
| Prohibited result | Account or network wait; filtered route not refreshed; hidden disruption; saved direction overwritten by the session switch; silent entrance, path, or direction substitution; stale guidance; active-Live cache; automatic reference layer; context jump; or preference mutation during recovery |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version product observation and Nearby Task 14 evidence are absent |

## SAVE-R01 — Inspect, pause, reset, and delete

This is an expected fixed-version fixture, not observed evidence.

| Walkthrough field | Expected result |
|---|---|
| Starting saved record | One Active saved station contains every permitted field. Its board is open, Accessible Route Only is on, and independently governed arrivals, a scoped disruption, accessibility truth, and guidance treatment are visible. |
| Inspect | Inspection lists every saved field and Active state without treating any current board value as stored preference. |
| Unsaved session edit | A direction or filter changed on the board does not change the record. Opening **Edit saved station** and cancelling likewise preserves the original record. |
| Pause | **Pause personalization** leaves the card saved and openable but removes its automatic default, ordering, and time-window influence. The open board, Accessible Route Only, and official truth do not change. |
| Reset | **Reset station preferences** clears entrance, direction and actual-destination context, filters, common destination, and time-window influence. The station/constituent remains saved; Accessible Route Only is not silently disabled; cleared inputs no longer affect defaults or order. |
| Delete while open | **Delete saved station** removes the saved card and remaining station-specific personalization. The current station board remains open at the same station, direction, reading position, and operational state as an unsaved board; official information and warnings remain. |
| Prohibited result | Silent edit, hidden field, inferred replacement, loss of the saved card on pause, automatic reactivation, accessibility constraint disabled by reset, full personal-data reset, blank board, navigation jump, or deletion of operational truth |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version product observation and Nearby Task 14 evidence are absent |

## Ownership and pending evidence

| Decision | Authoritative owner | Task 11 consumption | Current disposition |
|---|---|---|---|
| Saved fields, immediate open, explicit preference application, Active/Paused behavior, station-specific controls, and SAVE-C01/SAVE-R01 expected results | This contract, Task 11 | Own rider-visible intent behavior without creating operational or privacy assurance. | Draft; SAVE-C01 and SAVE-R01 Not run — Pending |
| Practical entrance eligibility, baseline nearest-useful order, and closer-result protection | [Useful station and entrance ranking rules](station-ranking-and-entrance-rules.md), Task 3 | Supply only explicit Active preference and time-window inputs; consume UR-C05 unchanged. | Draft; UR-C05 Not run — Pending |
| Board direction, filter, Save/Saved, refresh, hidden-route disruption, and reading continuity | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Restore saved intent and require explicit edit/save; do not redefine controls or truth. | Draft; Task 14 Not run — Pending |
| Offline banner, historical-value rules, preserved screen, and reconnection priority | [Offline, degraded, and reconnection states contract](offline-degraded-and-reconnection-states.md), Task 10 | Open immediately and consume the exact offline and recovery behavior. | Draft; OFF-T23 and Task 14 Not run — Pending |
| Stored structure, schedule validity, and exact reference-map label | [Offline content and validity contract](offline-content-and-validity-contract.md), Task 8 | Use only separately eligible stored content; saved preference never upgrades it. | Draft; Task 8 cases and Task 14 Not run — Pending |
| Arrival, service-change, accessibility, equipment, platform, and guidance truth | Arrival Truth and companion accessibility/guidance owners | Apply accepted decisions at exact scope and fail closed; never persist them as preference. | Gate 0 and companion approval evidence absent |
| Location privacy, personal-data inventory, retention, broad deletion assurance, diagnostics, notification boundary, and optional synchronization | [Location and personal-data rules](location-and-personal-data-rules.md), Task 12 | Consume the private-by-default and lifecycle boundary; define only the immediate visible station-specific actions above. | Draft; PRIV-M01, PRIV-S01, PRIV-Q01, and PRIV-N01 Not run — Pending |
| Observed saved-state acceptance | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Record fixed-version observations and prohibited-result checks. | Artifact and observations absent |

## Scenario traceability

| Source or fixture | Expected Task 11 result | Current evidence |
|---|---|---|
| §26.1 saved station card | Exact rider-intent fields restore immediately; every route and direction refreshes; affected filtered-route disruptions remain visible; operational truth is never stored as preference. | **Not run — Pending** |
| §26.2 contextual ordering | Task 3 baseline and hard constraints apply first; only an explicit Active preference and applicable explicit time window may promote; every closer workable result remains visible with distance and current usability. | **Not run — Pending** |
| §26.3 reset and control | Every saved field is inspectable and explicitly editable; pause retains an openable card; station reset and delete do not alter official truth; Task 12 retains full-reset ownership. | **Not run — Pending** |
| SAVE-C01 | Online open, session direction change, Map, Offline, return through Saved, and ordered reconnection preserve intent and honest freshness without implicit save. | **Not run — Pending** |
| SAVE-R01 | Inspect, cancel, pause, station-specific reset, and delete have exact bounded effects while the open board and official information remain coherent. | **Not run — Pending** |
| UR-C05 consumption | Exact **Saved preference · 7-minute walk. A is closer at 4 minutes.** remains visible; the closer workable station remains present and the farther station is never called nearest. | **Not run — Pending** |

Approved-specification scenario 22 remains owned by the [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2. Task 11 consumes a selected saved station after that fallback and does not reassign, duplicate, or claim scenario 22.

All Task 11 observations must identify one fixed product version and record expected result, observed result, date, reviewers, every saved-field before/after value, every owner-supplied truth input, exact visible and assistive output, and every prohibited-result check. Prose or a screenshot without state provenance is not scenario evidence.

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Does the saved record contain every required field and no operational truth as preference? | Yes by contract; not observed. | Fixed record inspection and persistence trace |
| Does a saved station open immediately without account or network waiting and refresh every route and direction when connected? | Required here; not observed. | SAVE-C01 timing and request/result trace |
| Can a filter hide an affected route's disruption? | No. | SAVE-C01 scoped-disruption observation |
| Can current truth overwrite intent or can a session change become an implicit save? | No. | Before/after record and board-state trace |
| Do invalid entrance, path, direction, and guidance choices fail closed without silent substitution? | Yes by contract; not observed. | Fixed invalid-preference branches with owner provenance |
| Does Offline preserve the exact Task 10 banner and cached treatment and Task 8 reference label without any current claim? | Yes by consumption; not observed. | SAVE-C01 Offline and assistive-output observation |
| Does contextual ordering start from Task 3 and retain every closer workable result with distance and usability? | Yes by contract; not observed. | UR-C05 fixed-version observation |
| Do pause, station reset, and delete preserve their exact bounded state and leave official truth intact? | Yes by contract; not observed. | SAVE-R01 before/after comparison |
| Does station reset silently disable Accessible Route Only or does delete blank an already open board? | No. | SAVE-R01 accessibility and open-board branches |
| Are Task 12 privacy assurance, retention, diagnostics, notification, optional synchronization, broad reset, and deletion kept out of Task 11 ownership? | Yes. | Task 12 cross-domain review and PRIV-S01 |
| Have Product, Accessibility, Data Quality, Content, and Privacy reviewed the same fixed version and have the reviewer and §28.3 applying-provenance mismatches been reconciled? | No. | All five decisions and Product Governance Lead reconciliation |
| Does this Draft claim Gate 0 passage, SAVE-C01, SAVE-R01, UR-C05, Task 14, privacy assurance, companion approval, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed evidence, all mandatory reviews, governance reconciliation, and later release gate |
