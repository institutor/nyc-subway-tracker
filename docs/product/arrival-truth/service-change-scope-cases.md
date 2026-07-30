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

Exercise the same planned alert in two runs. The alert names one route, one station or segment, and one normalized direction, and its official text agrees with that structured scope. Provide coherent candidate trains for the named direction, the opposite direction, and a station on the same route outside the scoped station or segment.

1. **Pre-active early display.** The alert is visible under applicable early-display guidance, but its supported operational window has not begun.
2. **Active operation.** Advance authoritative time into the supported operational window without changing the alert's route, station or segment, direction, or official text.

**Expected decision**

Treat time, route, station or segment, and direction as jointly constrained in both runs.

1. Before the operational window begins, early display is informational only. Keep every otherwise-admitted coherent train visible; the planned change cannot alter stop admission or suppress an arrival yet.
2. Once the supported operational window begins, apply the resolved impact only to candidate claims inside all supported dimensions. Keep an affected-direction train visible if its exact stop remains confirmed, or suppress it if active resolved evidence establishes that the exact stop is not served.

Continue evaluating the opposite direction and out-of-scope station normally in both runs.

**Visible result**

Before activation, the board may show a localized advance notice, but all otherwise-admitted arrivals remain visible. Once active, the localized operational consequence appears only where relevant. Coherent trains in the opposite direction and at the out-of-scope station remain available in both runs. Details preserve the original official alert text even if the board uses a shorter plain-language summary.

**Prohibited outcome**

Do not change stop admission, suppress an arrival, or apply any operational restriction during pre-active early display. Once active, do not treat the route field as line-wide scope, apply the alert to both directions, infer that every station on the route is affected, or invent a bypass not supported by the resolved impact. In either run, missing metadata in a separate record must not be used as proof that a station is unaffected.

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

Provide an active record with a generic **Affected** category and partial structured scope. Its official text does not establish a bypass, suspension, closure, delay, platform change, or other specific consequence. Provide an otherwise-admitted coherent train at the scoped exact directional stop. No independent structured record, official text, live stopping evidence, planned-pattern exclusion, or other evidence establishes or materially leaves unresolved a high-impact change.

**Expected decision**

Treat the category as a changeable descriptive label, not a permanent machine meaning. Do not assign a specific impact, veto, or high-impact exception. Keep the otherwise-admitted coherent train visible and show only the context that the generic record actually supports. Scenario 10 separately governs unavailability when independent reroute evidence establishes a materially unresolved high-impact change.

**Prohibited outcome**

Do not suppress the train or make its arrival claim unavailable from the generic category and non-specific text alone. Do not hard-code **Affected** as a bypass, infer a specific impact from missing detail, invent a stop or impact, or widen the record beyond its supported route, direction, station, or segment.

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
| Scenario 9 — Direction-specific planned work | Two-run boundary proof: pre-active early display is informational and changes no stop admission or arrival visibility; active resolved evidence may keep or suppress only the scoped direction; opposite direction and out-of-scope station remain preserved in both runs; official text retained | Pending |
| Scenario 10 — Unresolved reroute scope | Positive prediction withheld only inside the materially unresolved route-direction or segment; no guessed pattern; unrelated service preserved; ambiguity recorded | Pending |
| Scenario 11 — Delay-only service | Every coherent train remains visible; delay changes only supported explanation or confidence; no stop suppression | Pending |
| Scenario 12 — Constituent-station closure | Closed constituent-station arrivals removed; unrelated transfer routes in the complex remain available; no invented platform or wider closure | Pending |
| S13 — Generic category | Otherwise-admitted coherent train remains visible; generic category and non-specific text create no veto or high-impact exception; no suppression, unavailable claim, permanent category mapping, or invented consequence | Pending |
| S14 — Equipment impact | Arrivals remain visible; only affected path or preference claim changes; unrelated service remains available | Pending |
| S15 — Authorized correction | Correction stays within supported negative or explanatory authority and creates no positive train claim | Pending |

For every run, capture the fixed reviewed product version, complete inputs, original official text, structured scope, admission and veto decisions, observed rider result, prohibited-result checks, date, and reviewer. Failures remain recorded and must link their correction and rerun.
