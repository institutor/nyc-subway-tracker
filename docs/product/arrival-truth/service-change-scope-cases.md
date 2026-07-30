# Service-change scope acceptance cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§22, 27, and 31.2 scenarios 9–12; arrival-truth and service-changes plan Tasks 6 and 12 `Artifacts` and Task 6 `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md). They prove direction, route, segment, constituent-station, train, and shared-complex isolation for approved-specification scenarios 9–12. They do not create new alert meanings, trains, stops, platforms, impacts, or release authority.

The [core arrival contract](core-arrival-contract.md), [source role and precedence matrix](source-role-and-precedence-matrix.md), [evidence veto catalog](evidence-veto-catalog.md), and [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the observed result is recorded, and the Truth Gate accepts the evidence. Expected results written here are not passing evidence.

## Scenario 9 — Direction-specific planned work

**Setup**

Provide a planned alert with an active period or applicable early-display window, one route, one station or segment, and normalized direction metadata. The official text agrees with that structured scope. Provide coherent candidate trains for the affected direction, the opposite direction, and a station on the same route outside the scoped station or segment.

**Expected decision**

Treat time, route, station or segment, and direction as jointly constrained. Apply the resolved impact only to candidate claims inside all supported dimensions. For each affected candidate, use the actual consequence: keep it visible if its exact stop remains confirmed, or suppress it if the planned pattern or alert establishes that the exact stop is not served. Continue evaluating the opposite direction and out-of-scope station normally.

**Visible result**

The board shows the localized planned-work explanation only where relevant. Coherent trains in the opposite direction and at the out-of-scope station remain available. Details preserve the original official alert text even if the board uses a shorter plain-language summary.

**Prohibited outcome**

Do not treat the route field as line-wide scope, apply the alert to both directions, infer that every station on the route is affected, or invent a bypass not supported by the resolved impact. Missing metadata in a separate record must not be used as proof that a station is unaffected.

## Scenario 10 — Unresolved reroute scope

**Setup**

Provide an active reroute alert whose route and direction are supported but whose station or segment detail is absent, contradictory, or insufficient to construct a reliable stopping pattern. Include a fresh positive arrival prediction inside the materially unresolved route-direction, plus coherent service for another route or direction outside that scope.

**Expected decision**

Classify the reroute as a high-impact exception. Negative unresolved evidence controls over the positive prediction. Make the affected arrival claim unavailable for only the materially unresolved route-direction or narrower supported segment; do not guess which stations the train serves and do not assert a specific bypass. Record the ambiguity for quality review.

**Visible result**

Affected arrival rows are withheld and the original official reroute message remains available in details, with only a supported shorter summary if used. Coherent routes and directions outside the unresolved scope remain visible.

**Prohibited outcome**

Do not show the affected predicted arrival, construct a stop pattern from route identity or static schedules, suppress unrelated routes at a shared complex, hide the whole network, or turn absent station metadata into proof that all stations are unaffected.

## Scenario 11 — Delay-only service

**Setup**

Provide a current delay-only alert for a supported route, station or segment, and direction. Provide coherent trains whose exact directional stops, destinations, directions, movement, times, and other admission gates remain valid. No bypass, reroute, suspension, closure, track conflict, or other hard veto applies.

**Expected decision**

Keep every coherent train visible. Apply the delay only to the supported explanation and confidence treatment. The delay-only alert does not change stop admission, does not create Holding without train-specific holding evidence, and does not make an exact stop unavailable.

**Visible result**

Eligible trains retain their evidence-supported arrival rows with a localized delay explanation. The original official alert text remains in details.

**Prohibited outcome**

Do not suppress a coherent train, remove its stop call, widen the delay beyond the supported scope, replace the arrival with a static guess, or map a generic delay category to permanent bypass or suspension semantics.

## Scenario 12 — One constituent station closes inside a complex

**Setup**

Provide an active closure record that resolves to one constituent station or its exact boarding and alighting scope within a station complex. Provide affected arrival claims for that constituent station and coherent, independently eligible trains on unrelated routes serving another constituent station in the same complex. The official text and structured scope agree.

**Expected decision**

Suppress boarding, alighting, and arrival claims only at the resolved closed constituent station and applicable direction or route scope. Continue evaluating unrelated routes and constituent stations in the complex from their own evidence. Do not treat the recognized station-complex name as one exact stop or platform.

**Visible result**

The closure explanation appears at the narrowest relevant scope, and its original official text remains in details. Unrelated transfer services in the same complex remain visible and available.

**Prohibited outcome**

Do not suppress every route at the complex, invent closure of another constituent station, infer an unsupported platform closure, or hide unrelated services because they share a complex name.

## Additional scope boundaries

### Case S13 — Generic category without resolved consequence

**Setup**

Provide an active record with a generic **Affected** category and partial structured scope. Its official text does not establish a bypass, suspension, closure, delay, platform change, or other specific consequence.

**Expected decision**

Treat the category as a changeable descriptive label, not a permanent machine meaning. Do not assign a specific impact. If the record leaves a high-impact arrival claim materially unresolved, make only that claim unavailable; otherwise preserve the independently admitted train and show only supported context.

**Prohibited outcome**

Do not hard-code **Affected** as a bypass, infer normal service from missing detail, invent a stop or impact, or widen the record beyond its supported route, direction, station, or segment.

### Case S14 — Equipment impact without service closure

**Setup**

Provide a current elevator or escalator impact scoped to equipment and a path within one constituent station. Train arrivals remain coherent, and no station closure or stopping-pattern veto exists.

**Expected decision**

Keep train arrivals visible. Invalidate only the affected accessibility path or preference-dependent routing claim under its governing policy. Preserve other routes, constituent stations, and paths whose evidence remains valid.

**Prohibited outcome**

Do not suppress a train, convert equipment impact into a station closure, claim that unverified equipment is working, or generalize the impact to the full complex.

### Case S15 — Authorized correction remains negative or explanatory

**Setup**

Provide a logged authorized operational correction that clarifies an alert's affected segment, suppresses a known bad arrival, annotates supported service, or marks platform guidance unavailable.

**Expected decision**

Apply the correction only to its supported claim and scope. Retain its actor, time, evidence, transformation, and release condition in the review record. Require independent authoritative evidence for any later positive arrival.

**Prohibited outcome**

Do not let the correction fabricate movement, create a train or stop call, add an unsupported arrival, assign an unsupported platform, or clear a hard veto without authoritative evidence.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| Scenario 9 — Direction-specific planned work | Joint time, route, station or segment, and direction resolution; affected direction localized; opposite direction and out-of-scope station preserved; official text retained | Pending |
| Scenario 10 — Unresolved reroute scope | Positive prediction withheld only inside the materially unresolved route-direction or segment; no guessed pattern; unrelated service preserved; ambiguity recorded | Pending |
| Scenario 11 — Delay-only service | Every coherent train remains visible; delay changes only supported explanation or confidence; no stop suppression | Pending |
| Scenario 12 — Constituent-station closure | Closed constituent-station arrivals removed; unrelated transfer routes in the complex remain available; no invented platform or wider closure | Pending |
| S13 — Generic category | No permanent category mapping or invented consequence; any unavailable claim remains narrowly scoped | Pending |
| S14 — Equipment impact | Arrivals remain visible; only affected path or preference claim changes; unrelated service remains available | Pending |
| S15 — Authorized correction | Correction stays within supported negative or explanatory authority and creates no positive train claim | Pending |

For every run, capture the fixed reviewed product version, complete inputs, original official text, structured scope, admission and veto decisions, observed rider result, prohibited-result checks, date, and reviewer. Failures remain recorded and must link their correction and rerun.
