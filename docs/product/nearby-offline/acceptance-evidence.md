# Nearby and offline acceptance evidence

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§13–18, 26, 28, 29.2, 30, 31.1–31.8 as allocated below, 32.2, 33, and 34; nearby-station and offline-experience plan `Product artifact map` and Task 14 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 14 brief |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | **Not run — Pending**; no fixed working-product version, frozen artifact/dependency set, executed case, rendered or assistive result, measurement package, attachment set, reviewer decision, correction, or rerun exists |

## Purpose, authority, and current decision

This artifact is the append-only evidence ledger for the [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md), the [Nearby station and offline experience delivery plan](../../superpowers/plans/2026-07-30-nearby-station-and-offline-experience-plan.md), and Tasks 1–13 in this directory. It records how one fixed working-product version applies owner-approved truth and product contracts. It does not create, reinterpret, strengthen, weaken, or approve arrival truth, service-change scope, schedule currency, accessibility, equipment, guidance, notification, location, privacy, measurement, rights, or release decisions.

Lifecycle and reviewer decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md). Upstream truth remains controlled by the [arrival-truth acceptance catalog](../quality/arrival-truth-acceptance-catalog.md) and its linked owner artifacts. This ledger consumes those fixed results and records the rider-visible application without duplicating their decision authority.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

> **NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked. The Task 1–13 artifacts mapped below are currently **Draft** with approval evidence **Pending**; this preparatory traceability does not satisfy the plan dependency that Tasks 1–13 be accepted. Every case and initial attempt below is **Not run — Pending**. Expected prose, a screenshot without complete state provenance, a conversation, a meeting, a document commit, an empty incident log, or an unversioned dashboard is not working-product evidence and cannot change that disposition.

## Evidence vocabulary and stop rules

These are the only permitted case-attempt dispositions:

| Disposition | Exact meaning |
|---|---|
| **Not run — Pending** | No complete run exists against one frozen working-product, artifact, dependency, input, and reviewer package. This is the current disposition of every case. |
| **Run — Pass** | The fixed attempt produced the complete expected visible and assistive result, every prohibited-result check passed, required measurements met their predeclared rule, and all mandatory reviewers approved the same evidence. |
| **Run — Fail** | The fixed attempt missed an expected result, produced any prohibited result, missed a required measure, or received a required **Changes required** decision. |
| **Run — Inconclusive** | A run exists, but a required input, lineage item, attachment, measurement, dependency result, or reviewer decision cannot support Pass or Fail. The exact gap and conservative release effect remain recorded. |

A missing phenomenon, denominator, reviewer, attachment, dependency, or later outcome never becomes Pass. A failure remains in the ledger after correction. Every correction receives a new fixed version and linked attempt; it never overwrites an earlier actual result, prohibited-result check, reviewer decision, or release effect.

Any failed or inconclusive truth, accessibility, privacy, offline-honesty, rights, or blocking operational case blocks approval. Timing, engagement, copy, or a later passing rerun cannot waive it. The Gate 0 decision changes only through its authoritative record.

## Stable append-only evidence record

### Stable identity and immutability

- A case ID is permanent and identifies one expected decision boundary.
- An attempt ID is `<case-id>-A<two-digit sequence>`, beginning with `A01`.
- A case revision does not reuse an old attempt. It adds a new attempt tied to the new exact artifact and working-product versions.
- Every attempt retains its source, owner, applying artifacts, dependencies, inputs, expected and prohibited results, actual result, review, disposition, release effect, correction, and rerun link forever.
- Attachments use durable repository-relative links and immutable identifiers. A mutable external dashboard or unrecorded meeting cannot be the only evidence.
- One attempt cannot stand in for an unexercised branch. Branches named in a case definition are separately identifiable in the attachment and measurement record.

### Required fields for every attempt

| Record field | Required content |
|---|---|
| Stable identity | Case ID; attempt ID; prior attempt when any; correction ID when any; superseding rerun when any |
| Source and owner | Approved-specification section/scenario; plan task or accepted boundary fixture; authoritative outcome owner; Release Quality record owner |
| Applying artifacts | Every nearby/offline and upstream or companion artifact whose exact decision is consumed |
| Exact versions | Working-product/build identity; this evidence-definition version; every applying artifact version; configuration; data/correction policy; asset version; dependency result version |
| Dependencies | Gate 0 package, source revalidation, route/feed inventory, upstream truth result, accessibility/equipment/guidance/Commute result where applicable, rights decision, and privacy-approved observation rule |
| Inputs, timestamps, and scope | Immutable input references; authoritative source and retrieval times; New York service date and operating period; route/feed group; route, station complex, constituent, exact direction/stop/segment/path/asset scope; observation start/end; exclusion and later-outcome rule |
| Rider precondition | Permission, connectivity, lifecycle, topology, Accessible Route Only, service pattern, saved/active-trip state, and any other state required by the case |
| Starting tuple | Persistent destination and surface; station/constituent/entrance; rider-facing direction and actual destination; filters; Accessible Route Only; complete Map tuple; active trip and manual cursor; open disclosure; scroll, focus, and reading position; visible/spoken evidence and freshness state |
| Action | Exact rider, platform, source, or lifecycle action and its order |
| Expected result | Complete expected visible result, state mutation, preserved state, owner-supplied truth application, and expected assistive equivalent |
| Prohibited result | Every false admission, backfill, stale/current confusion, hidden direction or warning, context loss, unsafe accessibility/guidance substitution, rights breach, privacy breach, or other case-specific forbidden result |
| Actual and after tuple | Exact visible result; exact assistive output; complete after tuple using the same fields as the starting tuple; every owner-supplied decision applied or withheld |
| Measurements | Predeclared observable, numerator/denominator or review population where applicable, timing/quantile rule, zero/absent rule, required segments, result, and raw non-personal evidence reference |
| Attachments | Render/video, accessibility tree and transcript, target bounds, contrast output, event/order trace, input and output provenance, state diff, storage/privacy trace, rights record, and other case-required durable evidence |
| Review | Review date; named reviewers and roles; **Approve** or **Changes required** from Product, Accessibility, Data Quality, Content, Privacy, and Operations as applicable; unresolved issue IDs |
| Disposition and release effect | One exact permitted disposition; blocking or non-blocking release effect; Gate 0 and Task 15 consequence |
| Correction and rerun | Correction owner and due condition; linked changed artifact/product version; new attempt ID; preserved earlier failure or inconclusive result |

### Canonical state tuple

The starting and after tuples use the same keys so a result cannot hide a context mutation:

`destination / surface / station complex / constituent / entrance / direction / actual destination / route filters / Accessible Route Only / appearance / service layer / spatial view / overlays / selected route / zoom / map position / opened board / active trip / manual cursor / open disclosure / scroll / focus / reading position / connectivity / location-permission state / route-feed health / service pattern / visible state and freshness / assistive state and announcement`.

An unavailable value is recorded explicitly. It is never dropped from the tuple after its result is known.

### Current not-run field set

The current registry binds every listed case to field set **NR-01** and a unique `A01` attempt. This common field set is part of each registered attempt; it is not evidence of execution.

| Required attempt field | NR-01 current value |
|---|---|
| Exact versions and dependencies | Working product, evidence-definition commit, applying artifact versions, configuration, data, source revalidation, Gate 0 package, owner results, rights result, and privacy observation rule: **Not assigned — no run may be credited** |
| Inputs, timestamps, scope, rider precondition, and actual starting tuple | **Not recorded — no run** |
| Action, actual result, and after tuple | **Not recorded — no run** |
| Measurements and non-personal lineage | **Not recorded — no run** |
| Assistive output and announcements | **Not recorded — no run** |
| Attachments | None |
| Review date and decisions | Not recorded; Product, Accessibility, Data Quality, Content, Privacy, and Operations are **Pending** |
| Disposition | **Not run — Pending** |
| Release effect | Blocks approval and preserves **NO-GO — GATE 0 NOT PASSED** |
| Correction and rerun | None; first working-product attempt has not been registered |

## Section 31 allocation

### Headline source-scenario register

Each headline scenario has a local applying case. The source truth result remains with its named owner.

| Source scenario | Local applying case or cases | Owner boundary | Current disposition |
|---|---|---|---|
| 1. Moving train appears Live | HON-S01 | Arrival Truth owns admission; Nearby records the visible row | **Not run — Pending** |
| 2. Assigned terminal train Expected, then Live | HON-S02 | Arrival Truth owns stability and movement transition; Nearby preserves one row | **Not run — Pending** |
| 3. Absent static trip is not restored | HON-S03 | Arrival Truth owns healthy replacement and admission; Nearby prohibits backfill | **Not run — Pending** |
| 4. Identifier changes without duplication | HON-S04 | Arrival Truth owns continuity; Nearby preserves one rider row | **Not run — Pending** |
| 5. Ambiguous identities remain quarantined | HON-S05 | Arrival Truth owns quarantine; Nearby exposes no guessed merge | **Not run — Pending** |
| 21. Useful entrance, not centroid | NEAR-S21 and CARD-UR01–CARD-UR07 | Task 3 owns practical-walk ranking | **Not run — Pending** |
| 22. Denied-location fallback | PERM-S22A, PERM-S22B, and PERM-S22C | Task 2 owns last-used, saved, then picker branches | **Not run — Pending** |
| 23. Stable tunnel entry | REC-S23 | Task 10 owns Offline preservation and recovery | **Not run — Pending** |
| 24. Saved trip and manual progress | TRIP-S24 | Task 9 owns the active card and rider-confirmed cursor | **Not run — Pending** |
| 25. Weekday-to-late-night trip | MAP-S25 | Task 7 owns pattern selection; Task 9 preserves it | **Not run — Pending** |
| 40. After-midnight service date | HON-S40 | Arrival Truth owns service date; applying surfaces preserve it | **Not run — Pending** |
| 41. Daylight-saving continuity | HON-S41 | Arrival Truth owns chronology and identity; applying surfaces preserve order | **Not run — Pending** |
| 42. Authoritative freshness despite phone-clock difference | HON-S42 | Arrival Truth owns authoritative time; Tasks 5, 8–10 preserve it | **Not run — Pending** |
| 43. Later overlapping supplement wins | HON-S43 | Arrival Truth owns claim-scoped supersession; Tasks 7–10 preserve it | **Not run — Pending** |
| 44. Three-hour Stale and over-24-hour topology-only | HON-S44 and OFF-V02–OFF-V03 | Arrival Truth owns currency; Tasks 8–10 preserve labels and time limits | **Not run — Pending** |
| 49. Identical retrieval does not reset age | HON-S49 | Arrival Truth owns edition identity and anchor; Tasks 8–10 preserve age | **Not run — Pending** |
| 50. Earlier Expected remains in chronological next three | HON-S50 and CARD-RC03 | Arrival Truth owns order; Task 4 preserves it | **Not run — Pending** |
| 51. Minimum-complete offline trip | TRIP-S51 | Task 9 owns complete omission of unavailable guidance | **Not run — Pending** |

### Upstream truth scenario links

Scenarios 6–20 are not redefined here. Their accepted owner result and local rider-visible application must both be linked to any relevant attempt.

| Scenarios | Upstream owner evidence | Required local application | Current state |
|---|---|---|---|
| 6–8 | [Reroute, short-turn, and bypass cases](../arrival-truth/reroute-short-turn-and-bypass-cases.md) and [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md) | BOARD-H01, MAP-R01, FALLBACK-004, and REC-ORDER01 preserve exact bypass, changed path, short-turn terminal, unaffected context, and vetoes | Upstream and local attempts **Not run — Pending** |
| 9–12 | [Service-change scope cases](../arrival-truth/service-change-scope-cases.md) and [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md) | BOARD-OH03, MAP-R01, FALLBACK-002, FALLBACK-004, and REC-ORDER01 preserve direction/station/train/complex scope and unrelated service | Upstream and local attempts **Not run — Pending** |
| 13–14 | [Ghost lifecycle boundary cases](../arrival-truth/ghost-lifecycle-boundary-cases.md) and [arrival confidence and ghost policy](../arrival-truth/arrival-confidence-and-ghost-policy.md) | CARD-RC04, REFRESH-FL01, UG-RM01, and OFF-H01 preserve Holding/Uncertain placement, freeze, and no silent deletion | Upstream and local attempts **Not run — Pending** |
| 15–16 | [Suppression and recovery cases](../arrival-truth/suppression-and-recovery-cases.md) and [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md) | REFRESH-FL01 and REC-ORDER01 preserve no optimistic row and owner-required recovery | Upstream and local attempts **Not run — Pending** |
| 17–18 | [Snapshot anomaly and recovery cases](../arrival-truth/snapshot-anomaly-and-recovery-cases.md) and [route-level feed health policy](../arrival-truth/feed-health-policy.md) | REFRESH-FL01, FALLBACK-003, OFF-H01, and REC-ORDER01 preserve degraded isolation, stopped countdowns, and two-snapshot recovery | Upstream and local attempts **Not run — Pending** |
| 19–20 | [Schedule currency boundary cases](../arrival-truth/schedule-currency-boundary-cases.md) and [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) | FALLBACK-003, OFF-V01–OFF-V05, TRIP-S24, and REC-S23 keep Scheduled separate and preserve active-change vetoes | Upstream and local attempts **Not run — Pending** |
| 43–44 and 49 | [Schedule currency boundary cases](../arrival-truth/schedule-currency-boundary-cases.md) | HON-S43, HON-S44, HON-S49, and OFF-V01–OFF-V05 preserve claim-scoped supersession, age anchor, Stale, and topology-only behavior | Upstream and local attempts **Not run — Pending** |
| 50 | [Arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md) and [arrival-truth acceptance catalog](../quality/arrival-truth-acceptance-catalog.md) | HON-S50 and CARD-RC03 preserve chronological next-three order | Upstream and local attempts **Not run — Pending** |

### Companion-owned scenario links

These scenarios remain links to companion plans only. This artifact creates no substitute local truth case, expected companion result, or approval.

| Scenarios | Companion authority | Nearby/offline consumption boundary |
|---|---|---|
| 26–32 | [Accessibility and platform guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | Tasks 3, 4, and 8–10 may consume only an accepted exact direction, complete-path, equipment, alternative, and warning result and fail closed while it is absent |
| 33–35 | [Accessibility and platform guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | Tasks 5, 7, and 9 may consume verified orientation, track-conflict, exit, and accessible-priority outcomes without creating guidance |
| 36–39 | [Commute alerts and launch quality plan](../../superpowers/plans/2026-07-30-commute-alerts-and-launch-quality-plan.md) | Nearby may preserve context only; alert eligibility, suppression, deduplication, delivery, and alternatives remain companion-owned |
| 45–46 | [Accessibility and platform guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | Tasks 3 and 8–10 consume provisional-empty and restoration decisions without treating missing or stale evidence as operational |
| 47 | [Accessibility and platform guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | Tasks 7 and 9 consume transfer assessment without promising a connection |
| 48 | [Commute alerts and launch quality plan](../../superpowers/plans/2026-07-30-commute-alerts-and-launch-quality-plan.md) | Nearby creates no push threshold or notification result |

## Case definitions

Every case inherits the full attempt schema above. The definition rows fix source, owner, applying artifacts, rider precondition, starting state, action, expected visible and assistive result, and prohibited result before outcome inspection.

### Context family

Applying artifacts: [experience contract](experience-contract.md), [station board contract](station-board-and-controls-contract.md), [map contract](map-modes-and-journey-behavior.md), [trip-card contract](offline-trip-card-and-progress-contract.md), and [recovery contract](offline-degraded-and-reconnection-states.md). Outcome owner: Experience Product Lead.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| CTX-DEST01 — specification §§13.1, 13.3, 32.2, and 34 SPD-01–02 | No account; normal launch and navigation through Nearby, Map, Commute, Saved, and contextual station detail | Exactly four persistent bottom destinations; Nearby is default; station detail is contextual; the no-account capability set remains available and controls expose equivalent labels and selected state | Fifth destination, account gate, blank search home, notification prompt, or station detail replacing persistent navigation |
| CTX-RETURN01 — specification §§13.2, 14.6, and 34 SPD-04, SPD-10–11 | Full canonical tuple from the Task 1 return-from-background walkthrough; background, then foreground after a bypass veto, path invalidation, and guidance loss | Restore the entire tuple first; remove the bypassed row without backfill; preserve filter and scoped warning; keep Accessible Route Only on; remove unsupported guidance; retain Map tuple, trip cursor, scroll, focus, and reading position; announce the blocking path change coherently | Station/direction jump, backfill, hidden warning, disabled accessibility constraint, guessed path/guidance, Map reset, progress reset, or refresh before restoration |

### Startup family

Applying artifacts: [startup and permission flow](zero-tap-startup-and-permission-flow.md), [experience contract](experience-contract.md), and [measurement plan](measurement-plan.md). Outcome owner: Experience Product Lead; Measurement Lead owns target calculation only.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| START-WARM01 — specification §14.1 and §29.2 warm-shell target | Typical warm launch with one last coherent Nearby shell | Shell is first visible with station, direction, filters, Accessible Route Only, reading position, and honest freshness; current results replace it in place; elapsed observation uses MEAS-U01 | Blank/skeleton substituted as success, permission/network wait before shell, preserved content called current, context jump, or target claim without a fixed run |
| START-COLD01 — specification §14.1 | No coherent shell; cold launch | Nearby, **Nearby stations**, non-claim structure, and bottom **Choose a station** appear before permission or data; assistive output identifies structure and action without a station claim | Blank search, open keyboard, fabricated station/entrance/arrival, onboarding gate, or hidden chooser |
| START-FIRST01 — specification §§14.1–14.2 and 28.1–28.2 | First use before location permission | Show non-claim or legitimate preserved context, then exact **Use your location to show nearby subway entrances and live arrivals.** immediately before the OS location prompt; no notification prompt | Account/onboarding/search interruption, bundled notification permission, value statement after the prompt, or location described as arrival truth |

### Permission family

Applying artifacts: [startup and permission flow](zero-tap-startup-and-permission-flow.md), [ranking rules](station-ranking-and-entrance-rules.md), and [location and personal-data rules](location-and-personal-data-rules.md). Outcome owner: Experience Product Lead; Privacy Lead owns minimization.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| PERM-P01 — specification §§14.2, 14.3, and 28.1 | Precise granted; request one current result | Preserved shell or non-claim Nearby appears first; rank only with eligible entrance evidence; chooser remains available; Accessible Route Only and truth vetoes persist | Re-prompt, centroid rank, proximity as usability/accessibility/current service, station replacement after rider choice, or retained coordinate |
| PERM-P02 — specification §§14.2, 14.3, and 28.1 | Approximate granted, precise absent | Full core utility at supported precision; no error or upsell; uncertain exact entrance/nearest wording is withheld; chooser remains available | Coerced precision, exact unsupported entrance/walk/nearest claim, weaker arrivals, hidden chooser, or inferred complete path |
| PERM-S22A — specification §31.4 scenario 22, last-used branch | Denied; one last-used station exists; saved stations may also exist | Show the last-used station with exact **Location unavailable. Showing your last station.** and preserve/refetch truth without calling it nearest; bottom station choice remains available | Blank/search/keyboard, repeated prompt, saved branch winning, old location called current, or silent station replacement |
| PERM-S22B — specification §31.4 scenario 22, saved-only branch | Denied; no last-used station; saved stations exist | Show private saved choices and **Choose a station** without distance or nearest claims; selection refreshes truth independently | Account gate, inferred current location, stored operational value called current, auto-search, or fabricated distance |
| PERM-S22C — specification §31.4 scenario 22, picker branch | Denied; no last-used or saved station | Open bottom picker with explicit recents when any, then popular stations, visible **Search stations**, and closed keyboard | Blank screen, forced search, auto keyboard, fabricated recents, permission gate, or popular station called nearby/current |
| PERM-TEMP01 — specification §§14.1–14.2 and Task 2 temporary-failure fixture | Permission usable; current location request fails with a last coherent station | Preserve station, direction, filters, Accessible Route Only, and reading position; show exact last-station sentence; keep **Try location again** and **Choose a station** reachable; transit truth remains independent | Denial/Offline/feed failure conflation, blank screen, old location called current, silent station replacement, or retry changing freshness |

### Nearby and useful-card families

Applying artifacts: [ranking rules](station-ranking-and-entrance-rules.md), [Nearby card and direction contract](nearby-card-and-direction-contract.md), [startup flow](zero-tap-startup-and-permission-flow.md), and [measurement plan](measurement-plan.md). Outcome owner: Experience Product Lead; Arrival Truth and accessibility owners supply their accepted inputs.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| NEAR-S21 — specification §31.4 scenario 21 | Precise location plus verified entrance/constituent/direction/walk evidence; rank candidates | Rank to the shortest practical walk to a useful eligible entrance, preserve exclusions and explanation, group verified constituents without losing axes | Centroid or schematic distance, nearest-looking entrance, widened connection, inaccessible/closed entrance, or location-created service truth |
| NEAR-Z01 — specification §§14.1, 14.4 and §29.2 useful-card target | Normal Nearby launch; Task 3 supplies at least three eligible complexes | Without search, typing, switching, or expansion, show the first three complexes in supplied order with required identity, walk, entrance, route, accessibility, disruption, directions, and owner-qualified arrivals | Second ranking pass, card padding, hidden direction, search gate, lower complex promoted for more rows, or target claim without geography-permits denominator |
| CARD-UR01 — Task 3 fixture UR-C01; specification §§14.3 and 19.3–19.4 | A1 is 2 minutes and exit-only; A2 is 6 minutes and eligible; B1 is 4 minutes and eligible | Complex B/B1 wins; A1 is excluded and explained; Complex A remains lower through A2 | Route through A1, centroid shortcut, hidden exclusion, or closest-equals-useful inference |
| CARD-UR02 — Task 3 fixture UR-C02; specification §§14.3 and 19.3–19.4 | A1 is 2 minutes and closed; A2 is 7 minutes and open; B1 is 5 minutes and open | Complex B/B1 wins; A1 closure stays scoped; A remains available through A2 | Closed A1 wins, whole-complex closure, or missing alert treated as reopening |
| CARD-UR03 — Task 3 fixture UR-C03; specification §§14.3–14.5 | Multi-axis Complex C; C1 serves Axis 1, C2 serves selected Axis 2; D1 is next | One Complex C card uses C2 for selected Axis 2, retains C1/Axis 1 mapping and every axis | Duplicate complex, generic two-axis collapse, C1 widened to Axis 2, or erased axis |
| CARD-UR04 — Task 3 fixture UR-C04; specification §§14.3 and 33.3 | Accessible Route Only on; closer candidates are staircase or Unknown; B1 has verified applicable path | Complex B/B1 wins with scoped explanation; Unknown remains ineligible; no-winner branch reports no verified applicable path | Stair substitution, badge-as-path, Unknown as usable, disabled constraint, or origin chain called a complete journey |
| CARD-UR05 — Task 3 fixture UR-C05 and specification §26.2 | A is usable at 4 minutes; B is usable at 7 minutes and explicitly saved Active | A remains baseline and visible; B may appear first only with exact **Saved preference · 7-minute walk. A is closer at 4 minutes.** | Hide A, call B nearest, obscure walk times, infer preference, or change operational truth |
| CARD-UR06 — Task 3 fixture UR-C06; specification §§14.3 and 19.3–19.4 | Closer entrances have missing or stale current closure evidence; A2 is the shortest entrance with current exact-scope usability evidence | A2 wins; unconfirmed entrances are excluded from automatic useful/open/nearest claims; an all-unconfirmed branch retains the station without inventing an entrance | Omission-as-open, borrowed scope, hidden station, centroid fallback, or preference override |
| CARD-UR07 — Task 3 fixture UR-C07; specification §§14.3–14.4 | Four complexes and two entrances within A have indistinguishable supported practical walks; repeat with shuffled source, wrapper, and input order | Neutral fixed keys select A1 for stable presentation and preserve A, B, C as the same first three; **About the same walk.** prevents a false uniquely-nearest claim | Invented precision, source-order tie-break, shuffled cutoff membership, arrival-based promotion, or first-tied-equals-nearest wording |
| CARD-RC01 — Task 4 fixture RC-01; specification §§14.4–14.5 | Ordinary station with two current passenger-serving directions; first has three primary rows, second has two | One card initially exposes both vertically stacked directions; second shows two plus cause-supported gap; every row names actual destination and state | Default one direction, switch/expansion/horizontal discovery, third-row backfill, or missing destination |
| CARD-RC02 — Task 4 fixture RC-02; specification §§14.4–14.5 | Verified complex with three operational axes and direction-specific entrances | One card exposes all axes under separate rider headings, exact entrances/accessibility, independent arrival states, and spoken headings | Duplicate complex, Uptown/Downtown collapse, hidden third axis, widened entrance, or fullest-axis rename |
| CARD-RC03 — Task 4 fixture RC-03 and specification §31.8 scenario 50 | Expected 4–6 minutes, Live 7, Live 10, with non-overlapping ranges | Preserve upstream order Expected, Live 7, Live 10; show exact range, actual destinations, and evidence states visually and assistively | Global Live-first sort, changed/averaged Expected range, visual-certainty reorder, or replacement |
| CARD-RC04 — Task 4 fixture RC-04; specification §§14.4–14.5 and 34 SPD-06 | Live 3, Expected 6–8, separate owner-supplied Holding, evidence-limited gap | Two primary rows, one frozen separate Holding warning that consumes no slot, and **Live arrival information is limited.** | Holding as third row, decrement/animation, promotion, static fill, hidden gap, or dropped primary row |

### Refresh family

Applying artifacts: [experience contract](experience-contract.md), [startup flow](zero-tap-startup-and-permission-flow.md), [station board contract](station-board-and-controls-contract.md), [recovery contract](offline-degraded-and-reconnection-states.md), and [measurement plan](measurement-plan.md). Outcome owner: Experience Product Lead; truth owners supply accepted refresh results.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| REFRESH-BG01 — specification §§13.2 and 14.6 | Preserved board or Map tuple; move to background and return | Restore destination, station, direction, filters, accessibility, map/trip/reading tuple, then request and apply current evidence in place without another prompt | Refresh-first jump, reset, repeated location/notification prompt, age reset, keyboard, or stale claim upgraded |
| REFRESH-FL01 — Task 5 fixture FL-01; specification §§14.6 and 15.5 | Board with authoritative age and one Live row; foreground, tap Refresh, degrade, become unavailable, then run one/two/interrupted recovery snapshots | Age remains source-based; stale values freeze and show **Live data updating**; owner-selected fallback stays separate; one snapshot restores nothing; second consecutive qualifying snapshot permits individual reevaluation; interrupted pair restarts | Foreground/tap-created freshness, advancing stale/Holding value, frozen Live mixed with Scheduled, one-group network failure, context jump, or early recovery |

### Fallback family

Applying artifacts: [station board contract](station-board-and-controls-contract.md), [startup flow](zero-tap-startup-and-permission-flow.md), [recovery contract](offline-degraded-and-reconnection-states.md), and Arrival Truth owner decisions. Outcome owner: Experience Product Lead.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| FALLBACK-001 — specification §§15.5 and 34 SPD-02 | Current accepted evidence; selected direction has no Live/Expected rows; no stronger cause controls | **No verified live arrivals in this direction.** with exactly one cause-selected action: **View other direction** when alternatives exist, otherwise **Open map** | Feed failure, guessed opposite, both CTAs, expansion requirement, unsupported arrival, or no useful action |
| FALLBACK-002 — specification §§15.4–15.5 and 34 SPD-04, SPD-07 | Current high-impact service change leaves exact scope materially unresolved | **Service change—arrivals are hidden until the stopping pattern is confirmed.** with only **View service change** and official detail; unrelated service remains | Generic Affected as proof, guessed pattern, resolved bypass shown as unresolved, hidden unrelated service, or optimistic row |
| FALLBACK-003 — specification §§11, 15.5 and 34 SPD-05 | Route/feed Unavailable; owner has replaced frozen recovery context; eligible schedule and no veto | **Live data unavailable. Showing scheduled times.** with only **Refresh live data**; separated clock times retain **Scheduled** and currency treatment | Healthy/Degraded use, premature fallback, countdown, unlabeled static, frozen Live mixed with Scheduled, or cleared veto |
| FALLBACK-004 — specification §§15.4–15.5 and 34 SPD-04, SPD-07 | Resolved exact line/scope is not serving the station | **This line is not serving this station right now.** with only **Open map** preserving scope and unaffected service | Prediction absence, generic Affected, unresolved scope, complex-wide widening, or hidden unrelated routes |
| FALLBACK-005 — specification §§14.2 and 15.5 | Current location unavailable and a last coherent station exists | **Location unavailable. Showing your last station.** with only in-state **Choose a station**; persistent retry may remain outside the component | Last station called current/nearest, blank search, feed/offline conflation, two in-state CTAs, or silent station replacement |

### Board and direction family

Applying artifacts: [station board contract](station-board-and-controls-contract.md), [Nearby card contract](nearby-card-and-direction-contract.md), [visual and reachability standard](underground-visual-and-reachability-standard.md), and companion guidance only where a verified result exists. Outcome owner: Experience Product Lead.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| BOARD-H01 — specification §§15.1–15.5 | Open a supplied card direction, inspect compact header, rows, localized alerts, row disclosure, and close | Header retains station/routes/walk/entrance/saved/accessibility/disruption while arrivals stay primary; rows retain time/state, route/destination, direction/exception, warning, verified guidance; disclosure preserves station/direction/order; return restores origin context | Admission/reorder on expansion, lost destination/state, widened alert, raw IDs, suppressed-row placeholder, unsupported guidance, or context loss |
| BOARD-OH01 — Task 5 fixture OH-01; specification §§15.2 and 16.5 | Board on one direction with filters, warnings, saved/accessibility state, and reading anchor; tap another visible direction once | One tap updates only direction-specific rows/entrance/path/platform/guidance and selected semantics; shared state and both reading anchors persist | Second tap, swipe-only discovery, guessed/copied rows, state upgrade, hidden warning, or station jump |
| BOARD-OH02 — Task 5 fixture OH-02; specification §§15.2 and 16.6 | Ordinary axis with one verified opposite and guidance orientation; tap **Reverse direction** | Board and verified orientation change atomically; prior incompatible guidance disappears; shared context persists | Board-only reversal, lagging/mirrored guidance, multi-axis opposite guess, hidden axis, or reclassification |
| BOARD-OH03 — Task 5 fixture OH-03; specification §§15.2 and 15.4 | Multiple routes; one affected route; deselect it through **Filter routes** | Rows hide for that route but redundant route-identified warning and official detail stay at exact scope; remaining order persists | Hidden disruption, cleared veto, Good service, line-wide widening, reorder, or color-only meaning |
| BOARD-OH04 — Task 5 fixture OH-04; specification §§13.2, 14.6, and 15.2 | Board with authoritative age and complete tuple; tap bottom **Refresh** | Only newly owner-accepted content and age change; station, direction, filters, accessibility, saved/guidance intent, and reading position persist | Tap-created now, reset age, scroll jump, filter/station/direction reset, state upgrade, or static backfill |
| BOARD-OH05 — Task 5 fixture OH-05; specification §§14.6, 15.2, and 16.5 | Same board with visible **Refresh**; pull to refresh | Same request/truth rules as OH-04; direct control remains visible before, during, and after | Pull as sole path, hidden control, different truth rule, gesture-created freshness, or context reset |
| BOARD-OH06 — Task 5 fixture OH-06; specification §§15.1, 16.5, 26.1, and 26.3 | Unsaved station board; tap **Save station** | Only saved state changes; header and bottom control agree; board/order/truth/accessibility/warnings/position persist; no account | Silent unsave, board rerank, admission/promotion, alert removal, accessibility/direction reset, or account prompt |
| BOARD-OH07 — Task 5 fixture OH-07; specification §§13.2, 15.2, and 17.3 | Board opened from Nearby; tap Map, interact, and return | Map carries station/direction; return restores exact board/filter/accessibility/saved/warning/evidence/reading context before refresh | Default station/direction, lost filter, top jump, stronger Map claim, hidden warning, stale orientation, or blank search |

### Operating-honesty family

Applying artifacts: [Nearby card contract](nearby-card-and-direction-contract.md), [station board contract](station-board-and-controls-contract.md), [offline validity contract](offline-content-and-validity-contract.md), [recovery contract](offline-degraded-and-reconnection-states.md), [arrival-truth acceptance catalog](../quality/arrival-truth-acceptance-catalog.md), and each linked upstream owner artifact. Outcome owner: the named Arrival Truth owner; Release Quality records local application.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| HON-S01 — specification §31.1 scenario 1 / AT-S01 | Current healthy feed; coherent moving train; exact future directional stop; every gate passes | One chronological primary row with route, actual destination, supported rounded countdown, and **Live**, equivalently spoken | Proximity admission, wrong direction, unsupported precision, duplicate, reorder, or second local admission |
| HON-S02 — specification §31.1 scenario 2 / AT-S02 | Assigned origin train; all gates pass; one stable update, second stable update, then movement | No row after first update; one **Expected** range after second; the same row becomes **Live** after movement and stays chronologically placed | Expected after one update, pre-movement countdown, static fill, duplicate/new identity, or visual Live promotion |
| HON-S03 — specification §31.1 scenario 3 / AT-S03 | Healthy complete replacement period lacks the static trip | No row and no backfill; use the cause-supported horizon gap when applicable | Static restoration, Scheduled in healthy live board, cancellation claim, or padding to three |
| HON-S04 — specification §31.1 scenario 4 / AT-S04 | Exclusive coherent one-to-one identifier replacement | One continuous rider row with no visible identifier change and no position reset | Duplicate, raw ID, time-only merge, path discontinuity, or new rider row |
| HON-S05 — specification §31.1 scenario 5 / AT-S05 | Ambiguous one-to-many/many-to-one or conflicting identity facts | No guessed merge; only an independently qualified stronger candidate may appear; otherwise neither appears with cause-supported board limitation | Both shown as proven, guessed continuity, exposed quarantine/IDs, or unqualified primary slot |
| HON-S40 — specification §31.7 scenario 40 / AT-S40 | Trip spans midnight or uses beyond-24:00 notation | Preserve owner-supplied operating service date, New York presentation, identity, order, validity, and assistive meaning across every applying surface | Calendar-date reassignment, duplicate, negative duration, reordered train/leg, or phone-date selection |
| HON-S41 — specification §31.7 scenario 41 / AT-S41 | Fixed daylight-saving transition and owner-supplied chronology | Preserve one identity and authoritative order; displayed local times remain explainable; no duplicate, reverse, or lost leg/row | Phone arithmetic, duplicate, reorder, negative duration, merged identities, or hidden transition |
| HON-S42 — specification §31.7 scenario 42 / AT-S42 | Phone clock differs from feed clock within owner-evaluated fixture | Freshness, age, order, and labels use authoritative source time and owner-approved skew handling; assistive output agrees | Phone-clock age, refresh time as source time, fabricated tolerance, Live upgrade, or hidden uncertainty |
| HON-S43 — specification §31.8 scenario 43 / AT-S43 | Later validated schedule overlaps earlier only for a bounded claim scope | Later edition wins inside overlap; earlier remains separately eligible outside overlap only when all gates pass; visible currency/service-date treatment persists | Global supersession, cherry-pick earlier inside overlap, erased earlier outside overlap, age reset, or optimistic selection |
| HON-S44 — specification §31.8 scenario 44 / AT-S44 | Stored supplement is 3 hours, exactly 24 hours, then first value greater than 24 hours | 3 hours and exactly 24 hours are **Stale reference** with Scheduled clock time only when eligible and exact stale copy; greater than 24 hours is Topology only with no departure time | Current label, countdown, unlabeled schedule, departure after boundary, borrowed service date, or reference called Live |
| HON-S49 — specification §31.8 scenario 49 / AT-S49 | Retrieve canonically unchanged schedule content with changed wrappers/times | Retain one edition identity and original accepted age anchor; Last retrieved may change; truthful currency ages | New edition, reset age, restored Current state, altered chronology, or lost supersession edge |
| HON-S50 — specification §31.8 scenario 50 / AT-S50 | Earlier Expected range precedes later Live trains without overlap | Expected remains eligible and first in the owner-supplied chronological next-three list with exact state/range | Global Live-first order, Expected demotion/removal, changed range, or local resort |

### Underground family

Applying artifacts: [underground visual and reachability standard](underground-visual-and-reachability-standard.md) and [station board contract](station-board-and-controls-contract.md). Outcome owner: Experience Product Lead; Release Quality Lead records measurements; Accessibility leads assistive review.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| UG-A01 — Task 6 arm's-length audit; specification §§16.1–16.2 | Final dark-default narrow portrait board at 60 cm for one five-second exposure with Live, Expected, Holding, long destination, exception, and warning | Reviewers identify the next decision and exact five-level visual order; levels 1–4, destination, and evidence label remain readable without zoom/disclosure | Dense table, fine gray primary text, subtle-color-only meaning, hidden destination/state, or level 5 competing with decisions |
| UG-A02 — Task 6 poor-light audit; specification §16.2 | Final dark and rider-selected light renders at 5 lux with every text, focus, boundary, route, warning, and state family | Every text element at every supported size measures at least 4.5:1; essential non-text boundaries/focus at least 3:1; all alerts retain text and spoken meaning | Unmeasured token claim, sub-threshold element, muted primary information, color-only alert/state, or theme changing service meaning |
| UG-A03 — Task 6 large-text audit; specification §§16.1, 16.3 | Narrowest supported portrait view at every supported text size with longest labels, Scheduled/Holding, reroute, blocking warning, controls, and sheet | Complete destination/evidence label and five-level priority remain; no horizontal decision scroll; all controls remain and measure at least 48 by 48; sheet preserves station/direction | Truncation/ellipsis, hidden label, fixed row crop, unsupported smaller text, missing control, or lost sheet context |
| UG-A04 — Task 6 no-color audit; specification §16.2 | Board and filter sheet with colors removed/equal luminance plus screen-reader capture | Every route survives through letter/number, applicable shape, and spoken name; direction/state/warning/accessibility/hypothetical capacity meaning remains textual and semantic | Hue/brightness/position-only route or state, route identity confused with reroute, unlabeled icon, or crowding enablement |
| UG-A05 — Task 6 assistive-order audit; specification §16.3 | Screen-reader captures for normal, rerouted, Holding, and new blocking path change while focus is elsewhere | Read route/destination, time/state, evidence, direction/exception, warning, then verified guidance; visible/spoken meaning agrees; blocking change announces scope/action without full-screen reread; focus remains coherent | Different route/order/state, omitted warning, repeated full-screen announcement, lost focus, unlabeled control, or unsupported guidance |
| UG-A06 — Task 6 one-handed audit; specification §§16.4–16.5 | Final layouts at default/largest text for every viewport and both hands; all nine Task 5 controls, sheets, reverse, refresh gesture/direct action, save, destinations, and return | Every available core hit target measures at least 48 by 48 and lies fully in lower third; gestures have visible equivalents; labels name result; sheets retain context; single-tap behavior persists | Undersized/out-of-reach target, gesture-only action, ambiguous destructive/mode label, hidden destination, or context-losing sheet |
| UG-RM01 — Task 6 reduced-motion fixture; specification §16.6 | Enable reduced motion; exercise reverse, refresh, stale, degraded, and Holding transitions | Full visible/spoken meaning remains with instantaneous/static finite treatment; countdown/animation stops when stale or Holding; focus/order/labels remain | Loop, pulse, perpetual train motion, movement-required meaning, decrementing Holding/stale value, or reduced-motion content loss |

### Rights family

Applying artifacts: [underground visual and reachability standard](underground-visual-and-reachability-standard.md), [map contract](map-modes-and-journey-behavior.md), and [offline validity contract](offline-content-and-validity-contract.md). Outcome owner: Experience Product Lead for inventory; Task 15 will own release disposition.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| RIGHTS-01 — specification §§33.4 and 34 SPD-08 | Inventory every exact map, symbol, bullet artwork, logo, line-color reference, and product-created treatment in the fixed candidate; inspect durable permission/no-dependency record | Every used protected asset has applicable version/use/distribution/attribution/date rights or is removed; product-created fallback has recorded no-dependency review; rerun visual/assistive cases; route identity remains complete without protected color/art | Public protected asset without rights, feed/public-reference treated as license, copy-only waiver, missing inventory, or rights failure softened by utility |

### Map family

Applying artifacts: [map modes and journey behavior](map-modes-and-journey-behavior.md), [experience contract](experience-contract.md), [visual standard](underground-visual-and-reachability-standard.md), [offline validity contract](offline-content-and-validity-contract.md), and accepted upstream/companion inputs. Outcome owner: Experience Product Lead.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| MAP-AX01 — specification §§17.1–17.2 | Freeze complete Map tuple; separately change appearance, service layer, spatial view, overlay, pan/zoom, and deliberate centering | Each action changes only its owned axis/value; labels/semantics expose all current values; return restores complete tuple before refresh | Theme selects service, clock selects late night, view changes pattern, overlay recenters, pan changes selection, or return resets tuple |
| MAP-NOW01 — specification §§17.2–17.3 and 34 SPD-09 | Actual now selected; one scope or all useful current evidence becomes unavailable | Preserve tuple and Actual-now intent; disable/withhold unsupported current geometry at narrow scope; offer explicit Typical weekday/Late night choices; unrelated supported service remains | Cached/reference geometry under Actual now, automatic reference selection, normal-pattern fill, whole-network failure from one scope, or hidden unavailable explanation |
| MAP-R01 — Task 7 reroute fixture; specification §§17.2–17.3 and scenarios 6–8 application | Dark, Actual now, Schematic, selected F; accepted resolved F-via-E sequence/path and official detail | Keep F identity; redraw only accepted segment; mark every omitted stop **Skipped** visibly/spoken; preserve unchanged F and unrelated service; unresolved branch withholds affected geometry | Banner-only change, guessed/normal geometry, route rename, color-only skip, hidden unaffected service, static host stop, or invented accessibility |
| MAP-S25 — specification §31.4 scenario 25 | Source-supported service date/times and eligible schedule candidates cross weekday-to-late-night boundary | Keep one itinerary; identify exact boundary and consequence; preserve order/identity/state; show reference/Not current, currency, and service-date context; Task 9 preserves it | Split itinerary, phone-clock/midnight/theme switch, duplicate/reorder, hidden boundary, superseded/topology-only timed source, Live regular GTFS, or invented timing |
| MAP-COV01 — specification §§11.2 and 17.4; Arrival Truth FB6 | A usable supplemented mask covers the future route/scope, service date, effective time, and horizon but omits a regular-GTFS occurrence in one branch and its exact stop in another | Use only explicit coherent supplemented occurrences; show no timed alternative for either omission; preserve reference/currency context and add no cancellation or bypass claim without independent evidence | Per-occurrence regular fallthrough, weekend/normal merge, reconstructed stop, Live/current implication, or omission treated as negative operational proof |
| MAP-GEO01 — specification §§17.3–17.5 | Switch Schematic/Geographic; plan options including safer direct and fragile faster transfer; repeat a fully tied set with the same owner decisions and canonical journey/accessibility identities but shuffled source, retrieval, wrapper, and enumeration order | Preserve selected layer/route/station/direction/overlays; only geographic evidence supplies walking; rank validity, accessibility, risk, transfers, walk, then ETA; show a material alternative when supported; in the tied repeat, use only the neutral stable canonical identity and preserve the same primary choice and bounded-list membership without a superiority claim | Schematic distance, centroid walk, ETA-first optimism, promised connection, invented alternative, accessibility weight replacing hard constraint, source-order tie-break, changed tied cutoff, or canonical identity presented as better/shorter/safer |

### Offline family

Applying artifacts: [offline content and validity contract](offline-content-and-validity-contract.md), [map contract](map-modes-and-journey-behavior.md), [trip-card contract](offline-trip-card-and-progress-contract.md), and [recovery contract](offline-degraded-and-reconnection-states.md). Outcome owner: Experience Product Lead; schedule and accessibility owners supply accepted inputs.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| OFF-MAP01 — specification §§18.1, 18.3 and §29.2 | Offline; rights-cleared stored Typical weekday vector exists; deliberately select it | Open without network waiting; **Typical weekday** and exact **Reference pattern—not live.** remain in controls, legend, route/station context, and assistive output; preserve Map tuple | Spinner/network gate, auto-selection, reference under Actual now, Live/current alert/reroute/equipment meaning, reset, or uncleared asset |
| OFF-MAP02 — specification §§18.1, 18.3 and §29.2 | Offline; rights-cleared stored Late night vector exists; deliberately select it | Open without network waiting; **Late night** and exact reference copy persist everywhere mistaken-current risk exists; tuple persists | Phone-time selection, network gate, auto-selection, Actual-now label, current overnight/equipment claim, reset, or uncleared asset |
| OFF-V01 — Task 8 availability case 1; specification §§18.1–18.3 | Exact eligible stored Current schedule at 0–2 hours with coverage and vetoes passing | Timed **Reference itinerary** may show covered clock time with **Scheduled**, Current schedule, truthful anchor/Last retrieved/effective/service date, exact map copy; accessibility wording only with complete chain and Unknown operation | Countdown, Live/Expected/current change/equipment, Accessible now, regular-GTFS invention, age reset, or veto clearing |
| OFF-V02 — Task 8 availability case 2; specification §§18.1–18.3 and scenario 44 | Exact eligible Stale schedule just over 2 through exactly 24 hours | Timed but visibly stale **Reference itinerary** with **Scheduled**, Stale reference, exact **Stored schedule—service changes may differ**, truthful lineage, map copy, and Unknown equipment | Normal-looking/current schedule, omitted stale copy, countdown, Live/current, borrowed date, regular invention, or veto clearing |
| OFF-V03 — Task 8 availability case 3; specification §§18.1–18.3 and scenario 44 | Exact schedule age first greater than 24 hours | Rights-cleared topology remains; show **Untimed structural route/path**, Topology only, exact map copy, and no departure/arrival time; complete structural accessibility wording only when eligible, operation Unknown | Timed itinerary, Scheduled, countdown, current claim, stored regular departure, Accessible now, or age/currency upgrade |
| OFF-V04 — Task 8 availability case 4; specification §§18.1–18.3 | Stored schedule does not cover requested service date | Show only untimed structural result with requested service date, mismatch, exact map copy, and no departure time | Borrowed trip/time/date, midnight reassignment, timed itinerary, current claim, regular invention, or veto clearing |
| OFF-V05 — Task 8 availability case 5; specification §§18.1–18.3 | No eligible stored schedule | Show stored structural utility and **Untimed structural route/path** with exact map copy and no departure time | Invented supplement/regular departure, itinerary/service claim, countdown, Live/Expected/current, or inferred coverage |
| OFF-H01 — specification §§18.3–18.4 and 34 SPD-09–10 | Enter Offline with cached arrival, alert, path/equipment, guidance, schedule, and Map values | Exact persistent Offline banner; every cached operational value becomes historical with its own New York last-checked time; countdown/motion stop; route-critical equipment Unknown; adverse outage may retain **Out of service—status being rechecked**; no batch time | Active/unlabeled Live cache, advancing value, Good service, current path/guidance/equipment, batch/phone time, frozen Live plus Scheduled, or reference auto-selection |

### Trip family

Applying artifacts: [offline trip-card and progress contract](offline-trip-card-and-progress-contract.md), [offline validity contract](offline-content-and-validity-contract.md), [map contract](map-modes-and-journey-behavior.md), and [recovery contract](offline-degraded-and-reconnection-states.md). Outcome owner: Experience Product Lead; companion owners supply conditional content.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| TRIP-S24 — specification §31.4 scenario 24 / Task 9 TRIP-T24 | Explicit pre-descent capture with core content, one verified exit/contingency, claim-specific times; lose connectivity; use **I'm at this stop** through transfer and completion; reconnect | Card opens without account/network wait; ordered stops/transfers/reference remain; cursor alone changes; claims/times/warnings do not; exact recovery order preserves card and cursor; completion remains rider-confirmed | Inferred movement/arrival/transfer, refreshed time, countdown/current claim, cleared veto, replan/contingency activation, hidden direction, progress reset, or trip history |
| TRIP-A01 — Task 9 accessible-trip fixture; specification §§18.2–18.3 and 34 SPD-10 | Accessible Route Only on; companion supplies complete exact stored chain and equipment identities | Preserve full chain; every route-critical operational state Unknown offline; show **Structurally step-free; live elevator status unavailable** only while complete; cursor remains non-operational; incomplete branch withholds positive result | Badge/partial/wrong-direction/stair substitute, Accessible now, Working, progress-as-proof, or unverified contingency |
| TRIP-S51 — specification §31.8 scenario 51 / Task 9 TRIP-M51 | Capture core-complete trip with exit and platform-zone guidance unavailable; run one-contingency and zero-contingency branches | Both cards retain all core fields, schedule/accessibility limits, and manual progress; omit exit/zone modules; retain exact verified contingency when present and omit whole module when absent; no error/placeholder; assistive output matches | Invented exit/zone/contingency/time/service/equipment, blank heading, skeleton, coming soon, incomplete label, countdown, Live, or Accessible now |

### Recovery family

Applying artifacts: [offline, degraded, and reconnection contract](offline-degraded-and-reconnection-states.md), [station board contract](station-board-and-controls-contract.md), [trip-card contract](offline-trip-card-and-progress-contract.md), and owner-supplied accessibility/service-change/arrival/guidance decisions. Outcome owner: Experience Product Lead; Operations reviews warning order.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| REC-S23 — specification §31.4 scenario 23 / Task 10 OFF-T23 | Full board, Map, trip, cursor, warnings, and claim-specific times; governing connectivity becomes Offline in tunnel, then returns | Enter Offline without invented delay; exact banner persists; full tuple remains; cached values become historical; stored content stays honest; reconnect through exact stages; final tuple and warning persistence remain | Offline inferred from location/feed, blank/search/reset/recenter, active cache, batch time, auto-reference, one-snapshot arrival, warning late, silent replan, or progress reset |
| REC-ORDER01 — specification §18.4 | Connectivity returns with active trip dependencies | Commit in order: 1 path/equipment, 2 active service changes, 3 arrivals after owner recovery, 4 positioning/transfer, 5 background maps/unrelated Saved; each earlier owner accepts or fails closed before next | Request/commit out of order, arrival before veto, first snapshot restoration, background focus movement, stale guidance, or manual cursor as evidence |
| REC-WARN01 — specification §18.4 and Task 10 invalidation fixtures | Stage 1–4 accepts a blocking change plus control branches for positioning loss, ETA change, no verified arrival, and unverified alternative | Blocking branch interrupts unrelated refresh, states exact changed fact/scope/consequence/time and last safe point when supportable, announces before focus moves, offers only verified alternative, and persists until governed resolution; controls remain bounded | Vague/widened warning, warning after lower priority, unsafe exit, unverified alternative, automatic replan/contingency, acknowledgement/time/navigation clearing, or control branch escalated to cancellation/invalidation |

### Saved family

Applying artifacts: [saved-station and personalization contract](saved-station-and-personalization-contract.md), [ranking rules](station-ranking-and-entrance-rules.md), [Nearby card and direction contract](nearby-card-and-direction-contract.md), [station board contract](station-board-and-controls-contract.md), [recovery contract](offline-degraded-and-reconnection-states.md), and [privacy rules](location-and-personal-data-rules.md). Outcome owner: Experience Product Lead; Privacy Lead owns lifecycle assurance.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| SAVE-C01 — Task 11 continuity fixture; specification §§26.1–26.2 | Active saved record with all fields and hidden-route disruption; open, change session direction, visit Map, go Offline, return via Saved, reconnect | Immediate no-account open; saved intent stays unchanged; every route/direction refreshes; affected filtered warning remains; Offline/reference labels are honest; reconnection follows Task 10 order without focus/record mutation | Network/account wait, implicit save, hidden disruption, silent entrance/path/direction substitution, active cache, auto-reference, context jump, or recovery mutation |
| SAVE-R01 — Task 11 controls fixture; specification §§26.1, 26.3 and 28.3 | Active record with every field and open board; inspect, make/cancel session edit, pause, reset station preferences, delete while open | Inspection exact; cancel no-op; pause retains openable card but removes influence; reset clears only optional station fields while keeping station and active/global accessibility constraint; delete removes card but keeps coherent unsaved board and official truth | Silent edit, inferred replacement, pause deletion/reactivation, disabled accessibility, broad reset mislabeled, blank/navigation jump, or deleted official information |
| SAVE-UR05 — Task 11 UR-C05 application; specification §26.2 | Active explicit preference for farther B inside rider-entered window; closer A remains usable | Apply Task 3 eligibility first; show exact saved-preference explanation, both walks/usability, and closer A; outside window or Paused removes influence | Hidden A, B called nearest, inferred window/habit, preference overriding hard exclusion, or operational truth change |
| SAVE-O01 — Task 11 multiple-preference cutoff; specification §§14.4 and 26.2 | Baseline A, B, C, D; applicable Active preferences B, C, D; repeat with shuffled saved-record and retrieval order | Only baseline-first-three B and C form the promoted cohort in baseline order; final first three are B, C, A; D remains available outside automatic Nearby | Save-time ordering, C-before-B churn, D cutoff entry, hidden A, four automatic cards, arrival-based promotion, or recent-open inference |

### Privacy family

Applying artifact: [location and personal-data rules](location-and-personal-data-rules.md), with the named product artifact under test. Outcome owner: Privacy Lead; Release Quality records observable and storage evidence.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| PRIV-L01 — Task 12 location-choice parity; specification §§28.1–28.2 | Equivalent precise, approximate, and three denied branches; exercise ranking, Map centering, and truth | Complete core utility; one transient permitted result only; approximate is not an error; denial precedence exact; Map centers only on request/approved initial transition; no retained coordinate/history; truth/accessibility unchanged | Background location, retained coordinate, upsell, repeated/bundled prompt, inferred current location, silent recenter, admitted train, cleared veto, or notification trigger |
| PRIV-M01 — Task 12 minimized bounded state; specification §28.3 | Fill reviewed recent bound, replace last-used/context/active trip, then broad reset | Only explicit bounded/singular state exists; replacement creates no history; reset discloses cleared/retained categories and preserves active accessibility constraint | Undeclared/unbounded/passive recents, hidden archive, trip/context history, inferred habit, silent accessibility change, or false completion |
| PRIV-S01 — Task 12 private saved data/reset/deletion; specification §28.3 | Local saved stations, active trip/cursor, and companion commute; run per-item, broad reset, and deletion | Per-item controls remain bounded; broad actions disclose scope and category results; official/offline structural content and OS permission remain; completion waits for every covered copy | Public/default sharing, account gate, broad/per-item conflation, deleted official/map data, changed OS permission, fabricated companion result, or early completion |
| PRIV-Q01 — Task 12 diagnostic separation; specification §28.3 | Reproduce one operational decision with minimum allowed record; attempt rider key, saved context, location, and reversible join variants | Authorized non-personal operational record only with purpose/access/end; every personal/joinable variant rejected; Task 14 receives approved aggregate or omits measure | Rider/account/device/token/pseudonym, location/permission/saved/trip/search context, join path, indefinite retention, export, or collection when separation fails |
| PRIV-N01 — Task 12 notification separation; specification §28.2 | Launch/use every Nearby/Map/Saved/offline surface, save commute without alerts, then explicitly enable first commute alert and deny notification | No Nearby/offline or save-only prompt; explicit first-alert action alone hands off to companion; denial preserves location and product utility; Nearby retains no token/prompt history | Prompt on any prohibited surface/event, bundled permission, default alert, denial penalty, or Task 12-invented companion prompt/state |

### Measurement family

Applying artifacts: [measurement plan](measurement-plan.md) and [location and personal-data rules](location-and-personal-data-rules.md), plus the exact outcome-owner artifacts named by each measure. Outcome owner: Measurement Lead; Release Quality owns evidence disposition.

| Case ID and source | Precondition, starting tuple, and action | Expected visible and assistive result | Prohibited result |
|---|---|---|---|
| MEAS-A01 — Task 13 north-star anti-gaming; specification §30.1 | Fixed cohort includes qualified, unqualified fast, Scheduled, suppressed-all, removed-label, failed, and incomplete later-outcome views | Numerator contains only current coherent boardable options with determinate contradiction-free outcome; every eligible view stays denominator; missing/failed cases remain non-success | Unqualified/Scheduled/unlabeled/suppressed/unknown-later success, removed denominator, engagement-derived truth, or 0/0 Pass |
| MEAS-A02 — Task 13 usefulness boundaries; specification §29.2 | Fixed warm, healthy-feed/location, controls, Offline opens, and geography-permits cohorts | Evaluate exact 0.5-second shell, 2-second median, 4-second p95, immediate perception without invented milliseconds, no-network-wait map/trip, and three truthful cards | Skeleton as shell, Scheduled stopping clock, unexercised control substitution, missing open removed, padded card, or invented threshold |
| MEAS-A03 — Task 13 required segments; specification §§29.2 and 30 | Report permission, lifecycle, connectivity, topology, Accessible Route Only, and service pattern one dimension at a time | Overall and every adequate segment appear; Not run, inadequate, suppressed, and Run — Inconclusive cells remain visible; failed segment is not averaged away | All-dimension join, hidden weak/small cell, overall-only result, rider history inference, or failed segment averaging |
| MEAS-A04 — Task 13 privacy separation; specification §§28.3 and 30 | Submit approved aggregate and prohibited personal/joinable variants | Accept only fixed versions, reviewed window, one coarse segment or approved limited intersection, aggregate counts/outcomes, owner/purpose/access/end, and non-personal reference; reject every personal/reconstructable variant | Extra service-pattern dimension, row event, rider/device/stable key, coordinate/station/query/saved/trip/cursor detail, precise joinable time, feedback text, or unsafe cell |
| MEAS-A05 — Task 13 zero and absent evidence; specification §30 | Exercise zero denominator, absent phenomenon in an actual run, incomplete lineage, and absent companion inputs | Apply the measurement plan's result vocabulary without converting any empty/absent/incomplete/Pending state to success; current unrun case remains **Not run — Pending** | 0/0 Pass, silence as zero, missing feedback as positive, absent incident as safety proof, or companion Pending accepted |
| MEAS-A06 — Task 13 guardrail precedence; specification §30.3 | Fixed run has faster/higher-engagement results plus one accepted zero-target violation or systematic false suppression | Guardrail layer fails and appears before timing/engagement; release effect blocks regardless of utility | Weighted average, speed/engagement override, hidden violation, companion absence treated as zero, or Gate 0 change |
| MEAS-A07 — Task 13 failure preservation; review policy scenario rules | Record a failing attempt, correction, and fixed-version rerun | Preserve original inputs/actual/review/disposition; link correction and new attempt/version; later result does not overwrite history | Edited failure, reused attempt/version, erased reviewer decision, unlinked rerun, or approval pointing only to latest favorable result |

## Current A01 attempt registry

Each row below is a separate append-only attempt record. Its complete record is the union of: (1) the case's definition row, including approved source, precondition, starting state, action, expected result, and prohibited result; (2) the family applying-artifact and outcome-owner line; (3) the required-field schema; and (4) the **NR-01** current field set. No row borrows an actual result, attachment, measurement, or reviewer decision from another row. The current release effect of every row is blocking; each preserves **NO-GO — GATE 0 NOT PASSED**.

### Context, startup, and permission attempts

| Case ID | Stable attempt ID | Field-set binding | Observed disposition |
|---|---|---|---|
| CTX-DEST01 | CTX-DEST01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CTX-RETURN01 | CTX-RETURN01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| START-WARM01 | START-WARM01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| START-COLD01 | START-COLD01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| START-FIRST01 | START-FIRST01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-P01 | PERM-P01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-P02 | PERM-P02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-S22A | PERM-S22A-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-S22B | PERM-S22B-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-S22C | PERM-S22C-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PERM-TEMP01 | PERM-TEMP01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |

### Nearby, useful-card, refresh, fallback, board, and honesty attempts

| Case ID | Stable attempt ID | Field-set binding | Observed disposition |
|---|---|---|---|
| NEAR-S21 | NEAR-S21-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| NEAR-Z01 | NEAR-Z01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR01 | CARD-UR01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR02 | CARD-UR02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR03 | CARD-UR03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR04 | CARD-UR04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR05 | CARD-UR05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR06 | CARD-UR06-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-UR07 | CARD-UR07-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-RC01 | CARD-RC01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-RC02 | CARD-RC02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-RC03 | CARD-RC03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| CARD-RC04 | CARD-RC04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| REFRESH-BG01 | REFRESH-BG01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| REFRESH-FL01 | REFRESH-FL01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| FALLBACK-001 | FALLBACK-001-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| FALLBACK-002 | FALLBACK-002-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| FALLBACK-003 | FALLBACK-003-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| FALLBACK-004 | FALLBACK-004-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| FALLBACK-005 | FALLBACK-005-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-H01 | BOARD-H01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH01 | BOARD-OH01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH02 | BOARD-OH02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH03 | BOARD-OH03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH04 | BOARD-OH04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH05 | BOARD-OH05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH06 | BOARD-OH06-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| BOARD-OH07 | BOARD-OH07-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S01 | HON-S01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S02 | HON-S02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S03 | HON-S03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S04 | HON-S04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S05 | HON-S05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S40 | HON-S40-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S41 | HON-S41-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S42 | HON-S42-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S43 | HON-S43-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S44 | HON-S44-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S49 | HON-S49-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| HON-S50 | HON-S50-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |

### Underground, rights, and map attempts

| Case ID | Stable attempt ID | Field-set binding | Observed disposition |
|---|---|---|---|
| UG-A01 | UG-A01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-A02 | UG-A02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-A03 | UG-A03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-A04 | UG-A04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-A05 | UG-A05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-A06 | UG-A06-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| UG-RM01 | UG-RM01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| RIGHTS-01 | RIGHTS-01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-AX01 | MAP-AX01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-NOW01 | MAP-NOW01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-R01 | MAP-R01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-S25 | MAP-S25-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-COV01 | MAP-COV01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MAP-GEO01 | MAP-GEO01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |

### Offline, trip, recovery, saved, privacy, and measurement attempts

| Case ID | Stable attempt ID | Field-set binding | Observed disposition |
|---|---|---|---|
| OFF-MAP01 | OFF-MAP01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-MAP02 | OFF-MAP02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-V01 | OFF-V01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-V02 | OFF-V02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-V03 | OFF-V03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-V04 | OFF-V04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-V05 | OFF-V05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| OFF-H01 | OFF-H01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| TRIP-S24 | TRIP-S24-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| TRIP-A01 | TRIP-A01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| TRIP-S51 | TRIP-S51-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| REC-S23 | REC-S23-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| REC-ORDER01 | REC-ORDER01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| REC-WARN01 | REC-WARN01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| SAVE-C01 | SAVE-C01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| SAVE-R01 | SAVE-R01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| SAVE-UR05 | SAVE-UR05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| SAVE-O01 | SAVE-O01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PRIV-L01 | PRIV-L01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PRIV-M01 | PRIV-M01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PRIV-S01 | PRIV-S01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PRIV-Q01 | PRIV-Q01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| PRIV-N01 | PRIV-N01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A01 | MEAS-A01-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A02 | MEAS-A02-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A03 | MEAS-A03-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A04 | MEAS-A04-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A05 | MEAS-A05-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A06 | MEAS-A06-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |
| MEAS-A07 | MEAS-A07-A01 | Definition + applying artifacts + NR-01 | **Not run — Pending** |

## Task 1–13 artifact traceability

Every Task 1–13 product artifact named by the plan is mapped as a **Draft/Pending input** to at least one case. These mappings are preparatory: they do not claim that the artifacts are accepted, do not advance their lifecycle, and do not satisfy Task 14's acceptance dependency. The case definitions above retain a direct approved-specification or approved-plan requirement reference, so the mapping does not create a new source of truth.

| Plan task | Product artifact (Draft/Pending input) | Applying cases | Traceability boundary |
|---|---|---|---|
| 1 | [Experience contract](experience-contract.md) | CTX-DEST01, CTX-RETURN01, START-WARM01, NEAR-Z01, MAP-AX01 | Persistent information architecture, state tuple, destination/context ownership, and return restoration |
| 2 | [Zero-tap startup and permission flow](zero-tap-startup-and-permission-flow.md) | START-WARM01, START-COLD01, START-FIRST01, PERM-P01, PERM-P02, PERM-S22A–PERM-S22C, PERM-TEMP01 | Startup shell, one purpose screen, one controlled prompt, denial precedence, and temporary-use lifecycle |
| 3 | [Station ranking and entrance rules](station-ranking-and-entrance-rules.md) | NEAR-S21, CARD-UR01–CARD-UR07, SAVE-UR05, SAVE-O01 | Eligibility-first useful-entrance ranking, deterministic neutral tie handling and cutoff, useful-card target, explicit preference boundary, and deterministic multi-preference handoff |
| 4 | [Nearby card and direction contract](nearby-card-and-direction-contract.md) | CARD-RC01–CARD-RC04, BOARD-H01, HON-S50, SAVE-O01 | Card anatomy, all passenger-serving directions, honest next-three, label/action separation, state meanings, and preserved three-card preference cohort |
| 5 | [Station board and controls contract](station-board-and-controls-contract.md) | REFRESH-BG01, REFRESH-FL01, FALLBACK-001–FALLBACK-005, BOARD-H01, BOARD-OH01–BOARD-OH07 | One-tap controls, exact fallback matrix, refresh preservation, headings, actual destination, and disclosure |
| 6 | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md) | UG-A01–UG-A06, UG-RM01, RIGHTS-01 | Dark-first visual hierarchy, non-color identity, large text, assistive order, motion, reach, targets, and protected-asset inventory |
| 7 | [Map modes and journey behavior](map-modes-and-journey-behavior.md) | MAP-AX01, MAP-NOW01, MAP-R01, MAP-S25, MAP-COV01, MAP-GEO01, OFF-MAP01–OFF-MAP02 | Independent axes, Actual-now failure, reroute geometry, pattern boundary, supplemented coverage ownership, spatial evidence, and stored map modes |
| 8 | [Offline content and validity contract](offline-content-and-validity-contract.md) | OFF-MAP01–OFF-MAP02, OFF-V01–OFF-V05, OFF-H01, TRIP-A01 | Instant stored content, exact age/coverage boundaries, topology-only fallback, structural accessibility, and historical operational values |
| 9 | [Offline trip card and progress contract](offline-trip-card-and-progress-contract.md) | TRIP-S24, TRIP-A01, TRIP-S51 | Explicit capture, complete core card, rider-confirmed progress, accessible-claim boundary, and conditional-module omission |
| 10 | [Offline, degraded, and reconnection states](offline-degraded-and-reconnection-states.md) | REC-S23, REC-ORDER01, REC-WARN01, OFF-H01 | Explicit connectivity state, preserved tuple, owner recovery order, and blocking active-trip warning |
| 11 | [Saved station and personalization contract](saved-station-and-personalization-contract.md) | SAVE-C01, SAVE-R01, SAVE-UR05, SAVE-O01 | Private no-account continuity, hidden-route warning, pause/reset/delete scope, explicit preference, and deterministic multi-preference cutoff |
| 12 | [Location and personal-data rules](location-and-personal-data-rules.md) | PRIV-L01, PRIV-M01, PRIV-S01, PRIV-Q01, PRIV-N01 | Approximate/denied parity, no background dependency, bounded private storage, reset/deletion, diagnostic separation, and notification boundary |
| 13 | [Measurement plan](measurement-plan.md) | MEAS-A01–MEAS-A07, START-WARM01, NEAR-Z01 | North star, anti-gaming, usefulness timing, required segments, privacy-safe aggregation, zero/absent rules, guardrails, and failure preservation |

## Evidence review and release handoff

An attempt may leave **Not run — Pending** only when its exact product/build, evidence-definition version, applying artifact versions, dependency results, immutable inputs, authoritative timestamps, scope, start and after tuples, visible and assistive outputs, measurements, attachments, and review package are recorded together. A partial branch, prototype, expected result, screenshot without provenance, document review, or dashboard without fixed lineage cannot populate an actual field.

The Release Quality Lead records each attempt without editing prior rows. Product, Accessibility, Data Quality, Content, Privacy, and Operations review the same fixed package and record named **Approve** or **Changes required** decisions. A missing decision keeps the attempt from **Run — Pass**. A correction links the original attempt to a new product or artifact version and a new sequential attempt ID; the original disposition, actual result, review, and release effect remain visible.

Task 15 may cite only exact attempt IDs and fixed evidence versions. It must keep a blocking release effect for any **Run — Fail**, **Run — Inconclusive**, or **Not run — Pending** truth, accessibility, privacy, offline-honesty, rights, or critical operational case. It cannot replace evidence with copy, utility timing, engagement, an empty incident log, or a later favorable run. Gate 0 remains controlled only by the authoritative exit record.

### Draft review checklist

- Every registered case has one approved-source definition, applying artifacts, owner, rider precondition, starting state, action, expected visible and assistive result, and prohibited result.
- Every A01 attempt uses NR-01, has no observed product result, and remains **Not run — Pending**.
- Headline scenarios 1–5, 21–25, 40–44, and 49–51 have local applying cases; upstream scenarios 6–20, 43–44, and 49–50 retain authoritative links; scenarios 26–39 and 45–48 retain companion links only.
- Tasks 1–13 each map to at least one acceptance case, and no map changes an owner's decision or implies acceptance.
- No public-arrival, accessibility, offline-currentness, privacy, notification, protected-asset, or release conclusion is inferred from expected prose or missing evidence.
- Approval evidence remains **Pending** and the release decision remains **NO-GO — GATE 0 NOT PASSED** until fixed working-product evidence and the authoritative gates support a change.
