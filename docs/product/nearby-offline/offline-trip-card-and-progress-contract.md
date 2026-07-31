# Offline trip card and manual progress contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §18.2, §31.4 scenarios 24–25 as applied, and §31.8 scenario 51; nearby-station and offline-experience plan Product artifact map and Task 9 Product artifacts, Ordered steps, and Acceptance evidence; Task 9 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; transfer scenario 24, accessible-trip walkthrough, scenario 25 trip-card application, minimum-complete scenario 51, and Nearby Task 14 evidence are absent |

## Purpose and authority

This contract owns explicit pre-descent capture of one active offline trip card, its required and conditional content, claim-attached last-checked treatment, retained contingencies, and rider-confirmed manual progress. The card remains available without an account or connection and consumes the stored-content and schedule decisions in the [offline content and validity contract](offline-content-and-validity-contract.md).

This contract does not create a service state, schedule edition, clock-time eligibility, service-date decision, accessible path, equipment state, exit or platform guidance record, transfer-likelihood state, contingency truth, persistent global offline message, reconnection sequence, personal-data retention rule, acceptance evidence, or release approval. It consumes those decisions without strengthening them. The [map modes and journey behavior contract](map-modes-and-journey-behavior.md) owns weekday-to-late-night pattern selection and explanation; the [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) and Task 8 own schedule truth and offline validity. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

The [offline, degraded, and reconnection states contract](offline-degraded-and-reconnection-states.md), Task 10, owns the persistent global Offline message, cached-current presentation, preserved-screen degradation, reconnection order, and active-trip invalidation warning. Task 12 owns retention, deletion, reset, synchronization, analytics, diagnostic separation, and broader personal-data rules. Task 14 owns observed Nearby/offline acceptance evidence. Tasks 10, 12, and 14 plus companion complete-path, equipment, exit, platform-zone, transfer, and contingency artifacts now exist as Drafts; their reviewer decisions and observed evidence remain Pending. This Draft records conditional consumption, not their approval.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. The three walkthroughs below are **Not run — Pending**. No fixed card, assistive output, companion truth package, Privacy decision, or Task 14 observation exists. Expected contract prose is not observed evidence or release permission.

## Governance reconciliation and mandatory Privacy review

The artifact header and Draft [artifact index](../artifact-index.md) row register Product, Accessibility, Data Quality, Content, and Privacy. The [review and approval policy](../review-and-approval-policy.md) requires Privacy because a saved origin, destination, direction, accessibility need, contingency, and manual trip position form personal travel context.

| Governance question | Current record | Required disposition |
|---|---|---|
| Registered reviewer set | Product, Accessibility, Data Quality, Content, Privacy | Reviewer routing is reconciled in the artifact header and Draft index row. |
| Applicable policy minimum | Product, Accessibility, Data Quality, Content, plus Privacy | Privacy must review the same fixed version because the card contains personal travel context. |
| Review evidence | Pending | Privacy and every other mandatory reviewer must decide on the same fixed version before advancement from **Draft**. |

This reviewer-routing reconciliation is not approval. This contract also does not define retention, deletion, reset, synchronization, analytics, diagnostics, or tracking. Those decisions remain with Task 12. Manual progress requires no underground location and cannot create a default movement history.

## One active trip and capture boundary

Capture exactly one active trip card only after the rider explicitly activates that trip and before the rider descends. The capture is a deliberate product action, not passive observation of searches, viewed routes, or movement.

The active card:

- opens immediately from device-held content without an account or network wait;
- remains the same active trip through offline use unless the rider explicitly chooses another trip;
- records capture time separately from every claim-specific last-checked or verification time;
- preserves the applicable Task 8 reference, service-date, schedule, and accessibility limits at capture; and
- does not create a trip-history surface, passive archive, continuous background-location dependency, or inferred movement record.

Card presence proves only that one active trip was captured. It does not prove that service, equipment, guidance, contingencies, or schedule evidence remains current.

## Required core card content

Every active trip card contains the following core fields. A missing core field makes the expected card incomplete. Legitimately unavailable exit, platform-zone, or contingency guidance does not; an accessibility-relevant trip still requires the complete eligible chain governed in the next section.

| Core content | Required scope | Claim boundary |
|---|---|---|
| Origin and destination | Rider-recognizable names plus exact constituent station or entrance scope when path-relevant | A complex name cannot erase entrance, direction, platform, or path distinctions |
| Direction and destination identity | Rider-recognizable bound direction paired with the actual destination or terminal for each leg | Never show a raw compass suffix, direction code, or route color alone |
| Route and ordered legs | Route letter or number, applicable shape and spoken identity, ordered leg sequence, and station sequence for each leg | Route identity never proves current stopping, service, or platform truth |
| Transfer instructions | Transfer station; incoming and outgoing route, direction, and destination; retained passage or action sequence; and owner-supplied connection state when available | Never promise a connection or invent a passage, platform, or likelihood |
| Claim-scoped service context | Exact route, direction, station, segment, leg, or trip scope; retained service state or consequence; and that claim's own last-checked time | Historical context never becomes a current alert, reroute, arrival, or normal-service claim |
| Claim-scoped equipment context | Exact official machine, connection, and affected path scope; retained observation; and that claim's own last-checked time | Every route-critical operational equipment state is **Unknown** offline |
| Rider-confirmed trip cursor | Prior, current, and next-stop or decision-point context for the active leg | Cursor position is rider input, not train, boarding, transfer, or service evidence |
| Task 8 validity context | Reference or structural result, operating service date, schedule currency and anchor context when applicable, and every retained warning or veto | The card cannot strengthen, refresh, or clear Task 8 eligibility |
| Scheduled clock-time treatment | Exact covered departure time only when Task 8 admits it, labeled **Scheduled** with its Current schedule or Stale reference currency state | **Reference itinerary** and currency state do not replace **Scheduled**; never show a countdown |
| Service-pattern boundary | The Task 7 weekday-to-late-night boundary explanation when it applies to the captured trip | Preserve the owner-supplied explanation; do not select a pattern from phone time or recalculate it manually |

The card never exposes raw trip identifiers or implies that its station sequence is a current train's live remaining-stop sequence.

## Verified-only conditional content

Conditional content appears only when its owner supplies a complete eligible record for this exact trip. If exit, platform-zone, or contingency guidance is unavailable, incomplete, unverified, out of scope, or not enabled for Release 1, omit the entire module cleanly without a blank heading, disabled card, skeleton, “coming soon,” or missing-feature warning. Accessibility is not silently optional when it is relevant: without a complete eligible chain, withhold the positive path and do not present the result as satisfying Accessible Route Only.

| Conditional content | Admission requirement | Required retained context | Prohibited substitute |
|---|---|---|---|
| Exit guidance | Verified for the exact trip, station, direction, and destination and enabled in the current release | Exact exit identity, applicable leg or destination, purpose, verification context, and limitation | Nearest-looking exit, station-centroid guess, or unverified street instruction |
| Platform-zone guidance | Eligible owner-supplied Front, Middle, or Back record for the exact route, direction, platform orientation, and objective | Zone, objective, direction and orientation, certainty, and verification date | Car number without complete train-specific evidence, reversed orientation, or inferred zone |
| Accessible entrance and path chain | Required whenever accessibility is relevant; complete exact chain supplied by the accessibility owner | Street entrance, fare control or mezzanine, every passage and transfer, correct directional platform, boarding area, destination platform, exit path, street, and every required equipment identity and restriction | Complex-level badge, one elevator, partial chain, wrong-direction path, staircase substitution, or optimistic alternative |
| Previously verified contingency | One or two owner-supplied records whose applicability and action sequence match the captured trip | Trigger, affected leg, route and direction, stops and transfers, action sequence, accessibility result, verification context, claim-specific last-checked times, and limitations | Guessed alternative, current recommendation, automatic activation, or connection promise |

When zero verified contingencies are available, omit the contingency module completely. The card remains complete and presents no empty placeholder or invented fallback.

## Manual progress contract

The card provides the exact visible control **I'm at this stop**. It remains reachable without underground location, and an assistive label conveys the same rider-confirmed action.

Using **I'm at this stop** may change only:

- the rider-confirmed current stop or decision point;
- completed or prior-stop emphasis;
- current and next-stop context;
- current and next-instruction emphasis; and
- rider-confirmed destination completion.

The rider may explicitly correct the cursor backward or forward. A correction changes the same rider-confirmed state only.

Manual progress must never:

- refresh or rewrite capture time, service time, equipment time, guidance verification, contingency time, schedule anchor, currency age, or Last retrieved;
- change an evidence state, schedule currency state, service date, effective coverage, warning, veto, or owner-supplied claim;
- infer train movement, stop service, arrival, boarding, transfer success, platform, location, elevator operation, or current accessibility;
- clear an outage, service change, alert, reroute, invalidation, hard suppression, or unavailable state;
- replan the trip, select another service pattern, rank an alternative, or activate a contingency;
- turn historical or reference content into Live, Expected, on time, Actual now, Accessible now, or current truth; or
- require, synthesize, or silently record underground location or movement history.

Reopening, foregrounding, reading, scrolling, or completing the card likewise cannot refresh a claim or reset manual progress. Task 10's [offline and reconnection contract](offline-degraded-and-reconnection-states.md) preserves the same active card and manual cursor through every recovery stage: reconnection never resets progress and cannot use manual progress as operational evidence.

## Claim-specific freshness and schedule treatment

Capture time identifies when the active card was saved. It is never a substitute for a source claim's own last-checked, verification, publication, first-retrieval, or latest-retrieval time.

| Retained claim | Required time treatment | Offline interpretation |
|---|---|---|
| Service state or consequence | Keep the last-checked time attached to the exact route, direction, station, segment, leg, or trip claim | Historical observation only; not a current alert, reroute, closure, arrival, or normal-service claim |
| Equipment observation | Keep the last-checked time attached to the exact machine, connection, and path scope | Historical observation may remain readable, but current route-critical operation is **Unknown** |
| Exit or platform-zone guidance | Keep owner-supplied verification date and certainty attached to the exact guidance | Previously verified reference only; not proof that current access, platform, or service is unchanged |
| Contingency | Keep verification context and each service, equipment, guidance, or accessibility claim's own last-checked time | Previously verified reference only; never an automatically current recommendation |
| Schedule-derived clock time | Keep Task 8's truthful anchor, currency age, Last retrieved, effective coverage, operating service date, and applicable stale copy | Show **Scheduled** and a New York clock time only; never a countdown or advancing minute |

Rider-facing times use New York local time. Eligibility and freshness use the owner-supplied authoritative comparison, never the phone clock, manual progress, card capture time, foreground time, or time zone setting.

Apply the Task 8 schedule result without recomputation:

| Task 8 result | Card time treatment | Required labels and limits |
|---|---|---|
| **Current schedule** at `0 ≤ age ≤ 2 hours` | May retain the exact covered scheduled clock time after every veto passes | **Scheduled**, Current schedule, truthful Published or First retrieved age, Last retrieved, effective coverage, and service date |
| **Stale reference** at `2 hours < age ≤ 24 hours` | May retain the exact covered scheduled clock time after every veto passes | **Scheduled**, Stale reference, truthful anchor age, Last retrieved, effective coverage, service date, and exact **Stored schedule—service changes may differ** |
| **Topology only**, age greater than 24 hours, service-date mismatch, quarantine, supersession or coverage failure, or no eligible stored schedule | Remove departure and arrival time; preserve only the structural result Task 8 permits | No **Scheduled** evidence state, countdown, timed **Reference itinerary**, borrowed service date, or invented regular-GTFS time |

Offline passage can only weaken a schedule claim. Manual progress, an identical retrieval, card reopen, or recapture cannot reset age, undo supersession, clear a veto, or make Topology only timed.

## Offline accessibility treatment

Accessible Route Only remains as captured and cannot be silently relaxed to keep a timed, shorter, or otherwise convenient trip. The card consumes the complete exact chain and equipment identities supplied by the accessibility owner; it does not decide path validity.

The exact positive offline wording **Structurally step-free; live elevator status unavailable** appears only when Task 8's complete-chain condition passes. Every route-critical operational equipment state remains **Unknown** offline, even when inventory and a last-checked observation remain readable. Never show **Accessible now**, **Working**, **No official outage reported**, current outage absence, or an unverified substitute.

If any required entrance, constituent station, direction, platform, passage, destination exit, equipment identity, restriction, or verification context is missing, partial, contradictory, or unverified, withhold the positive structural wording and do not present the result as satisfying Accessible Route Only. A contingency must pass the same complete-path rule before it can be offered under Accessible Route Only.

## Previously verified contingency contract

Each retained contingency is a bounded reference record, not a current recommendation. It must state:

- exact applicability and trigger;
- affected origin, destination, leg, route, direction, stations, and transfers;
- ordered rider action sequence;
- owner-supplied accessibility result and complete chain when Accessible Route Only applies;
- claim-specific service, equipment, guidance, and accessibility last-checked or verification context; and
- known limitations.

Manual progress cannot refresh, trigger, rank, activate, or replan through a contingency. If a contingency no longer has a complete verified chain, exact service scope, or applicable trigger, omit it rather than weakening the owner's rule.

## Ownership and downstream boundaries

| Decision or content | Authoritative owner | Task 9 application |
|---|---|---|
| One active card, required content, conditional-module omission, claim-attached display, contingencies, and manual cursor | This contract, Task 9 | Own exactly; does not create broader history or operational truth |
| Stored presence, offline-open eligibility, **Reference itinerary**, structural-only result, schedule validity, **Scheduled**, currency labels, exact stale copy, and offline accessibility wording | [Offline content and validity contract](offline-content-and-validity-contract.md), Task 8, consuming Arrival Truth | Preserve exactly; the card cannot recompute, rename, strengthen, or refresh them |
| Weekday-to-late-night pattern selection and one-itinerary boundary explanation | [Map modes and journey behavior contract](map-modes-and-journey-behavior.md), Task 7 | Retain the supplied explanation when scenario 25 applies; do not decide it here |
| Service, service-change, schedule, time, veto, and recovery truth | Arrival Truth owners | Retain exact scope and time; never clear or recast the supplied result |
| Complete accessible path, Accessible Route Only, and equipment state | Companion accessibility owners | Consume exact path, direction, machine, status, and warning; fail closed while approvals or observed evidence remain Pending |
| Exit, platform-zone, transfer, and contingency guidance | Companion guidance owners | Include only exact eligible verified records; omit unavailable modules |
| Persistent Offline message, cached-current presentation, preserved screen, reconnection, and active-trip invalidation warning | [Offline, degraded, and reconnection states contract](offline-degraded-and-reconnection-states.md), Task 10 | Draft owner exists; preserve the same card and manual progress through its exact recovery sequence without creating global copy or recovery rules here |
| Retention, deletion, reset, synchronization, analytics, diagnostics, and broader personal-data rules | `docs/product/nearby-offline/location-and-personal-data-rules.md`, Task 12 | Draft owner artifact present; this contract records no policy for those decisions |
| Observed Nearby/offline cases | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Draft evidence ledger present; all expected walkthroughs and reviewer decisions remain **Not run — Pending** or **Pending** |

## Expected walkthroughs

Every walkthrough is an expected Draft fixture. None is an observed scenario pass, companion approval, Privacy decision, or release claim.

### TRIP-T24 — transfer trip and tunnel loss

| Walkthrough field | Expected result |
|---|---|
| Starting state | Before descent, the rider explicitly activates one trip with recognizable origin and destination, exact route and direction per leg, ordered stations, transfer instructions, one verified exit, one applicable previously verified contingency, claim-specific service and equipment times, and a Task 8-eligible schedule or structural result. |
| Connectivity change | Connectivity is lost before boarding. The card opens without an account or network wait under Task 10's [global Offline and preserved-screen behavior](offline-degraded-and-reconnection-states.md); station, direction, filters, map tuple, active card, manual cursor, scroll, focus, and reading position remain coherent. |
| Rider actions | Use **I'm at this stop** to confirm the origin, intermediate stops, the transfer decision point, the outgoing leg, and destination completion. |
| Progress result | Prior, current, next-stop, and instruction emphasis move only after rider confirmation. Service, equipment, guidance, contingency, schedule, warning, and validity records and times do not change. |
| Reconnection result | Task 10 refreshes the active trip in its exact five-stage order, presents any scoped invalidation warning before unrelated refresh, and preserves this card and its rider-confirmed cursor throughout. No arrival returns from one fresh snapshot, no trip is silently replanned, and no progress is reset. |
| Retained reference | Ordered stops and transfer instructions remain readable. The verified exit and contingency retain their original scope, verification, times, and limitations as stored reference, not current truth. |
| Destination result | Completion is rider-confirmed only; it does not prove train arrival, transfer success, service, equipment, or location. |
| Prohibited result | Inferred movement, refreshed timestamp, countdown, Live or current claim, cleared warning or veto, automatic replan, automatic contingency, hidden direction, or broader trip history |
| Evidence status | **Not run — Pending** — scenario 24, fixed card, assistive output, companion truth, and Task 14 observation are absent |

### TRIP-A01 — accessible complete chain

| Walkthrough field | Expected result |
|---|---|
| Starting state | Accessible Route Only is on and the companion owner supplies the exact complete origin-to-destination chain, direction, restrictions, and every route-critical equipment identity for the captured trip. |
| Stored card | Preserve the ordered accessible entrance, fare-control or mezzanine connection, passages, directional platforms, boarding area, transfer chain, destination platform, exit path, street connection, and equipment identities. |
| Offline state | Claim-specific equipment observations retain their last-checked times while every route-critical operational equipment state is **Unknown**. |
| Positive wording | Show **Structurally step-free; live elevator status unavailable** only while Task 8's complete structural-chain condition passes; never show **Accessible now**. |
| Manual progress | **I'm at this stop** changes only rider-confirmed cursor and instruction emphasis; it does not operate an elevator, verify a passage, clear a warning, or make the path current. |
| Failure branch | Any missing, partial, contradictory, wrong-direction, or unverified required edge suppresses the positive structural wording and the result under Accessible Route Only; do not promote an unverified contingency. |
| Evidence status | **Not run — Pending** — fixed accessible card, companion complete-path/equipment approval, assistive output, and Task 14 observation are absent |

### TRIP-M51 — Release 1 minimum complete

| Walkthrough field | Expected result |
|---|---|
| Starting state | Capture one trip for which exit guidance and platform-zone guidance are unavailable or not release-enabled. Run a verified-contingency branch with one applicable record and a zero-contingency branch with none available. |
| Required card | Preserve recognizable origin and destination, bound direction plus actual destination, route and ordered station sequence, transfer instructions, claim-specific service and equipment times, rider-confirmed prior/current/next progress, and Task 8 validity, schedule, service-date, warning, and accessibility context. |
| Conditional treatment | Omit exit and platform-zone modules in both branches. Retain the exact previously verified contingency in the applicable branch; omit the contingency module completely in the zero branch. Show no blank heading, disabled card, skeleton, “coming soon,” error treatment, or wording that calls either card incomplete. |
| Schedule treatment | If Task 8 admits a clock time, show it as **Scheduled** with the applicable Current schedule or Stale reference context; otherwise show no departure time. |
| Accessibility treatment | When accessibility is relevant, retain the complete verified chain and Unknown operational equipment treatment; minimum completeness never waives the chain. |
| Manual progress | **I'm at this stop** preserves prior/current/next context without changing any claim, time, warning, validity, or operational state. |
| Prohibited result | Invented exit, zone, contingency, time, service, current equipment condition, empty placeholder, countdown, or Live or **Accessible now** implication |
| Evidence status | **Not run — Pending** — scenario 51, fixed minimum card, assistive output, companion truth, and Task 14 observation are absent |

## Scenario traceability and pending evidence

| Source scenario or case | Task 9 application | Current evidence |
|---|---|---|
| §18.2 | One explicitly captured active card contains every core field, verified-only conditional content, claim-specific freshness, and manual progress without an account or connection | **Not run — Pending** |
| Scenario 24 | TRIP-T24 retains stops, transfer instructions, verified exit reference, verified contingency, and rider-confirmed progress through tunnel loss | **Not run — Pending** |
| Scenario 25 as applied | Preserve Task 7's weekday-to-late-night boundary explanation on the active card without recalculation or phone-clock selection | **Not run — Pending** |
| Derived accessible-trip walkthrough | TRIP-A01 retains the complete structural chain while operational equipment is Unknown and manual progress remains non-operational | **Not run — Pending**; companion Draft artifacts are present, but approvals and observed evidence remain Pending |
| Scenario 51 | TRIP-M51 remains complete without exit or platform-zone guidance, retains one or two verified contingencies when available, and omits the contingency module cleanly when zero are available | **Not run — Pending** |

Task 14 must observe every walkthrough against the same fixed version reviewed by Product, Accessibility, Data Quality, Content, and policy-required Privacy. Expected prose cannot advance this artifact to In review or Approved.

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Is exactly one active trip captured only after explicit rider activation and before descent, without an account, connection wait, passive history, or underground location requirement? | Required here; not observed. | Fixed capture/open observation and Privacy review |
| Does every card retain all core origin, destination, direction, route, station, transfer, claim-specific time, cursor, and Task 8 validity fields? | Required here; not observed. | Fixed complete-card inspection and assistive output |
| Are exit, platform-zone, accessible-path, and contingency fields admitted only from exact eligible verified owner records? | Yes by expected contract; companion artifacts are Draft and unapproved. | Companion approval and fixed conditional-module cases |
| Does the card retain one or two verified contingencies when available and omit the entire module without becoming incomplete when zero are available? | Yes by expected contract; not rendered. | Both TRIP-M51 contingency branches in visual and assistive observation |
| Does **I'm at this stop** change only rider-confirmed cursor, emphasis, and completion? | Yes by expected contract; not observed. | TRIP-T24 and TRIP-A01 state-transition records |
| Can manual progress refresh a timestamp, claim movement or current operation, clear a warning or veto, replan, activate a contingency, or change validity? | No. | Before/after claim-record comparison for every manual transition |
| Does every displayed schedule-derived clock time retain **Scheduled** plus the applicable currency and service-date context, never a countdown? | Required here; not observed. | Current, Stale, and topology-only fixed cards |
| Are route-critical operational equipment states Unknown offline, with positive structural wording limited to a complete exact chain? | Yes by expected contract; companion truth is absent. | TRIP-A01 plus companion complete-path/equipment evidence |
| Does the minimum-complete card omit unavailable guidance without blank or error treatment? | Yes by expected contract; not observed. | TRIP-M51 rendered and assistive observation |
| Is Privacy routing aligned between the artifact and Draft index row? | Yes; no Privacy decision or approval is implied. | Same-version Privacy decision with every other mandatory reviewer |
| Does this contract redefine retention, tracking, synchronization, analytics, diagnostics, Task 10 recovery, or companion truth? | No. It only preserves the card and manual progress through the linked Task 10 recovery behavior. | Cross-artifact review after Task 12 and companion artifacts exist |
| Does this Draft claim Gate 0 passage, scenario passage, companion approval, Privacy approval, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed evidence, all mandatory reviews, and the later release gate |
